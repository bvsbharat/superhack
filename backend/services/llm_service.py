import base64
import re
from typing import Optional
import google.generativeai as genai
from PIL import Image
import io

from config import settings
from models.schemas import AnalysisResult
from utils.logger import logger


class LLMService:
    """Service for interacting with Gemini Vision API."""

    def __init__(self):
        self._model = None
        self._initialized = False

    def initialize(self) -> bool:
        """Initialize the Gemini client."""
        if self._initialized:
            return True

        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not set. LLM features disabled.")
            return False

        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._model = genai.GenerativeModel("gemini-3-flash-preview")
            self._initialized = True
            logger.info("Gemini Vision API initialized with gemini-3-flash-preview")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")
            return False

    async def analyze_frame(self, image: Image.Image, timestamp: str) -> list[AnalysisResult]:
        """
        Analyze a single video frame for football events.

        Args:
            image: PIL Image of the frame
            timestamp: Timestamp string for this frame

        Returns:
            List of detected events
        """
        if not self._initialized:
            if not self.initialize():
                return self._generate_fallback_analysis(timestamp)

        prompt = """Analyze this football game frame. Identify:
1. The current formation (offensive/defensive)
2. Player positions and movements
3. Ball location if visible
4. Type of play (pass, run, kick, etc.)
5. Any significant events (completion, tackle, sack, etc.)

Respond in this exact format for each event detected:
EVENT: <event type>
DETAILS: <detailed description including player names if visible>
CONFIDENCE: <0.0-1.0>

If multiple events, separate with ---"""

        try:
            response = self._model.generate_content([prompt, image])
            return self._parse_analysis_response(response.text, timestamp)
        except Exception as e:
            logger.error(f"Frame analysis failed: {e}")
            return self._generate_fallback_analysis(timestamp)

    def _parse_analysis_response(self, response_text: str, timestamp: str) -> list[AnalysisResult]:
        """Parse the LLM response into structured AnalysisResult objects."""
        results = []
        events = response_text.split("---")

        for event_text in events:
            event_text = event_text.strip()
            if not event_text:
                continue

            event_match = re.search(r"EVENT:\s*(.+)", event_text, re.IGNORECASE)
            details_match = re.search(r"DETAILS:\s*(.+)", event_text, re.IGNORECASE)
            confidence_match = re.search(r"CONFIDENCE:\s*([\d.]+)", event_text, re.IGNORECASE)

            if event_match:
                event = event_match.group(1).strip()
                details = details_match.group(1).strip() if details_match else "No details available"
                try:
                    confidence = float(confidence_match.group(1)) if confidence_match else 0.7
                    confidence = min(max(confidence, 0.0), 1.0)
                except ValueError:
                    confidence = 0.7

                if confidence >= settings.CONFIDENCE_THRESHOLD:
                    results.append(
                        AnalysisResult(
                            timestamp=timestamp,
                            event=event,
                            details=details,
                            confidence=confidence,
                        )
                    )

        return results if results else self._generate_fallback_analysis(timestamp)

    def _generate_fallback_analysis(self, timestamp: str) -> list[AnalysisResult]:
        """Generate fallback analysis when LLM is unavailable."""
        return [
            AnalysisResult(
                timestamp=timestamp,
                event="Frame Captured",
                details="Video frame captured for analysis. Enable Gemini API for detailed insights.",
                confidence=0.5,
            )
        ]

    async def generate_play_description(self, events: list[AnalysisResult]) -> str:
        """Generate a natural language description of the play."""
        if not self._initialized or not events:
            return "Play in progress."

        events_text = "\n".join(
            f"- {e.event}: {e.details} (confidence: {e.confidence:.0%})" for e in events
        )

        prompt = f"""Based on these detected events in a football game:
{events_text}

Write a brief, engaging play-by-play description (1-2 sentences) like an NFL commentator would deliver."""

        try:
            response = self._model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Play description generation failed: {e}")
            return "Play in progress."

    async def generate_strategy_recommendation(
        self, game_state: dict, recent_plays: list[AnalysisResult]
    ) -> str:
        """Generate tactical insights based on game state and recent plays."""
        if not self._initialized:
            return "Enable Gemini API for strategic recommendations."

        prompt = f"""You are an NFL tactical analyst. Based on the current game situation:
- Quarter: {game_state.get('quarter', 1)}
- Clock: {game_state.get('clock', '15:00')}
- Score: Home {game_state.get('score', {}).get('home', 0)} - Away {game_state.get('score', {}).get('away', 0)}
- Down: {game_state.get('down', 1)}
- Distance: {game_state.get('distance', 10)} yards
- Possession: {game_state.get('possession', 'KC')}

Recent plays detected:
{chr(10).join(f"- {p.event}: {p.details}" for p in recent_plays[-3:])}

Provide a brief strategic recommendation (2-3 sentences) for the offensive team."""

        try:
            response = self._model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Strategy recommendation failed: {e}")
            return "Unable to generate strategy recommendation."


# Global singleton instance
llm_service = LLMService()
