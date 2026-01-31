"""
SQLAlchemy Database Models for Super Bowl Analytics
"""
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, Boolean,
    ForeignKey, JSON, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
import uuid

from .connection import Base


class MatchStatus(enum.Enum):
    """Match status enum"""
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


class Match(Base):
    """
    Represents a live analysis session/match.
    Each time user starts analysis, a new match is created.
    """
    __tablename__ = "matches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Match info
    home_team = Column(String(10), default="KC")
    away_team = Column(String(10), default="SF")
    home_score = Column(Integer, default=0)
    away_score = Column(Integer, default=0)

    # Game state
    quarter = Column(Integer, default=1)
    clock = Column(String(10), default="15:00")
    possession = Column(String(10), default="KC")
    down = Column(Integer, default=1)
    distance = Column(Integer, default=10)

    # Status
    status = Column(SQLEnum(MatchStatus), default=MatchStatus.ACTIVE)

    # Relationships
    events = relationship("AnalysisEvent", back_populates="match", cascade="all, delete-orphan")
    highlights = relationship("MatchHighlight", back_populates="match", cascade="all, delete-orphan")
    metrics = relationship("MatchMetrics", back_populates="match", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "home_team": self.home_team,
            "away_team": self.away_team,
            "home_score": self.home_score,
            "away_score": self.away_score,
            "quarter": self.quarter,
            "clock": self.clock,
            "possession": self.possession,
            "down": self.down,
            "distance": self.distance,
            "status": self.status.value if self.status else None,
            "event_count": len(self.events) if self.events else 0,
            "highlight_count": len(self.highlights) if self.highlights else 0,
        }


class AnalysisEvent(Base):
    """
    Stores individual analysis events detected during the match.
    """
    __tablename__ = "analysis_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String(36), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Event data
    timestamp = Column(String(20))  # Game timestamp (e.g., "12:45")
    event_type = Column(String(100))  # e.g., "touchdown", "interception"
    details = Column(Text)  # Full description
    confidence = Column(Float, default=0.0)

    # Extracted data
    player_name = Column(String(100), nullable=True)
    team = Column(String(10), nullable=True)
    yards = Column(Integer, nullable=True)

    # Classification
    play_type = Column(String(50), nullable=True)  # pass, run, special
    formation = Column(String(100), nullable=True)
    is_explosive = Column(Boolean, default=False)
    is_turnover = Column(Boolean, default=False)
    is_scoring = Column(Boolean, default=False)

    # EPA calculation
    epa_value = Column(Float, default=0.0)

    # Raw data
    raw_data = Column(JSON, nullable=True)

    # Relationship
    match = relationship("Match", back_populates="events")

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "event": self.event_type,
            "details": self.details,
            "confidence": self.confidence,
            "player_name": self.player_name,
            "team": self.team,
            "yards": self.yards,
            "play_type": self.play_type,
            "formation": self.formation,
            "is_explosive": self.is_explosive,
            "is_turnover": self.is_turnover,
            "is_scoring": self.is_scoring,
            "epa_value": self.epa_value,
        }


class MatchHighlight(Base):
    """
    Stores captured highlight moments with images.
    """
    __tablename__ = "match_highlights"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    match_id = Column(String(36), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Highlight data
    timestamp = Column(String(20))
    event_type = Column(String(100))
    description = Column(Text)
    confidence = Column(Float, default=0.0)
    player_name = Column(String(100), nullable=True)

    # Image stored as base64 or file path
    image_data = Column(Text, nullable=True)  # Base64 encoded
    image_path = Column(String(500), nullable=True)  # File path alternative

    # Relationship
    match = relationship("Match", back_populates="highlights")

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "event": self.event_type,
            "description": self.description,
            "confidence": self.confidence,
            "player_name": self.player_name,
            "imageUrl": self.image_data or self.image_path,
        }


