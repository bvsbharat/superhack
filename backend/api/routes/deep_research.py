"""
Deep Research API Routes

Endpoints for RAG-based strategy analysis and player recommendations.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from models.schemas import GameState
from services.deep_research import deep_research_service, StrategyInsight
from utils.logger import logger


# Request/Response schemas
class LiveEventRequest(BaseModel):
    """Request to add a live event to context."""

    event_type: str
    description: str
    timestamp: str
    team: Optional[str] = None
    player_name: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class DeepResearchQuery(BaseModel):
    """Request for deep research analysis."""

    query: str
    game_state: GameState
    focus_team: Optional[str] = None


class StrategyInsightResponse(BaseModel):
    """Response with strategy insights."""

    title: str
    description: str
    confidence: float
    player_recommendations: List[Dict[str, str]]
    play_types: List[str]
    reasoning: str
    quarter_context: str


class PlayerRecommendation(BaseModel):
    """Single player recommendation."""

    name: str
    position: str
    action: str


class PlayerRecommendationsResponse(BaseModel):
    """Response with player recommendations."""

    recommendations: List[PlayerRecommendation]
    team: str
    timestamp: str


class ContextStatsResponse(BaseModel):
    """Context store statistics."""

    total_items: int
    max_items: int
    items_by_importance: Dict[str, int]
    creation_time: str
    last_compression: str


# Create router
router = APIRouter(prefix="/api/deep-research", tags=["Deep Research"])


@router.post("/add-event", summary="Add live event to context")
async def add_event(request: LiveEventRequest) -> Dict[str, str]:
    """
    Add a live match event to the RAG context store.

    This is called as events are detected during the live game.
    Events are ranked by importance for later retrieval.
    """
    try:
        deep_research_service.add_live_event(
            event_type=request.event_type,
            description=request.description,
            timestamp=request.timestamp,
            team=request.team,
            player_name=request.player_name,
            details=request.details,
        )

        return {"status": "success", "message": "Event added to context"}

    except Exception as e:
        logger.error(f"Failed to add event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-strategy", response_model=StrategyInsightResponse, summary="Get strategy analysis")
async def analyze_strategy(request: DeepResearchQuery) -> StrategyInsightResponse:
    """
    Analyze current strategy based on a user query.

    Uses ranked context from live events to generate tactical insights
    and specific player recommendations for the current game situation.

    Example queries:
    - "What's their defensive weakness?"
    - "How should we attack in the second half?"
    - "Which players should we focus on?"
    """
    try:
        insight = deep_research_service.analyze_strategy(
            query=request.query,
            game_state=request.game_state,
        )

        if not insight:
            raise HTTPException(status_code=500, detail="Failed to generate strategy insight")

        return StrategyInsightResponse(
            title=insight.title,
            description=insight.description,
            confidence=insight.confidence,
            player_recommendations=insight.player_recommendations,
            play_types=insight.play_types,
            reasoning=insight.reasoning,
            quarter_context=insight.quarter_context,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Strategy analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask-question", summary="Ask a question about the game")
async def ask_question(request: DeepResearchQuery) -> Dict[str, str]:
    """
    Ask a detailed question about the current game with deep research.

    The system will use ranked context from recent plays to provide
    specific, actionable insights.
    """
    try:
        answer = deep_research_service.answer_question(
            query=request.query,
            game_state=request.game_state,
        )

        return {
            "question": request.query,
            "answer": answer,
            "team": request.focus_team or request.game_state.possession,
        }

    except Exception as e:
        logger.error(f"Question answering failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/player-recommendations", response_model=PlayerRecommendationsResponse, summary="Get player recommendations")
async def get_player_recommendations(
    game_state_quarter: int = Query(1),
    game_state_clock: str = Query("15:00"),
    game_state_possession: str = Query("KC"),
    focus_team: Optional[str] = Query(None),
) -> PlayerRecommendationsResponse:
    """
    Get specific player recommendations for the current situation.

    Returns actionable recommendations with player names and suggested actions.
    """
    try:
        # Build game state from query params
        game_state = GameState(
            quarter=game_state_quarter,
            clock=game_state_clock,
            possession=game_state_possession,
        )

        recommendations = deep_research_service.get_player_recommendations(
            game_state=game_state,
            focus_team=focus_team or game_state_possession,
        )

        return PlayerRecommendationsResponse(
            recommendations=[
                PlayerRecommendation(
                    name=rec["name"],
                    position=rec["position"],
                    action=rec["action"],
                )
                for rec in recommendations
            ],
            team=focus_team or game_state_possession,
            timestamp=f"{game_state_clock} Q{game_state_quarter}",
        )

    except Exception as e:
        logger.error(f"Failed to get player recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/context-stats", response_model=ContextStatsResponse, summary="Get context store statistics")
async def get_context_stats() -> ContextStatsResponse:
    """
    Get statistics about the RAG context store.

    Useful for monitoring context store health and optimization.
    """
    try:
        stats = deep_research_service.get_context_stats()

        return ContextStatsResponse(
            total_items=stats["total_items"],
            max_items=stats["max_items"],
            items_by_importance=stats["items_by_importance"],
            creation_time=stats["creation_time"],
            last_compression=stats["last_compression"],
        )

    except Exception as e:
        logger.error(f"Failed to get context stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clear-conversation", summary="Clear conversation history")
async def clear_conversation() -> Dict[str, str]:
    """Clear the conversation history."""
    try:
        deep_research_service.clear_conversation()
        return {"status": "success", "message": "Conversation history cleared"}
    except Exception as e:
        logger.error(f"Failed to clear conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset-context", summary="Reset context for new match")
async def reset_context() -> Dict[str, str]:
    """
    Reset the entire context store for a new match.

    This clears all stored events and conversation history.
    """
    try:
        deep_research_service.reset_context()
        return {"status": "success", "message": "Context store reset"}
    except Exception as e:
        logger.error(f"Failed to reset context: {e}")
        raise HTTPException(status_code=500, detail=str(e))
