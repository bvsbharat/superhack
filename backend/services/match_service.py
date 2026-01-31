"""
Match Service - Handles database operations for match/session management
"""
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
import re

from database.models import Match, AnalysisEvent, MatchHighlight, MatchMetrics, MatchStatus, SimulationSnapshot
from database.connection import get_db_session
from utils.logger import logger

# NFL team patterns for text extraction
TEAM_PATTERNS: Dict[str, List[str]] = {
    'PHI': ['philadelphia', 'eagles', 'phi'],
    'KC': ['kansas city', 'chiefs', 'kc', 'kcc'],
    'SF': ['san francisco', '49ers', 'sf', 'niners', 'sfo'],
    'DAL': ['dallas', 'cowboys', 'dal'],
    'GB': ['green bay', 'packers', 'gb', 'gbp'],
    'BUF': ['buffalo', 'bills', 'buf'],
    'BAL': ['baltimore', 'ravens', 'bal'],
    'CIN': ['cincinnati', 'bengals', 'cin'],
    'DET': ['detroit', 'lions', 'det'],
    'MIA': ['miami', 'dolphins', 'mia'],
    'NYG': ['giants', 'nyg', 'ny giants'],
    'NYJ': ['jets', 'nyj', 'ny jets'],
    'NE': ['new england', 'patriots', 'ne', 'nep'],
    'PIT': ['pittsburgh', 'steelers', 'pit'],
    'LAC': ['chargers', 'lac', 'la chargers', 'san diego'],
    'DEN': ['denver', 'broncos', 'den'],
    'LV': ['las vegas', 'raiders', 'lv', 'oakland'],
    'SEA': ['seattle', 'seahawks', 'sea'],
    'LA': ['rams', 'la rams', 'lar', 'st. louis'],
    'ARI': ['arizona', 'cardinals', 'ari', 'arz'],
    'ATL': ['atlanta', 'falcons', 'atl'],
    'CAR': ['carolina', 'panthers', 'car'],
    'CHI': ['chicago', 'bears', 'chi'],
    'CLE': ['cleveland', 'browns', 'cle'],
    'HOU': ['houston', 'texans', 'hou'],
    'IND': ['indianapolis', 'colts', 'ind'],
    'JAX': ['jacksonville', 'jaguars', 'jax', 'jac'],
    'MIN': ['minnesota', 'vikings', 'min'],
    'NO': ['new orleans', 'saints', 'no', 'nos'],
    'TB': ['tampa bay', 'buccaneers', 'tb', 'bucs', 'tbb'],
    'TEN': ['tennessee', 'titans', 'ten'],
    'WAS': ['washington', 'commanders', 'was', 'wsh'],
}


