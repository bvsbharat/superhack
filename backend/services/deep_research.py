"""
Deep Research Service

Provides RAG-based deep research on live match data.
Generates strategy insights, player recommendations, and tactical analysis.
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any, List
import json
import re

import google.generativeai as genai

from config import settings
from models.schemas import GameState, AnalysisResult
from services.rag_context_store import RAGContextStore, ContextImportance
from utils.logger import logger


@dataclass
class StrategyInsight:
    """Strategy recommendation with supporting data."""

    title: str                          # e.g., "Exploit Weak Run Defense"
    description: str                    # Detailed recommendation
    confidence: float                   # 0-1 confidence score
    player_recommendations: List[Dict[str, str]]  # [{"name": "...", "role": "...", "action": "..."}]
    play_types: List[str]              # Recommended play types
    reasoning: str                      # Why this recommendation
    quarter_context: str               # Quarter/time context


class DeepResearchService:
    """
    Service for deep research on live match data.

    Combines RAG context retrieval with LLM analysis to generate
    strategic insights, player recommendations, and tactical analysis.
    """

    def __init__(self):
        """Initialize the deep research service."""
        self.context_store = RAGContextStore(max_items=500)
        self.model = None
        self._initialized = False
        self.conversation_history: List[Dict[str, str]] = []
        self.max_history = 10

    def initialize(self) -> bool:
        """Initialize Gemini model."""
        if self._initialized:
            return True

        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not set. Deep research disabled.")
            return False

        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel("gemini-3-pro-preview")
            self._initialized = True
            logger.info("Deep research service initialized")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize deep research: {e}")
            return False

    def add_live_event(
        self,
        event_type: str,
        description: str,
        timestamp: str,
        team: Optional[str] = None,
        player_name: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Add a live event to the context store.

        Args:
            event_type: Type of event
            description: Event description
            timestamp: MM:SS format
            team: Associated team
            player_name: Player involved
            details: Additional event details
        """
        # Determine importance based on event type
        importance_map = {
            "turnover": ContextImportance.CRITICAL,
            "interception": ContextImportance.CRITICAL,
            "fumble": ContextImportance.CRITICAL,
            "sack": ContextImportance.CRITICAL,
            "scoring": ContextImportance.CRITICAL,
            "touchdown": ContextImportance.CRITICAL,
            "field_goal": ContextImportance.CRITICAL,
            "formation_change": ContextImportance.HIGH,
            "explosive_play": ContextImportance.HIGH,
            "pass": ContextImportance.MEDIUM,
            "run": ContextImportance.MEDIUM,
            "tackle": ContextImportance.LOW,
        }

        importance = ContextImportance.MEDIUM
        for key, level in importance_map.items():
            if key.lower() in event_type.lower():
                importance = level
                break

        self.context_store.add_event(
            event_type=event_type,
            description=description,
            timestamp=timestamp,
            importance=importance,
            team=team,
            player_name=player_name,
            details=details,
        )

    def analyze_strategy(
        self,
        query: str,
        game_state: GameState,
    ) -> Optional[StrategyInsight]:
        """
        Analyze current strategy based on query and game state.

        Args:
            query: User question about strategy
            game_state: Current game state

        Returns:
            Strategy insight or None if analysis fails
        """
        if not self._initialized and not self.initialize():
            logger.warning("Deep research not initialized")
            return None

        try:
            # Retrieve ranked context
            context_items = self.context_store.retrieve_ranked_context(
                query=query,
                top_k=15,
            )

            # Build context summary
            context_summary = self.context_store.get_context_summary(
                game_state=game_state.dict()
            )

            # Build prompt with context
            system_prompt = """You are an expert NFL tactical analyst with deep knowledge of:
- Offensive and defensive strategies
- Player positioning and roles
- Game situation analysis
- Play calling and formation selection
- Opponent weakness exploitation

Provide insightful, actionable recommendations backed by specific plays, formations, and player assignments."""

            user_message = self._build_analysis_prompt(query, context_summary, game_state)

            # Add to conversation history
            self.conversation_history.append({"role": "user", "content": user_message})

            # Generate response
            response = self.model.generate_content(
                f"{system_prompt}\n\n{user_message}"
            )

            # Add to conversation history
            self.conversation_history.append({"role": "assistant", "content": response.text})

            # Trim history
            if len(self.conversation_history) > self.max_history:
                self.conversation_history = self.conversation_history[-self.max_history:]

            # Parse response into structured insight
            insight = self._parse_strategy_response(
                response.text,
                query,
                game_state
            )

            return insight

        except Exception as e:
            logger.error(f"Strategy analysis failed: {e}")
            return None

    def answer_question(
        self,
        query: str,
        game_state: GameState,
    ) -> str:
        """
        Answer a user question about the game with deep research.

        Args:
            query: User question
            game_state: Current game state

        Returns:
            Answer string
        """
        if not self._initialized and not self.initialize():
            return "Deep research service not available."

        try:
            # Retrieve context
            context_items = self.context_store.retrieve_ranked_context(
                query=query,
                top_k=15,
            )

            context_summary = self.context_store.get_context_summary(
                game_state=game_state.dict()
            )

            # Build prompt
            prompt = f"""You are analyzing a live NFL game. Answer this question with specific details:

QUESTION: {query}

GAME CONTEXT:
{context_summary}

INSTRUCTIONS:
- Be concise but detailed
- Reference specific plays or formations from the recent context
- Provide tactical reasoning
- Suggest specific player names when relevant
- Include confidence levels for key claims"""

            response = self.model.generate_content(prompt)

            # Store in conversation
            self.conversation_history.append({"role": "user", "content": query})
            self.conversation_history.append({"role": "assistant", "content": response.text})

            if len(self.conversation_history) > self.max_history:
                self.conversation_history = self.conversation_history[-self.max_history:]

            return response.text.strip()

        except Exception as e:
            logger.error(f"Question answering failed: {e}")
            return "Unable to generate response."

    def get_player_recommendations(
        self,
        game_state: GameState,
        focus_team: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get specific player recommendations for the current situation.

        Args:
            game_state: Current game state
            focus_team: Team to focus recommendations on

        Returns:
            List of player recommendations
        """
        if not self._initialized and not self.initialize():
            return []

        try:
            context_items = self.context_store.retrieve_ranked_context(
                query="player performance strength weakness",
                top_k=20,
                team_filter=focus_team,
            )

            context_summary = self.context_store.get_context_summary(
                game_state=game_state.dict()
            )

            prompt = f"""Analyze this game situation and recommend specific players and actions:

GAME CONTEXT:
{context_summary}

TEAM TO ANALYZE: {focus_team or game_state.possession}

TASK: Provide 3-5 specific player recommendations with their positions and suggested actions.
Format each as: PLAYER: [name] | POSITION: [QB/WR/RB/etc] | ACTION: [what they should do]

Be specific and actionable."""

            response = self.model.generate_content(prompt)

            # Parse player recommendations
            recommendations = self._parse_player_recommendations(response.text)

            return recommendations

        except Exception as e:
            logger.error(f"Failed to get player recommendations: {e}")
            return []

    def _build_analysis_prompt(
        self,
        query: str,
        context_summary: str,
        game_state: GameState,
    ) -> str:
        """Build the analysis prompt with context."""
        return f"""GAME SITUATION:
{context_summary}

COACHING QUESTION: {query}

ANALYSIS NEEDED:
1. Identify opponent weaknesses from recent plays
2. Suggest specific formations and plays to exploit
3. Recommend key players to involve
4. Explain the tactical reasoning
5. Provide confidence level (0-100%)

Format your response with clear sections and specific player names."""

    def _parse_strategy_response(
        self,
        response_text: str,
        query: str,
        game_state: GameState,
    ) -> StrategyInsight:
        """Parse LLM response into structured strategy insight."""
        try:
            # Extract confidence if mentioned
            confidence_match = re.search(r'confidence[:\s]+(\d+)%?', response_text, re.IGNORECASE)
            confidence = float(confidence_match.group(1)) / 100 if confidence_match else 0.75

            # Extract player recommendations
            player_recs = self._parse_player_recommendations(response_text)

            # Extract play types
            play_types = []
            play_keywords = ["power running", "spread", "screen pass", "deep ball", "short slant", "play action"]
            for keyword in play_keywords:
                if keyword.lower() in response_text.lower():
                    play_types.append(keyword)

            # Create title from query
            title = query[:50] + "..." if len(query) > 50 else query

            return StrategyInsight(
                title=title,
                description=response_text[:200] + "..." if len(response_text) > 200 else response_text,
                confidence=min(max(confidence, 0.0), 1.0),
                player_recommendations=player_recs,
                play_types=play_types,
                reasoning=response_text,
                quarter_context=f"Q{game_state.quarter} {game_state.clock}",
            )

        except Exception as e:
            logger.error(f"Failed to parse strategy response: {e}")
            return StrategyInsight(
                title="Strategic Analysis",
                description=response_text[:200],
                confidence=0.5,
                player_recommendations=[],
                play_types=[],
                reasoning=response_text,
                quarter_context=f"Q{game_state.quarter} {game_state.clock}",
            )

    def _parse_player_recommendations(self, text: str) -> List[Dict[str, str]]:
        """Extract player recommendations from text."""
        recommendations = []

        # Pattern: PLAYER: [name] | POSITION: [pos] | ACTION: [action]
        pattern = r'PLAYER:\s*([^|]+)\s*\|\s*POSITION:\s*([^|]+)\s*\|\s*ACTION:\s*([^|]+)'

        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            recommendations.append({
                "name": match.group(1).strip(),
                "position": match.group(2).strip(),
                "action": match.group(3).strip(),
            })

        return recommendations

    def clear_conversation(self) -> None:
        """Clear conversation history."""
        self.conversation_history.clear()

    def reset_context(self) -> None:
        """Reset the entire context store for a new match."""
        self.context_store.clear()
        self.conversation_history.clear()

    def get_context_stats(self) -> Dict[str, Any]:
        """Get context store statistics."""
        return self.context_store.get_stats()


# Global singleton instance
deep_research_service = DeepResearchService()
