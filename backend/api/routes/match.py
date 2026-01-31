"""
Match API Routes - Endpoints for match/session management
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database.connection import get_db
from services.match_service import MatchService
from utils.logger import logger

router = APIRouter()


# Request/Response models
class CreateMatchRequest(BaseModel):
    home_team: str = "KC"
    away_team: str = "SF"


class AddEventRequest(BaseModel):
    timestamp: str
    event: str
    details: str
    confidence: float


class AddHighlightRequest(BaseModel):
    timestamp: str
    event: str
    description: str
    confidence: float
    image_data: Optional[str] = None
    player_name: Optional[str] = None


class SaveSimulationSnapshotRequest(BaseModel):
    timestamp: str
    play_cycle: int
    sim_seconds_remaining: int
    quarter: int
    clock: str
    score_home: int
    score_away: int
    down: int
    distance: int
    possession: str
    line_of_scrimmage_y: float
    player_positions: Optional[dict] = None
    ball_x: float = 0.0
    ball_y: float = 0.0


class TeamPreferenceRequest(BaseModel):
    """Team selection and analytics configuration"""
    selected_team: str  # e.g., "KC"
    analytics_filter: str = "all"  # "all", "offensive", or "defensive"


class TeamPreferenceResponse(BaseModel):
    """Response for team preference configuration"""
    selected_team: str
    analytics_filter: str
    message: str

    class Config:
        from_attributes = True


class MatchResponse(BaseModel):
    id: str
    home_team: str
    away_team: str
    home_score: int
    away_score: int
    quarter: int
    clock: str
    status: str
    event_count: int
    highlight_count: int

    class Config:
        from_attributes = True


class EventResponse(BaseModel):
    id: int
    timestamp: str
    event: str
    details: str
    confidence: float
    player_name: Optional[str]
    team: Optional[str]
    yards: Optional[int]
    play_type: Optional[str]
    formation: Optional[str]
    is_explosive: bool
    is_turnover: bool
    is_scoring: bool
    epa_value: float

    class Config:
        from_attributes = True


class HighlightResponse(BaseModel):
    id: str
    timestamp: str
    event: str
    description: str
    confidence: float
    player_name: Optional[str]
    imageUrl: Optional[str]

    class Config:
        from_attributes = True


class MetricsResponse(BaseModel):
    epa: float
    wpa: float
    totalEvents: int
    turnoversForced: int
    turnoversLost: int
    turnoverDifferential: int
    redZoneAttempts: int
    redZoneTDs: int
    redZoneEfficiency: int
    thirdDownAttempts: int
    thirdDownConversions: int
    thirdDownRate: int
    explosiveRuns: int
    explosivePasses: int
    totalExplosivePlays: int
    playTypes: dict
    possessionPercentage: float
    avgPlayerSpeed: float
    maxPlayerSpeed: float
    routeEfficiency: float
    formations: list


class FullMatchDataResponse(BaseModel):
    match: dict
    events: List[dict]
    highlights: List[dict]
    metrics: Optional[dict]


# Routes

@router.post("/start", response_model=dict)
async def start_match(
    request: CreateMatchRequest = CreateMatchRequest(),
    db: Session = Depends(get_db)
):
    """Start a new match session"""
    match = MatchService.create_match(db, request.home_team, request.away_team)
    return {
        "message": "Match started",
        "match_id": match.id,
        "match": match.to_dict()
    }


@router.post("/restart", response_model=dict)
async def restart_match(db: Session = Depends(get_db)):
    """
    Restart match - clears current session and starts fresh.
    Previous match data is preserved in database for history.
    """
    match = MatchService.restart_match(db)
    return {
        "message": "Match restarted",
        "match_id": match.id,
        "match": match.to_dict()
    }


@router.get("/current", response_model=dict)
async def get_current_match(db: Session = Depends(get_db)):
    """Get current active match or create one"""
    match = MatchService.get_or_create_active_match(db)
    return match.to_dict()


@router.get("/current/full", response_model=FullMatchDataResponse)
async def get_current_match_full(
    event_limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get current match with all data (events, highlights, metrics)"""
    match = MatchService.get_or_create_active_match(db)
    events = MatchService.get_match_events(db, match.id, limit=event_limit)
    highlights = MatchService.get_match_highlights(db, match.id)
    metrics = MatchService.get_match_metrics(db, match.id)

    return {
        "match": match.to_dict(),
        "events": [e.to_dict() for e in events],
        "highlights": [h.to_dict() for h in highlights],
        "metrics": metrics.to_dict() if metrics else None,
    }


@router.post("/current/event", response_model=dict)
async def add_event(request: AddEventRequest, db: Session = Depends(get_db)):
    """Add an analysis event to the current match"""
    match = MatchService.get_or_create_active_match(db)
    event = MatchService.add_analysis_event(
        db=db,
        match_id=match.id,
        timestamp=request.timestamp,
        event_type=request.event,
        details=request.details,
        confidence=request.confidence,
    )
    return {
        "message": "Event added",
        "event": event.to_dict()
    }


@router.post("/current/highlight", response_model=dict)
async def add_highlight(request: AddHighlightRequest, db: Session = Depends(get_db)):
    """Add a highlight capture to the current match"""
    match = MatchService.get_or_create_active_match(db)
    highlight = MatchService.add_highlight(
        db=db,
        match_id=match.id,
        timestamp=request.timestamp,
        event_type=request.event,
        description=request.description,
        confidence=request.confidence,
        image_data=request.image_data,
        player_name=request.player_name,
    )
    return {
        "message": "Highlight added",
        "highlight": highlight.to_dict()
    }


