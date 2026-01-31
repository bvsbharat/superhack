from pydantic import BaseModel, Field
from typing import Literal, Optional, Dict, Any, Union


class DetectedTeams(BaseModel):
    """Teams detected from video analysis."""
    home: Optional[str] = None
    away: Optional[str] = None


class GameInfo(BaseModel):
    """Live game state extracted from video frame scoreboard."""
    home_team: Optional[str] = None
    away_team: Optional[str] = None
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    quarter: Optional[int] = None
    game_time: Optional[str] = None
    down: Optional[int] = None
    distance: Optional[int] = None
    yard_line: Optional[int] = None
    possession: Optional[str] = None


class AnalysisResult(BaseModel):
    """Single analysis result for a video frame/moment."""

    timestamp: str = Field(..., description="Timestamp in MM:SS format")
    event: str = Field(..., description="Type of event detected")
    details: str = Field(..., description="Detailed description of the event")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    player_name: Optional[str] = Field(None, description="Extracted player name")
    team: Optional[str] = Field(None, description="Team associated with the event")
    yards: Optional[int] = Field(None, description="Yards gained/lost")
    play_type: Optional[str] = Field(None, description="Type of play (pass, run, special)")
    formation: Optional[str] = Field(None, description="Detected formation")
    is_explosive: bool = Field(False, description="Whether the play was explosive")
    is_turnover: bool = Field(False, description="Whether the play was a turnover")
    is_scoring: bool = Field(False, description="Whether the play was a scoring play")
    epa_value: float = Field(0.0, description="Expected Points Added")
    detected_teams: Optional[Dict[str, Optional[str]]] = Field(None, description="Teams detected from scoreboard")
    game_info: Optional[Dict[str, Union[str, int, None]]] = Field(None, description="Live game state from scoreboard")


class VideoAnalysisResponse(BaseModel):
    """Response for video analysis endpoint."""

    analysis: list[AnalysisResult]


class PlayerStats(BaseModel):
    """Player statistics."""

    passes: int = 0
    completions: int = 0
    yards: int = 0
    touchdowns: int = 0
    interceptions: int = 0


class Player(BaseModel):
    """Player information."""

    id: str
    name: str
    role: str = Field(..., description="Position (QB, WR, RB, etc.)")
    team: str = Field(..., description="Team abbreviation (e.g., KC, PHI, SF)")
    speed: float = 0.0
    stats: PlayerStats = Field(default_factory=PlayerStats)


class ScoreState(BaseModel):
    """Current score."""

    home: int = 0
    away: int = 0


class GameState(BaseModel):
    """Current state of the game."""

    clock: str = "15:00"
    quarter: int = Field(1, ge=1, le=4)
    score: ScoreState = Field(default_factory=ScoreState)
    down: int = Field(1, ge=1, le=4)
    distance: int = 10
    possession: str = Field("KC", description="Team abbreviation with possession")
    homeTeam: str = Field("KC", description="Home team abbreviation")
    awayTeam: str = Field("PHI", description="Away team abbreviation")
    lastPlay: str = "Ready for kickoff."
    winProb: float = Field(50.0, ge=0.0, le=100.0)
    offensiveEpa: float = 0.0
    defensiveStopRate: float = 50.0
    engagement: str = "0"


class LiveStatsResponse(BaseModel):
    """Response for live stats endpoint."""

    gameState: GameState
    homeTeam: str = "KC"
    awayTeam: str = "SF"


class FrameAnalysis(BaseModel):
    """Analysis result for a single frame."""

    frame_number: int
    timestamp_seconds: float
    events: list[AnalysisResult]
    raw_description: str = ""
