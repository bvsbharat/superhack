"""
RAG Context Store for Deep Research

Manages live match data with ranking and retrieval for deep research queries.
Implements context compression and relevance scoring.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, List, Any
import json
from enum import Enum

from utils.logger import logger


class ContextImportance(str, Enum):
    """Importance levels for context items."""
    CRITICAL = "critical"      # Turnovers, scoring plays, key stops
    HIGH = "high"              # Explosive plays, formation changes
    MEDIUM = "medium"          # Regular plays, position changes
    LOW = "low"                # Minor events, routine plays


@dataclass
class ContextItem:
    """Single item in the RAG context store."""

    id: str                                    # Unique identifier
    timestamp: str                             # MM:SS format
    event_type: str                            # pass, run, turnover, etc.
    description: str                           # Event description
    importance: ContextImportance              # Importance level
    team: Optional[str] = None                 # Associated team
    player_name: Optional[str] = None          # Player involved
    details: Dict[str, Any] = field(default_factory=dict)  # Additional data
    recency_score: float = 1.0                # Based on time (0-1)
    relevance_score: float = 1.0              # Based on content (0-1)

    def get_rank_score(self) -> float:
        """Calculate combined ranking score."""
        importance_weight = {
            ContextImportance.CRITICAL: 1.0,
            ContextImportance.HIGH: 0.8,
            ContextImportance.MEDIUM: 0.6,
            ContextImportance.LOW: 0.4,
        }

        importance_mult = importance_weight[self.importance]
        return (self.recency_score + self.relevance_score) * importance_mult / 2

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "event_type": self.event_type,
            "description": self.description,
            "importance": self.importance.value,
            "team": self.team,
            "player_name": self.player_name,
            "details": self.details,
            "rank_score": self.get_rank_score(),
        }


class RAGContextStore:
    """
    Manages context for deep research RAG.

    Stores live match events with ranking and retrieval capabilities.
    Implements context compression and relevance scoring.
    """

    def __init__(self, max_items: int = 500, compression_threshold: int = 100):
        """
        Initialize the RAG context store.

        Args:
            max_items: Maximum items to keep in store
            compression_threshold: Trigger context compression at this size
        """
        self.max_items = max_items
        self.compression_threshold = compression_threshold
        self.items: Dict[str, ContextItem] = {}
        self.event_counter = 0
        self.creation_time = datetime.now()
        self.last_compression_time = datetime.now()

    def add_event(
        self,
        event_type: str,
        description: str,
        timestamp: str,
        importance: ContextImportance = ContextImportance.MEDIUM,
        team: Optional[str] = None,
        player_name: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Add a new event to the context store.

        Args:
            event_type: Type of event (pass, run, turnover, etc.)
            description: Event description
            timestamp: MM:SS format
            importance: Importance level
            team: Associated team
            player_name: Player involved
            details: Additional event details

        Returns:
            Event ID
        """
        self.event_counter += 1
        event_id = f"event_{self.event_counter}_{timestamp.replace(':', '')}"

        # Calculate initial scores
        recency_score = 1.0  # New events have high recency
        relevance_score = self._calculate_relevance_score(event_type, description)

        item = ContextItem(
            id=event_id,
            timestamp=timestamp,
            event_type=event_type,
            description=description,
            importance=importance,
            team=team,
            player_name=player_name,
            details=details or {},
            recency_score=recency_score,
            relevance_score=relevance_score,
        )

        self.items[event_id] = item

        logger.debug(f"Added context item: {event_id} (importance: {importance})")

        # Check if compression needed
        if len(self.items) > self.compression_threshold:
            self._compress_context()

        return event_id

    def retrieve_ranked_context(
        self,
        query: Optional[str] = None,
        top_k: int = 20,
        importance_filter: Optional[ContextImportance] = None,
        team_filter: Optional[str] = None,
    ) -> List[ContextItem]:
        """
        Retrieve top-ranked context items for a query.

        Args:
            query: Optional query string for relevance scoring
            top_k: Number of items to retrieve
            importance_filter: Filter by importance level
            team_filter: Filter by team

        Returns:
            Ranked list of context items
        """
        filtered_items = self.items.values()

        # Apply filters
        if importance_filter:
            filtered_items = [
                item for item in filtered_items
                if item.importance.value >= importance_filter.value
            ]

        if team_filter:
            filtered_items = [
                item for item in filtered_items
                if item.team == team_filter
            ]

        # Update relevance scores if query provided
        if query:
            for item in filtered_items:
                item.relevance_score = self._calculate_relevance_score(
                    item.event_type,
                    item.description,
                    query
                )

        # Update recency scores
        for item in filtered_items:
            item.recency_score = self._calculate_recency_score(item.timestamp)

        # Sort by rank score
        sorted_items = sorted(
            filtered_items,
            key=lambda x: x.get_rank_score(),
            reverse=True
        )

        return sorted_items[:top_k]

    def get_context_summary(self, game_state: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate a text summary of current context for LLM.

        Args:
            game_state: Current game state info

        Returns:
            Formatted context string
        """
        # Get top items
        top_items = self.retrieve_ranked_context(top_k=15)

        summary_parts = []

        # Add game state if provided
        if game_state:
            summary_parts.append(f"Quarter: {game_state.get('quarter', 1)}")
            summary_parts.append(f"Clock: {game_state.get('clock', '15:00')}")
            score = game_state.get('score', {})
            summary_parts.append(f"Score: {score.get('home', 0)} - {score.get('away', 0)}")
            summary_parts.append(f"Down/Distance: {game_state.get('down', 1)}/{game_state.get('distance', 10)}")
            summary_parts.append(f"Possession: {game_state.get('possession', 'Team')}")
            summary_parts.append("")

        # Add context items
        summary_parts.append("Recent Events:")
        for item in top_items:
            rank_score = item.get_rank_score()
            summary_parts.append(
                f"[{item.timestamp}] {item.event_type.upper()} "
                f"({item.importance.value}) - {item.description}"
            )
            if item.player_name:
                summary_parts.append(f"  Player: {item.player_name}")
            if item.team:
                summary_parts.append(f"  Team: {item.team}")

        return "\n".join(summary_parts)

    def _calculate_relevance_score(
        self,
        event_type: str,
        description: str,
        query: Optional[str] = None,
    ) -> float:
        """Calculate relevance score for an event."""
        base_score = 0.5

        # Boost score based on event type importance
        important_types = {
            "pass": 0.7, "run": 0.7, "turnover": 0.9,
            "scoring": 0.95, "sack": 0.8, "interception": 0.9,
            "fumble": 0.9, "touchdown": 0.95, "field_goal": 0.85,
        }

        for event_key, score in important_types.items():
            if event_key.lower() in event_type.lower():
                base_score = score
                break

        # Boost if query matches description
        if query:
            query_lower = query.lower()
            description_lower = description.lower()

            if query_lower in description_lower:
                base_score = min(base_score + 0.3, 1.0)

            # Check for specific keywords
            keywords = query_lower.split()
            matches = sum(1 for kw in keywords if len(kw) > 3 and kw in description_lower)
            base_score = min(base_score + (matches * 0.1), 1.0)

        return min(max(base_score, 0.0), 1.0)

    def _calculate_recency_score(self, timestamp: str) -> float:
        """Calculate recency score based on timestamp."""
        try:
            parts = timestamp.split(":")
            minutes = int(parts[0])
            seconds = int(parts[1]) if len(parts) > 1 else 0
            total_seconds = minutes * 60 + seconds

            # More recent = higher score
            # 15:00 = ~900 seconds, so normalize
            recency = 1.0 - (total_seconds / 900.0)
            return min(max(recency, 0.0), 1.0)
        except:
            return 0.5

    def _compress_context(self) -> None:
        """
        Compress context by removing low-ranking items.
        Keeps top items and aggregates older data.
        """
        logger.info(f"Compressing context store (current size: {len(self.items)})")

        # Get all items sorted by rank
        all_items = sorted(
            self.items.values(),
            key=lambda x: x.get_rank_score(),
            reverse=True
        )

        # Keep top 60% of items by rank
        keep_count = int(len(all_items) * 0.6)
        items_to_keep = set(item.id for item in all_items[:keep_count])

        # Remove low-ranking items
        removed_ids = [
            item_id for item_id in self.items
            if item_id not in items_to_keep
        ]

        for item_id in removed_ids:
            del self.items[item_id]

        self.last_compression_time = datetime.now()
        logger.info(f"Removed {len(removed_ids)} low-ranking items. New size: {len(self.items)}")

    def clear(self) -> None:
        """Clear all context items."""
        self.items.clear()
        self.event_counter = 0
        logger.info("Context store cleared")

    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the context store."""
        items_by_importance = {}
        for item in self.items.values():
            importance = item.importance.value
            items_by_importance[importance] = items_by_importance.get(importance, 0) + 1

        return {
            "total_items": len(self.items),
            "max_items": self.max_items,
            "items_by_importance": items_by_importance,
            "creation_time": self.creation_time.isoformat(),
            "last_compression": self.last_compression_time.isoformat(),
        }
