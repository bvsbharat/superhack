"""
Deep Think Tactics Service

Generates halftime and real-time tactics using Gemini's deep think model
for complex strategic analysis based on live match data.
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any, List
import json
import re

import google.generativeai as genai

from config import settings
from models.schemas import GameState, AnalysisResult
from services.rag_context_store import RAGContextStore
from utils.logger import logger


@dataclass
class HalftimeTactics:
    """Halftime tactical recommendations with detailed game plan."""

    title: str
    summary: str
    offensive_strategy: str
    defensive_strategy: str
    key_formations: List[Dict[str, Any]]
    personnel_adjustments: List[Dict[str, str]]
    play_calling_priorities: List[str]
    counter_measures: List[str]
    probability_of_success: float
    confidence: float
    reasoning: str
    simulation_playbook: List[Dict[str, Any]]


class DeepThinkTacticsService:
    """
    Service for generating advanced tactics using Gemini's deep think model.

    Provides deep analysis for halftime strategies, complex play formations,
    and high-stakes tactical decisions based on accumulated game context.
    """

    def __init__(self):
        """Initialize the deep think tactics service."""
        self.context_store = RAGContextStore(max_items=500)
        self.model = None
        self._initialized = False
        self.think_model = None
        self.thinking_enabled = True

    def initialize(self) -> bool:
        """Initialize Gemini models."""
        if self._initialized:
            return True

        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not set. Deep think service disabled.")
            return False

        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            # Use flash model for fast iterations
            self.model = genai.GenerativeModel("gemini-2.5-flash")
            # Use pro model for deep think if available
            self.think_model = genai.GenerativeModel("gemini-2.5-pro")
            self._initialized = True
            logger.info("Deep think tactics service initialized")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize deep think service: {e}")
            self.model = genai.GenerativeModel("gemini-2.5-flash")
            self._initialized = True
            return True

    def add_game_event(
        self,
        event_type: str,
        description: str,
        timestamp: str,
        team: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Add game event to context for tactical analysis.

        Args:
            event_type: Type of event (pass, run, turnover, etc.)
            description: Event description
            timestamp: Game time when event occurred
            team: Associated team
            details: Additional event details
        """
        self.context_store.add_event(
            event_type=event_type,
            description=description,
            timestamp=timestamp,
            team=team,
            details=details,
        )

    def generate_halftime_tactics(
        self,
        game_state: GameState,
        possession_team: str = "KC",
        defense_team: str = "SF",
    ) -> Optional[HalftimeTactics]:
        """
        Generate comprehensive halftime tactics using deep analysis.

        Uses deep think model for complex strategy analysis and formation matching.

        Args:
            game_state: Current game state at halftime
            possession_team: Team with ball (e.g., 'KC')
            defense_team: Defending team (e.g., 'SF')

        Returns:
            Halftime tactics or None if generation fails
        """
        if not self._initialized and not self.initialize():
            logger.warning("Deep think service not initialized")
            return None

        try:
            # Retrieve ranked context from first half
            context_items = self.context_store.retrieve_ranked_context(
                query=f"offensive and defensive strategies for {possession_team}",
                top_k=20,
            )

            context_summary = self.context_store.get_context_summary(
                game_state=game_state.dict()
            )

            # Build comprehensive prompt for deep analysis
            prompt = self._build_halftime_prompt(
                game_state,
                possession_team,
                defense_team,
                context_summary,
            )

            # Use think model for extended reasoning if available
            model_to_use = self.think_model if self.think_model else self.model

            response = model_to_use.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.8,
                    max_output_tokens=4000,
                ) if model_to_use == self.think_model else None
            )

            # Parse response into structured tactics
            tactics = self._parse_halftime_tactics(
                response.text,
                game_state,
                possession_team,
                defense_team,
            )

            return tactics

        except Exception as e:
            logger.error(f"Halftime tactics generation failed: {e}")
            return None

    def generate_next_play_suggestion(
        self,
        game_state: GameState,
        recent_plays: List[Dict[str, Any]],
        possession_team: str = "KC",
    ) -> Optional[Dict[str, Any]]:
        """
        Generate next play suggestion based on game situation.

        Args:
            game_state: Current game state
            recent_plays: Last 5-10 plays from game
            possession_team: Team with ball

        Returns:
            Play suggestion with formation and probability
        """
        if not self._initialized and not self.initialize():
            return None

        try:
            prompt = f"""Analyze this football situation and suggest the optimal next play:

GAME STATE:
- Quarter: {game_state.quarter}
- Time: {game_state.clock}
- Down: {game_state.down}
- Distance: {game_state.distance} yards
- Possession: {possession_team}
- Score: {game_state.home_score} - {game_state.away_score}

RECENT PLAYS:
{json.dumps(recent_plays, indent=2)}

ANALYZE AND RECOMMEND:
1. Optimal play type (Pass/Run/Screen/Trick)
2. Formation to use
3. Key personnel
4. Expected success probability
5. Alternative options

Format as JSON with fields: play_type, formation, key_personnel, success_probability, reasoning"""

            response = self.model.generate_content(prompt)

            # Parse JSON response
            try:
                suggestion = json.loads(response.text)
                return suggestion
            except:
                return {"suggestion": response.text}

        except Exception as e:
            logger.error(f"Play suggestion generation failed: {e}")
            return None

    def _build_halftime_prompt(
        self,
        game_state: GameState,
        possession_team: str,
        defense_team: str,
        context_summary: str,
    ) -> str:
        """Build comprehensive halftime analysis prompt."""
        return f"""You are an elite NFL offensive and defensive coordinator with Super Bowl experience.
Analyze the first half and generate comprehensive halftime adjustments and tactics.

FIRST HALF SUMMARY:
{context_summary}

GAME STATE:
- Quarter: {game_state.quarter}
- Half: {"Second" if game_state.quarter > 2 else "First"}
- Current Score: {game_state.home_score} - {game_state.away_score}
- Possession: {possession_team}
- Down & Distance: {game_state.down} & {game_state.distance}
- Clock: {game_state.clock}

TEAMS:
- Offensive Team: {possession_team}
- Defensive Team: {defense_team}

ANALYZE AND PROVIDE:

1. OFFENSIVE STRATEGY (for {possession_team}):
   - Identify defensive weaknesses exploited successfully in first half
   - Identify defensive adjustments to expect
   - Recommend key formations for second half
   - Priority play calling strategy

2. DEFENSIVE STRATEGY (for {defense_team}):
   - Analyze opponent's offensive success patterns
   - Recommend defensive adjustments
   - Key personnel assignments
   - Coverage adjustments needed

3. PERSONNEL ADJUSTMENTS:
   - Which players to feature more/less
   - Rotation strategies
   - Injury management if applicable

4. TACTICAL PLAYBOOK:
   - 5-7 specific plays recommended for second half
   - Expected success rate for each
   - Situational uses (3rd & short, goal line, two-minute drill)

5. COUNTER STRATEGIES:
   - Expected opponent adjustments
   - How to counter them
   - Alternative play packages

6. PROBABILITY ANALYSIS:
   - Estimated probability of winning with these tactics
   - Critical success factors
   - Risk assessment

Format your response as valid JSON with this structure:
{{
  "title": "Second Half Tactical Game Plan",
  "summary": "Brief overview of strategy",
  "offensive_strategy": "Detailed offensive approach",
  "defensive_strategy": "Detailed defensive approach",
  "key_formations": [
    {{"name": "formation name", "when_to_use": "situation", "success_rate": 0.65}}
  ],
  "personnel_adjustments": [
    {{"player": "name", "action": "feature more/less/rotate", "reason": "why"}}
  ],
  "play_calling_priorities": ["priority 1", "priority 2", "priority 3"],
  "counter_measures": ["counter 1", "counter 2"],
  "probability_of_success": 0.72,
  "confidence": 0.85,
  "reasoning": "detailed analysis",
  "simulation_playbook": [
    {{"play_number": 1, "play_type": "pass", "formation": "11 personnel", "key_personnel": ["QB", "WR", "TE"], "expected_yards": 8, "success_probability": 0.68}}
  ]
}}"""

    def _parse_halftime_tactics(
        self,
        response_text: str,
        game_state: GameState,
        possession_team: str,
        defense_team: str,
    ) -> Optional[HalftimeTactics]:
        """Parse LLM response into HalftimeTactics object."""
        try:
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if not json_match:
                logger.error("No JSON found in tactics response")
                return None

            data = json.loads(json_match.group())

            return HalftimeTactics(
                title=data.get("title", "Second Half Strategy"),
                summary=data.get("summary", ""),
                offensive_strategy=data.get("offensive_strategy", ""),
                defensive_strategy=data.get("defensive_strategy", ""),
                key_formations=data.get("key_formations", []),
                personnel_adjustments=data.get("personnel_adjustments", []),
                play_calling_priorities=data.get("play_calling_priorities", []),
                counter_measures=data.get("counter_measures", []),
                probability_of_success=float(data.get("probability_of_success", 0.5)),
                confidence=float(data.get("confidence", 0.7)),
                reasoning=data.get("reasoning", ""),
                simulation_playbook=data.get("simulation_playbook", []),
            )

        except Exception as e:
            logger.error(f"Failed to parse halftime tactics: {e}")
            return None


# Global instance
deep_think_tactics_service = DeepThinkTacticsService()
