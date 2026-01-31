from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from models.schemas import GameState, LiveStatsResponse, ScoreState
from services.state_manager import state_manager
from analytics.win_probability import win_probability_model
from analytics.epa_calculator import epa_calculator
from utils.logger import logger

router = APIRouter()


class ScoreUpdate(BaseModel):
    """Request body for score update."""

    home: Optional[int] = None
    away: Optional[int] = None


class ClockUpdate(BaseModel):
    """Request body for clock update."""

    clock: str
    quarter: Optional[int] = None


class PossessionUpdate(BaseModel):
    """Request body for possession update."""

    possession: str
    down: Optional[int] = None
    distance: Optional[int] = None


@router.get("/live_stats", response_model=LiveStatsResponse)
async def get_live_stats():
    """
    Get current live game statistics.

    Returns the current game state including score, clock,
    possession, and analytics.
    """
    return LiveStatsResponse(
        gameState=state_manager.state,
        homeTeam="KC",
        awayTeam="SF",
    )


@router.get("/game_state", response_model=GameState)
async def get_game_state():
    """Get current game state."""
    return state_manager.state


@router.post("/game_state/score")
async def update_score(update: ScoreUpdate):
    """Update game score."""
    await state_manager.update_score(home=update.home, away=update.away)

    # Recalculate win probability
    state = state_manager.state
    win_prob = win_probability_model.calculate_from_game_state(state.model_dump())
    await state_manager.update_play(state.lastPlay, win_prob=win_prob)

    return {"status": "updated", "state": state_manager.state}


@router.post("/game_state/clock")
async def update_clock(update: ClockUpdate):
    """Update game clock."""
    await state_manager.update_clock(clock=update.clock, quarter=update.quarter)

    # Recalculate win probability
    state = state_manager.state
    win_prob = win_probability_model.calculate_from_game_state(state.model_dump())
    await state_manager.update_play(state.lastPlay, win_prob=win_prob)

    return {"status": "updated", "state": state_manager.state}


@router.post("/game_state/possession")
async def update_possession(update: PossessionUpdate):
    """Update possession and down/distance."""
    if update.possession not in ["KC", "SF"]:
        raise HTTPException(status_code=400, detail="Possession must be KC or SF")

    await state_manager.update_possession(
        possession=update.possession,
        down=update.down,
        distance=update.distance,
    )

    return {"status": "updated", "state": state_manager.state}


@router.post("/game_state/reset")
async def reset_game_state():
    """Reset game state to initial values."""
    state_manager.reset()
    return {"status": "reset", "state": state_manager.state}


@router.get("/analytics/epa")
async def get_epa():
    """
    Get Expected Points Added analysis.

    Returns EPA for current game situation.
    """
    state = state_manager.state

    # Calculate EP for current situation
    ep = epa_calculator.calculate_ep(
        down=state.down,
        distance=state.distance,
        yard_line=35,  # Default assumption
        is_own_territory=False,
    )

    return {
        "current_ep": ep,
        "situation": {
            "down": state.down,
            "distance": state.distance,
            "possession": state.possession,
        },
    }


@router.get("/analytics/win_probability")
async def get_win_probability():
    """
    Get win probability analysis.

    Returns win probability for both teams based on current state.
    """
    state = state_manager.state
    win_prob = win_probability_model.calculate_from_game_state(state.model_dump())

    # Adjust for which team has possession
    if state.possession == "KC":
        home_prob = win_prob
        away_prob = 100 - win_prob
    else:
        away_prob = win_prob
        home_prob = 100 - win_prob

    return {
        "home_team": "KC",
        "away_team": "SF",
        "home_win_probability": round(home_prob, 1),
        "away_win_probability": round(away_prob, 1),
        "factors": {
            "score_differential": state.score.home - state.score.away,
            "quarter": state.quarter,
            "clock": state.clock,
            "possession": state.possession,
        },
    }