class MatchService:
    """Service for managing matches and analysis data in PostgreSQL"""

    _current_match_id: Optional[str] = None

    @classmethod
    def get_current_match_id(cls) -> Optional[str]:
        """Get the current active match ID"""
        return cls._current_match_id

    @classmethod
    def set_current_match_id(cls, match_id: Optional[str]):
        """Set the current active match ID"""
        cls._current_match_id = match_id

    @staticmethod
    def create_match(
        db: Session,
        home_team: str = "KC",
        away_team: str = "SF"
    ) -> Match:
        """Create a new match session"""
        match = Match(
            home_team=home_team,
            away_team=away_team,
            status=MatchStatus.ACTIVE,
        )
        db.add(match)
        db.commit()
        db.refresh(match)

        # Create initial metrics
        metrics = MatchMetrics(match_id=match.id)
        db.add(metrics)
        db.commit()

        MatchService.set_current_match_id(match.id)
        logger.info(f"Created new match: {match.id}")
        return match

    @staticmethod
    def get_match(db: Session, match_id: str) -> Optional[Match]:
        """Get a match by ID"""
        return db.query(Match).filter(Match.id == match_id).first()

    @staticmethod
    def get_active_match(db: Session) -> Optional[Match]:
        """Get the current active match"""
        match_id = MatchService.get_current_match_id()
        if match_id:
            match = MatchService.get_match(db, match_id)
            if match and match.status == MatchStatus.ACTIVE:
                return match

        # Find most recent active match
        match = db.query(Match).filter(
            Match.status == MatchStatus.ACTIVE
        ).order_by(Match.created_at.desc()).first()

        if match:
            MatchService.set_current_match_id(match.id)
        return match

    @staticmethod
    def get_or_create_active_match(db: Session) -> Match:
        """Get active match or create new one"""
        match = MatchService.get_active_match(db)
        if not match:
            match = MatchService.create_match(db)
        return match

    @staticmethod
    def end_match(db: Session, match_id: str) -> Optional[Match]:
        """End/complete a match"""
        match = MatchService.get_match(db, match_id)
        if match:
            match.status = MatchStatus.COMPLETED
            db.commit()
            if MatchService.get_current_match_id() == match_id:
                MatchService.set_current_match_id(None)
            logger.info(f"Ended match: {match_id}")
        return match

    @staticmethod
    def restart_match(db: Session) -> Match:
        """
        Restart match - ends current match and creates a new one.
        Previous data is preserved in database for history.
        """
        current_id = MatchService.get_current_match_id()
        if current_id:
            MatchService.end_match(db, current_id)

        new_match = MatchService.create_match(db)
        logger.info(f"Restarted match. Old: {current_id}, New: {new_match.id}")
        return new_match

    @staticmethod
    def add_analysis_event(
        db: Session,
        match_id: str,
        timestamp: str,
        event_type: str,
        details: str,
        confidence: float,
        raw_data: Optional[Dict] = None
    ) -> AnalysisEvent:
        """Add an analysis event and update metrics"""
        # Extract additional data from details
        player_name = MatchService._extract_player_name(details)
        yards = MatchService._extract_yards(details)
        play_type = MatchService._classify_play_type(details)
        formation = MatchService._extract_formation(details)
        epa_value = MatchService._calculate_epa(details, event_type)

        event = AnalysisEvent(
            match_id=match_id,
            timestamp=timestamp,
            event_type=event_type,
            details=details,
            confidence=confidence,
            player_name=player_name,
            yards=yards,
            play_type=play_type,
            formation=formation,
            is_explosive=MatchService._is_explosive(details, yards, play_type),
            is_turnover=MatchService._is_turnover(details, event_type),
            is_scoring=MatchService._is_scoring(details, event_type),
            epa_value=epa_value,
            raw_data=raw_data,
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        # Update metrics
        MatchService._update_metrics(db, match_id, event)

        return event

    @staticmethod
    def add_highlight(
        db: Session,
        match_id: str,
        timestamp: str,
        event_type: str,
        description: str,
        confidence: float,
        image_data: Optional[str] = None,
        player_name: Optional[str] = None
    ) -> MatchHighlight:
        """Add a highlight capture"""
        highlight = MatchHighlight(
            match_id=match_id,
            timestamp=timestamp,
            event_type=event_type,
            description=description,
            confidence=confidence,
            player_name=player_name or MatchService._extract_player_name(description),
            image_data=image_data,
        )
        db.add(highlight)
        db.commit()
        db.refresh(highlight)
        return highlight

    @staticmethod
    def get_match_events(
        db: Session,
        match_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[AnalysisEvent]:
        """Get events for a match"""
        return db.query(AnalysisEvent).filter(
            AnalysisEvent.match_id == match_id
        ).order_by(AnalysisEvent.created_at.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def get_match_highlights(db: Session, match_id: str) -> List[MatchHighlight]:
        """Get highlights for a match"""
        return db.query(MatchHighlight).filter(
            MatchHighlight.match_id == match_id
        ).order_by(MatchHighlight.created_at.desc()).all()

    @staticmethod
    def get_match_metrics(db: Session, match_id: str) -> Optional[MatchMetrics]:
        """Get metrics for a match"""
        return db.query(MatchMetrics).filter(
            MatchMetrics.match_id == match_id
        ).first()

    @staticmethod
    def get_all_matches(db: Session, limit: int = 20) -> List[Match]:
        """Get all matches (history)"""
        return db.query(Match).order_by(Match.created_at.desc()).limit(limit).all()

    @staticmethod
    def save_simulation_snapshot(
        db: Session,
        match_id: str,
        timestamp: str,
        play_cycle: int,
        sim_seconds_remaining: int,
        quarter: int,
        clock: str,
        score_home: int,
        score_away: int,
        down: int,
        distance: int,
        possession: str,
        line_of_scrimmage_y: float,
        player_positions: Optional[Dict[str, Dict[str, float]]] = None,
        ball_x: float = 0.0,
        ball_y: float = 0.0
    ) -> SimulationSnapshot:
        """Save a simulation state snapshot"""
        snapshot = SimulationSnapshot(
            match_id=match_id,
            timestamp=timestamp,
            play_cycle=play_cycle,
            sim_seconds_remaining=sim_seconds_remaining,
            quarter=quarter,
            clock=clock,
            score_home=score_home,
            score_away=score_away,
            down=down,
            distance=distance,
            possession=possession,
            line_of_scrimmage_y=line_of_scrimmage_y,
            player_positions=player_positions,
            ball_x=ball_x,
            ball_y=ball_y,
        )
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        return snapshot

    @staticmethod
    def get_simulation_snapshots(db: Session, match_id: str, limit: int = 500) -> List[SimulationSnapshot]:
        """Get all simulation snapshots for a match"""
        return db.query(SimulationSnapshot).filter(
            SimulationSnapshot.match_id == match_id
        ).order_by(SimulationSnapshot.created_at.asc()).limit(limit).all()

    # Team extraction methods

    @staticmethod
    def extract_team_from_text(text: str) -> Optional[str]:
        """
        Extract NFL team abbreviation from text.
        Searches for team names, city names, and abbreviations.
        """
        if not text:
            return None

        text_lower = text.lower()

        for abbrev, patterns in TEAM_PATTERNS.items():
            for pattern in patterns:
                if pattern in text_lower:
                    return abbrev

        # Also check for direct abbreviation matches (case insensitive)
        text_upper = text.upper()
        for abbrev in TEAM_PATTERNS.keys():
            # Match whole word abbreviation
            if re.search(rf'\b{abbrev}\b', text_upper):
                return abbrev

        return None

    @staticmethod
    def extract_teams_from_event(details: str, event_type: str) -> Dict[str, Optional[str]]:
        """
        Extract both home and away teams from event text.
        Returns dict with 'home' and 'away' keys.
        """
        combined_text = f"{details} {event_type}"

        # Find all unique teams mentioned
        found_teams = set()
        for abbrev, patterns in TEAM_PATTERNS.items():
            for pattern in patterns:
                if pattern in combined_text.lower():
                    found_teams.add(abbrev)
                    break

        teams_list = list(found_teams)

        if len(teams_list) >= 2:
            return {'home': teams_list[0], 'away': teams_list[1]}
        elif len(teams_list) == 1:
            return {'home': teams_list[0], 'away': None}
        else:
            return {'home': None, 'away': None}

    # Private helper methods

    @staticmethod
    def _extract_player_name(details: str) -> Optional[str]:
        """Extract player name from event details"""
        patterns = [
            r'([A-Z]\.\s*[A-Z][a-z]+)',
            r'([A-Z][a-z]+\s+[A-Z][a-z]+)',
            r'\b(?:QB|RB|WR|TE|K)\s+([A-Z][a-z]+)',
            r'#\d+\s+([A-Z][a-z]+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, details)
            if match:
                return match.group(1)
        return None

    @staticmethod
    def _extract_yards(details: str) -> Optional[int]:
        """Extract yard gain/loss from details"""
        match = re.search(r'(\d+)\s*yard', details.lower())
        if match:
            return int(match.group(1))
        return None

    @staticmethod
    def _classify_play_type(details: str) -> Optional[str]:
        """Classify play as pass, run, or special"""
        details_lower = details.lower()
        if any(word in details_lower for word in ['pass', 'throw', 'reception', 'catch', 'incomplete']):
            return 'pass'
        elif any(word in details_lower for word in ['run', 'rush', 'handoff', 'scramble']):
            return 'run'
        elif any(word in details_lower for word in ['kick', 'punt', 'field goal', 'extra point']):
            return 'special'
        return None

    @staticmethod
    def _extract_formation(details: str) -> Optional[str]:
        """Extract formation from details"""
        formations = ['shotgun', 'i-form', 'spread', 'pistol', 'singleback',
                      'empty', 'jumbo', 'goal line', 'nickel', 'dime', '4-3', '3-4']
        details_lower = details.lower()
        for formation in formations:
            if formation in details_lower:
                return formation.title()
        return None

    @staticmethod
    def _calculate_epa(details: str, event_type: str) -> float:
        """Calculate Expected Points Added for the event"""
        details_lower = details.lower()
        event_lower = event_type.lower()

        if 'touchdown' in details_lower or 'score' in event_lower:
            return 6.0 + (0.5 if 'pass' in details_lower else 0)
        elif 'first down' in details_lower:
            return 1.5
        elif 'interception' in details_lower or 'fumble' in details_lower:
            if 'forced' in details_lower or 'recovered' in details_lower:
                return 3.0
            return -4.5
        elif 'sack' in details_lower:
            return -1.5
        elif 'incomplete' in details_lower:
            return -0.5
        elif 'gain' in details_lower or 'yard' in details_lower:
            yards = MatchService._extract_yards(details)
            if yards:
                return (yards - 4) * 0.15
        return 0.0

    @staticmethod
    def _is_explosive(details: str, yards: Optional[int], play_type: Optional[str]) -> bool:
        """Check if play is explosive"""
        if yards:
            if play_type == 'run' and yards >= 12:
                return True
            if play_type == 'pass' and yards >= 20:
                return True
        return False

    @staticmethod
    def _is_turnover(details: str, event_type: str) -> bool:
        """Check if event is a turnover"""
        keywords = ['interception', 'fumble', 'turnover', 'pick']
        combined = f"{details} {event_type}".lower()
        return any(word in combined for word in keywords)

    @staticmethod
    def _is_scoring(details: str, event_type: str) -> bool:
        """Check if event is a scoring play"""
        keywords = ['touchdown', 'field goal', 'safety', 'score', 'td']
        combined = f"{details} {event_type}".lower()
        return any(word in combined for word in keywords)

    @staticmethod
    def _update_metrics(db: Session, match_id: str, event: AnalysisEvent):
        """Update match metrics based on new event"""
        metrics = db.query(MatchMetrics).filter(
            MatchMetrics.match_id == match_id
        ).first()

        if not metrics:
            metrics = MatchMetrics(match_id=match_id)
            db.add(metrics)

        # Update EPA and WPA
        metrics.total_epa += event.epa_value
        wpa_shift = event.epa_value * 1.5
        metrics.win_probability = max(5, min(95, metrics.win_probability + wpa_shift))

        # Update play counts
        if event.play_type == 'pass':
            metrics.pass_plays += 1
        elif event.play_type == 'run':
            metrics.run_plays += 1
        elif event.play_type == 'special':
            metrics.special_plays += 1

        # Update explosive plays
        if event.is_explosive:
            if event.play_type == 'pass':
                metrics.explosive_passes += 1
            else:
                metrics.explosive_runs += 1

        # Update turnovers
        if event.is_turnover:
            details_lower = event.details.lower()
            if 'forced' in details_lower or 'recovered' in details_lower:
                metrics.turnovers_forced += 1
            else:
                metrics.turnovers_lost += 1

        # Update third down
        if 'third down' in event.details.lower() or '3rd down' in event.details.lower():
            metrics.third_down_attempts += 1
            if 'conversion' in event.details.lower() or 'first down' in event.details.lower():
                metrics.third_down_conversions += 1

        # Update red zone
        if 'red zone' in event.details.lower() or 'inside 20' in event.details.lower():
            metrics.red_zone_attempts += 1
            if event.is_scoring:
                metrics.red_zone_touchdowns += 1

        # Update formations
        if event.formation:
            formations = metrics.formations_detected or []
            formation_entry = {"name": event.formation, "count": 1}
            # Update existing or add new
            found = False
            for f in formations:
                if f.get("name") == event.formation:
                    f["count"] = f.get("count", 0) + 1
                    found = True
                    break
            if not found:
                formations.append(formation_entry)
            metrics.formations_detected = formations

        db.commit()


# Singleton instance helper
match_service = MatchService()
