from enum import Enum
from typing import Optional
import re


class PlayType(Enum):
    """Types of football plays."""

    PASS = "Pass"
    RUN = "Run"
    SACK = "Sack"
    SCRAMBLE = "Scramble"
    INTERCEPTION = "Interception"
    FUMBLE = "Fumble"
    TOUCHDOWN = "Touchdown"
    FIELD_GOAL = "Field Goal"
    PUNT = "Punt"
    KICKOFF = "Kickoff"
    PENALTY = "Penalty"
    TIMEOUT = "Timeout"
    TWO_POINT = "Two Point Conversion"
    UNKNOWN = "Unknown"


class PlayClassifier:
    """Classifies plays from text descriptions."""

    # Keywords for each play type
    PLAY_KEYWORDS = {
        PlayType.PASS: [
            "pass", "throw", "completion", "incomplete", "caught",
            "reception", "target", "air yards", "deep ball"
        ],
        PlayType.RUN: [
            "run", "rush", "carry", "hand-off", "handoff", "ground",
            "up the middle", "off tackle", "outside run"
        ],
        PlayType.SACK: ["sack", "tackled behind", "quarterback down"],
        PlayType.SCRAMBLE: ["scramble", "qb run", "quarterback runs"],
        PlayType.INTERCEPTION: ["interception", "intercepted", "pick", "int"],
        PlayType.FUMBLE: ["fumble", "fumbled", "lost ball", "turnover"],
        PlayType.TOUCHDOWN: ["touchdown", "td", "score", "end zone"],
        PlayType.FIELD_GOAL: ["field goal", "fg", "kick", "kicker"],
        PlayType.PUNT: ["punt", "punter", "kick away"],
        PlayType.KICKOFF: ["kickoff", "kick off", "opening kick"],
        PlayType.PENALTY: ["penalty", "flag", "foul", "holding", "offside"],
        PlayType.TIMEOUT: ["timeout", "time out"],
        PlayType.TWO_POINT: ["two point", "two-point", "2pt", "conversion"],
    }

    def classify(self, description: str) -> PlayType:
        """
        Classify a play based on its description.

        Args:
            description: Text description of the play

        Returns:
            PlayType enum value
        """
        if not description:
            return PlayType.UNKNOWN

        description_lower = description.lower()

        # Check for each play type
        scores = {}
        for play_type, keywords in self.PLAY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in description_lower)
            if score > 0:
                scores[play_type] = score

        if not scores:
            return PlayType.UNKNOWN

        # Return the play type with highest score
        # Priority: Turnovers > Scores > Regular plays
        priority_order = [
            PlayType.TOUCHDOWN,
            PlayType.INTERCEPTION,
            PlayType.FUMBLE,
            PlayType.SACK,
            PlayType.FIELD_GOAL,
            PlayType.PASS,
            PlayType.RUN,
            PlayType.SCRAMBLE,
            PlayType.PUNT,
            PlayType.KICKOFF,
            PlayType.PENALTY,
            PlayType.TWO_POINT,
            PlayType.TIMEOUT,
        ]

        for pt in priority_order:
            if pt in scores:
                return pt

        return max(scores.keys(), key=lambda k: scores[k])

    def classify_from_events(self, events: list) -> PlayType:
        """
        Classify play type from a list of analysis events.

        Args:
            events: List of AnalysisResult objects

        Returns:
            PlayType enum value
        """
        if not events:
            return PlayType.UNKNOWN

        # Combine all event descriptions
        combined = " ".join(
            f"{e.event} {e.details}" for e in events
        )
        return self.classify(combined)

    def extract_yards(self, description: str) -> Optional[int]:
        """
        Extract yards gained/lost from description.

        Args:
            description: Play description

        Returns:
            Yards as integer or None if not found
        """
        patterns = [
            r"(\d+)\s*yard",
            r"gain of (\d+)",
            r"loss of (\d+)",
            r"for (\d+)",
        ]

        for pattern in patterns:
            match = re.search(pattern, description.lower())
            if match:
                yards = int(match.group(1))
                if "loss" in description.lower():
                    yards = -yards
                return yards

        return None

    def is_turnover(self, play_type: PlayType) -> bool:
        """Check if play type is a turnover."""
        return play_type in [PlayType.INTERCEPTION, PlayType.FUMBLE]

    def is_scoring_play(self, play_type: PlayType) -> bool:
        """Check if play type is a scoring play."""
        return play_type in [PlayType.TOUCHDOWN, PlayType.FIELD_GOAL, PlayType.TWO_POINT]


# Global singleton
play_classifier = PlayClassifier()