@router.get("/current/events", response_model=List[dict])
async def get_events(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get events for current match"""
    match = MatchService.get_or_create_active_match(db)
    events = MatchService.get_match_events(db, match.id, limit=limit, offset=offset)
    return [e.to_dict() for e in events]


@router.get("/current/highlights", response_model=List[dict])
async def get_highlights(db: Session = Depends(get_db)):
    """Get highlights for current match"""
    match = MatchService.get_or_create_active_match(db)
    highlights = MatchService.get_match_highlights(db, match.id)
    return [h.to_dict() for h in highlights]


@router.get("/current/metrics", response_model=dict)
async def get_metrics(db: Session = Depends(get_db)):
    """Get metrics for current match"""
    match = MatchService.get_or_create_active_match(db)
    metrics = MatchService.get_match_metrics(db, match.id)
    if metrics:
        return metrics.to_dict()
    return {}


@router.post("/end/{match_id}")
async def end_match(match_id: str, db: Session = Depends(get_db)):
    """End a specific match"""
    match = MatchService.end_match(db, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return {"message": "Match ended", "match_id": match_id}


@router.get("/history", response_model=List[dict])
async def get_match_history(limit: int = 20, db: Session = Depends(get_db)):
    """Get match history"""
    matches = MatchService.get_all_matches(db, limit=limit)
    return [m.to_dict() for m in matches]


@router.get("/{match_id}", response_model=dict)
async def get_match(match_id: str, db: Session = Depends(get_db)):
    """Get a specific match by ID"""
    match = MatchService.get_match(db, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match.to_dict()


@router.get("/{match_id}/full", response_model=FullMatchDataResponse)
async def get_match_full(
    match_id: str,
    event_limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get a specific match with all data"""
    match = MatchService.get_match(db, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    events = MatchService.get_match_events(db, match_id, limit=event_limit)
    highlights = MatchService.get_match_highlights(db, match_id)
    metrics = MatchService.get_match_metrics(db, match_id)

    return {
        "match": match.to_dict(),
        "events": [e.to_dict() for e in events],
        "highlights": [h.to_dict() for h in highlights],
        "metrics": metrics.to_dict() if metrics else None,
    }


@router.post("/preference/team", response_model=TeamPreferenceResponse)
async def set_team_preference(
    preference: TeamPreferenceRequest,
):
    """
    Set the team selection and analytics filter preference.

    This endpoint stores the user's team selection and analytics configuration.
    - selected_team: The NFL team abbreviation (e.g., "KC", "SF", "PHI")
    - analytics_filter: "all" for all plays, "offensive" for offensive analysis, "defensive" for defensive analysis

    The frontend uses this to:
    1. Focus analytics on the selected team
    2. Filter events by offensive/defensive plays
    3. Synchronize team selection across UI components
    """
    # Validate team abbreviation (basic validation)
    valid_teams = [
        "KC", "PHI", "SF", "BUF", "MIA", "NE", "NYJ",
        "BAL", "CIN", "CLE", "PIT", "HOU", "IND", "JAX",
        "TEN", "LAC", "DEN", "LV", "DAL", "PHI", "WAS",
        "NYG", "TB", "NO", "ATL", "CAR", "GB", "DET",
        "MIN", "CHI", "LAR", "SEA", "ARI"
    ]

    if preference.selected_team.upper() not in valid_teams:
        raise HTTPException(status_code=400, detail=f"Invalid team: {preference.selected_team}")

    # Validate analytics filter
    if preference.analytics_filter not in ["all", "offensive", "defensive"]:
        raise HTTPException(status_code=400, detail="analytics_filter must be 'all', 'offensive', or 'defensive'")

    logger.info(f"Team preference updated: {preference.selected_team} with filter {preference.analytics_filter}")

    return TeamPreferenceResponse(
        selected_team=preference.selected_team,
        analytics_filter=preference.analytics_filter,
        message=f"Team preference set to {preference.selected_team} with {preference.analytics_filter} analytics"
    )


@router.post("/{match_id}/simulation/snapshot", response_model=dict)
async def save_simulation_snapshot(
    match_id: str,
    request: SaveSimulationSnapshotRequest,
    db: Session = Depends(get_db)
):
    """Save a simulation state snapshot"""
    # Verify match exists
    match = MatchService.get_match(db, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    snapshot = MatchService.save_simulation_snapshot(
        db=db,
        match_id=match_id,
        timestamp=request.timestamp,
        play_cycle=request.play_cycle,
        sim_seconds_remaining=request.sim_seconds_remaining,
        quarter=request.quarter,
        clock=request.clock,
        score_home=request.score_home,
        score_away=request.score_away,
        down=request.down,
        distance=request.distance,
        possession=request.possession,
        line_of_scrimmage_y=request.line_of_scrimmage_y,
        player_positions=request.player_positions,
        ball_x=request.ball_x,
        ball_y=request.ball_y,
    )

    return {
        "message": "Simulation snapshot saved",
        "snapshot": snapshot.to_dict()
    }


@router.get("/{match_id}/simulation/snapshots", response_model=List[dict])
async def get_simulation_snapshots(
    match_id: str,
    limit: int = 500,
    db: Session = Depends(get_db)
):
    """Get all simulation snapshots for a match"""
    # Verify match exists
    match = MatchService.get_match(db, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    snapshots = MatchService.get_simulation_snapshots(db, match_id, limit=limit)
    return [s.to_dict() for s in snapshots]