class SimulationSnapshot(Base):
    """
    Stores snapshots of simulation state captured during live simulations.
    """
    __tablename__ = "simulation_snapshots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    match_id = Column(String(36), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Simulation timing
    timestamp = Column(String(20))  # Game clock time
    play_cycle = Column(Integer, default=0)  # 0-39 second cycle
    sim_seconds_remaining = Column(Integer, default=0)  # Seconds left in simulation

    # Game state snapshot
    quarter = Column(Integer, default=1)
    clock = Column(String(10), default="15:00")
    score_home = Column(Integer, default=0)
    score_away = Column(Integer, default=0)
    down = Column(Integer, default=1)
    distance = Column(Integer, default=10)
    possession = Column(String(10), default="KC")
    line_of_scrimmage_y = Column(Float, default=0.0)

    # Player positions snapshot (JSON: {playerId: {x, y}})
    player_positions = Column(JSON, nullable=True)

    # Ball position
    ball_x = Column(Float, default=0.0)
    ball_y = Column(Float, default=0.0)

    # Relationship
    match = relationship("Match", foreign_keys=[match_id])

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "play_cycle": self.play_cycle,
            "sim_seconds_remaining": self.sim_seconds_remaining,
            "quarter": self.quarter,
            "clock": self.clock,
            "score": {
                "home": self.score_home,
                "away": self.score_away,
            },
            "down": self.down,
            "distance": self.distance,
            "possession": self.possession,
            "line_of_scrimmage_y": self.line_of_scrimmage_y,
            "player_positions": self.player_positions,
            "ball_position": {
                "x": self.ball_x,
                "y": self.ball_y,
            },
        }


class MatchMetrics(Base):
    """
    Aggregated metrics for a match, updated as events come in.
    """
    __tablename__ = "match_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String(36), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False, unique=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Core metrics
    total_epa = Column(Float, default=0.0)
    win_probability = Column(Float, default=50.0)

    # Turnover analysis
    turnovers_forced = Column(Integer, default=0)
    turnovers_lost = Column(Integer, default=0)

    # Red zone
    red_zone_attempts = Column(Integer, default=0)
    red_zone_touchdowns = Column(Integer, default=0)

    # Third down
    third_down_attempts = Column(Integer, default=0)
    third_down_conversions = Column(Integer, default=0)

    # Explosive plays
    explosive_runs = Column(Integer, default=0)
    explosive_passes = Column(Integer, default=0)

    # Play distribution
    pass_plays = Column(Integer, default=0)
    run_plays = Column(Integer, default=0)
    special_plays = Column(Integer, default=0)

    # Possession
    home_possession_pct = Column(Float, default=50.0)

    # Next Gen Stats style
    avg_player_speed = Column(Float, default=15.5)
    max_player_speed = Column(Float, default=21.2)
    route_efficiency = Column(Float, default=75.0)

    # Formations detected (JSON array)
    formations_detected = Column(JSON, default=list)

    # Relationship
    match = relationship("Match", back_populates="metrics")

    def to_dict(self):
        total_plays = self.pass_plays + self.run_plays + self.special_plays
        return {
            "epa": round(self.total_epa, 2),
            "wpa": round(self.win_probability, 1),
            "totalEvents": total_plays,
            "turnoversForced": self.turnovers_forced,
            "turnoversLost": self.turnovers_lost,
            "turnoverDifferential": self.turnovers_forced - self.turnovers_lost,
            "redZoneAttempts": self.red_zone_attempts,
            "redZoneTDs": self.red_zone_touchdowns,
            "redZoneEfficiency": round((self.red_zone_touchdowns / max(self.red_zone_attempts, 1)) * 100),
            "thirdDownAttempts": self.third_down_attempts,
            "thirdDownConversions": self.third_down_conversions,
            "thirdDownRate": round((self.third_down_conversions / max(self.third_down_attempts, 1)) * 100),
            "explosiveRuns": self.explosive_runs,
            "explosivePasses": self.explosive_passes,
            "totalExplosivePlays": self.explosive_runs + self.explosive_passes,
            "playTypes": {
                "pass": self.pass_plays,
                "run": self.run_plays,
                "special": self.special_plays,
            },
            "possessionPercentage": round(self.home_possession_pct, 1),
            "avgPlayerSpeed": self.avg_player_speed,
            "maxPlayerSpeed": self.max_player_speed,
            "routeEfficiency": self.route_efficiency,
            "formations": self.formations_detected or [],
        }
