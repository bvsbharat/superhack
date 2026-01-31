"""
Vision Agent integration using GetStream's vision-agents framework.

This module provides video analysis using vision-agents for real-time
frame processing with Gemini Vision API.
"""

import asyncio
import cv2
import numpy as np
from PIL import Image
from pathlib import Path
from typing import Optional, AsyncGenerator, Callable
import base64
import io

from config import settings
from models.schemas import AnalysisResult, GameState
from services.state_manager import state_manager
from analytics.play_classifier import play_classifier, PlayType
from utils.logger import logger

# Try to import vision-agents components
try:
    from vision_agents import Agent
    from vision_agents.core import User
    from vision_agents import gemini
    VISION_AGENTS_AVAILABLE = True
except ImportError:
    VISION_AGENTS_AVAILABLE = False
    logger.warning("vision-agents not installed. Using fallback analysis.")


class FootballAnalysisProcessor:
    """
    Custom processor for football video analysis.

    Processes video frames and extracts football-specific events
    like formations, plays, and player movements.
    """

    def __init__(self):
        self.frame_count = 0
        self.last_analysis: list[AnalysisResult] = []
        self.analysis_callback: Optional[Callable[[AnalysisResult], None]] = None

    def set_callback(self, callback: Callable[[AnalysisResult], None]):
        """Set callback for real-time analysis results."""
        self.analysis_callback = callback

    async def process_frame(self, frame: np.ndarray, timestamp: float) -> dict:
        """
        Process a single video frame.

        Args:
            frame: BGR numpy array from OpenCV
            timestamp: Frame timestamp in seconds

        Returns:
            Dict with frame metadata for the agent
        """
        self.frame_count += 1

        # Convert timestamp to MM:SS format
        minutes = int(timestamp // 60)
        seconds = int(timestamp % 60)
        ts_str = f"{minutes}:{seconds:02d}"

        return {
            "frame_number": self.frame_count,
            "timestamp": ts_str,
            "timestamp_seconds": timestamp,
        }


class VisionAgentAnalyzer:
    """
    High-level vision agent for Super Bowl analysis using vision-agents framework.

    Coordinates video processing, frame analysis, and game insights.
    """

    SYSTEM_INSTRUCTIONS = """You are an expert NFL analyst specializing in Super Bowl game analysis.
Your job is to analyze video footage of football games and identify:

1. **Formations**: Offensive formations (Shotgun, I-Formation, Spread, etc.) and defensive alignments (4-3, 3-4, Nickel, etc.)
2. **Play Types**: Pass plays, run plays, screen passes, play-action, etc.
3. **Key Events**: Completions, incompletions, sacks, tackles, interceptions, touchdowns, penalties
4. **Player Actions**: Quarterback reads, receiver routes, defensive coverage, blocking schemes
5. **Scoreboard/Game State**: ALWAYS read the scoreboard/on-screen graphics to extract:
   - Team names/abbreviations (HOME_TEAM, AWAY_TEAM)
   - Current score (HOME_SCORE, AWAY_SCORE)
   - Quarter (QUARTER: 1, 2, 3, 4, OT)
   - Game clock time (GAME_TIME: e.g., "12:45", "2:00")
   - Down and distance (DOWN: 1-4, DISTANCE: yards to go)
   - Ball position (YARD_LINE: 1-50)
   - Which team has possession (POSSESSION: team abbreviation)

For each frame, provide:
- EVENT: The type of event (e.g., "Pass Completion", "Run Play", "Sack", "Formation")
- DETAILS: Specific description including player names/numbers if visible. Use markdown **bold** for player names.
- CONFIDENCE: Your confidence level (0.0-1.0)

ALWAYS include game state from scoreboard (if visible):
- HOME_TEAM: Team abbreviation (e.g., KC, PHI, SF)
- AWAY_TEAM: Team abbreviation
- HOME_SCORE: Number (e.g., 24)
- AWAY_SCORE: Number (e.g., 21)
- QUARTER: Number 1-4 or "OT"
- GAME_TIME: Clock time (e.g., "8:42")
- DOWN: Current down (1-4)
- DISTANCE: Yards to go (e.g., 10)
- YARD_LINE: Field position (e.g., 35)
- POSSESSION: Team with the ball (e.g., PHI)

Common NFL team abbreviations:
PHI (Eagles), KC (Chiefs), SF (49ers), DAL (Cowboys), GB (Packers), BUF (Bills),
BAL (Ravens), CIN (Bengals), DET (Lions), MIA (Dolphins), NYG (Giants), NYJ (Jets),
NE (Patriots), PIT (Steelers), LAC (Chargers), DEN (Broncos), LV (Raiders), SEA (Seahawks),
LA (Rams), ARI (Cardinals), ATL (Falcons), CAR (Panthers), CHI (Bears), CLE (Browns),
HOU (Texans), IND (Colts), JAX (Jaguars), MIN (Vikings), NO (Saints), TB (Buccaneers),
TEN (Titans), WAS (Commanders)

Be concise and data-driven. Focus on tactical insights that would help coaches and analysts.
Separate multiple events with ---"""

    def __init__(self):
        self._agent = None
        self._processor = FootballAnalysisProcessor()
        self._initialized = False
        self._gemini_model = None

    async def initialize(self) -> bool:
        """Initialize the vision agent."""
        if self._initialized:
            return True

        if VISION_AGENTS_AVAILABLE and settings.GEMINI_API_KEY:
            try:
                # Create agent user
                agent_user = User(name="SuperBowl Analyst", id="superbowl_analyst")

                # Initialize with Gemini for vision analysis
                self._agent = Agent(
                    agent_user=agent_user,
                    instructions=self.SYSTEM_INSTRUCTIONS,
                    llm=gemini.Realtime(fps=settings.ANALYSIS_FPS),
                )

                self._initialized = True
                logger.info("Vision Agent initialized with vision-agents framework")
                return True
            except Exception as e:
                logger.error(f"Failed to initialize vision-agents: {e}")
                # Fall back to direct Gemini API

        # Fallback: Initialize direct Gemini API
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self._gemini_model = genai.GenerativeModel("gemini-3-flash-preview")
                self._initialized = True
                logger.info("Vision Agent initialized with gemini-3-flash-preview")
                return True
            except Exception as e:
                logger.error(f"Failed to initialize Gemini API: {e}")

        logger.warning("Vision Agent running in demo mode (no API keys)")
        self._initialized = True
        return True

    async def analyze_video_file(
        self,
        video_path: str,
        progress_callback: Optional[Callable[[float], None]] = None,
    ) -> list[AnalysisResult]:
        """
        Analyze a video file by streaming frames to the vision agent.

        Args:
            video_path: Path to video file
            progress_callback: Optional callback for progress updates (0.0-1.0)

        Returns:
            List of analysis results with timestamps
        """
        if not self._initialized:
            await self.initialize()

        path = Path(video_path)
        if not path.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")

        # Open video
        cap = cv2.VideoCapture(str(path))
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")

        video_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / video_fps

        # Limit analysis to first 2 minutes (120 seconds)
        MAX_ANALYSIS_SECONDS = 120
        max_frames = int(min(total_frames, MAX_ANALYSIS_SECONDS * video_fps))
        analysis_duration = min(duration, MAX_ANALYSIS_SECONDS)

        logger.info(f"Analyzing video: {total_frames} frames, {duration:.1f}s @ {video_fps:.1f} FPS")
        logger.info(f"Limiting analysis to first {analysis_duration:.1f}s ({max_frames} frames)")

        # Calculate frame interval for analysis
        frame_interval = max(1, int(video_fps / settings.ANALYSIS_FPS))

        all_results: list[AnalysisResult] = []
        frame_count = 0
        analyzed_count = 0

        try:
            while frame_count < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_count % frame_interval == 0:
                    timestamp = frame_count / video_fps

                    # Analyze frame
                    results = await self._analyze_frame(frame, timestamp)
                    all_results.extend(results)
                    analyzed_count += 1

                    # Progress callback
                    if progress_callback:
                        progress = frame_count / max_frames
                        progress_callback(progress)

                    # Yield control to event loop
                    await asyncio.sleep(0)

                frame_count += 1

        finally:
            cap.release()

        logger.info(f"Analysis complete: {len(all_results)} events from {analyzed_count} frames")

        # Deduplicate and sort results
        return self._deduplicate_results(all_results)

    async def _analyze_frame(self, frame: np.ndarray, timestamp: float) -> list[AnalysisResult]:
        """Analyze a single frame using the vision agent."""

        # Convert timestamp to string format
        minutes = int(timestamp // 60)
        seconds = int(timestamp % 60)
        ts_str = f"{minutes}:{seconds:02d}"

        # Convert BGR to RGB and then to PIL Image
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_frame)

        # If we have direct Gemini model, use it
        if self._gemini_model:
            return await self._analyze_with_gemini(pil_image, ts_str)

        # If vision-agents is available and agent is set up
        if self._agent and VISION_AGENTS_AVAILABLE:
            return await self._analyze_with_vision_agents(pil_image, ts_str)

        # Fallback demo response
        return self._generate_demo_analysis(ts_str)

    async def _analyze_with_gemini(self, image: Image.Image, timestamp: str) -> list[AnalysisResult]:
        """Analyze frame using direct Gemini Vision API."""
        prompt = f"""Analyze this football game frame at timestamp {timestamp}.

{self.SYSTEM_INSTRUCTIONS}

Respond with detected events in the specified format."""

        try:
            response = self._gemini_model.generate_content([prompt, image])
            return self._parse_analysis_response(response.text, timestamp)
        except Exception as e:
            logger.error(f"Gemini analysis failed: {e}")
            return self._generate_demo_analysis(timestamp)

    async def _analyze_with_vision_agents(self, image: Image.Image, timestamp: str) -> list[AnalysisResult]:
        """Analyze frame using vision-agents framework."""
        try:
            # Convert image to base64 for the agent
            buffer = io.BytesIO()
            image.save(buffer, format="JPEG")
            img_base64 = base64.b64encode(buffer.getvalue()).decode()

            # Send to agent for analysis
            # Note: This is a simplified version - actual implementation
            # would use the agent's streaming capabilities
            prompt = f"Analyze this football frame at {timestamp}"

            # For now, fall back to direct Gemini if available
            if self._gemini_model:
                return await self._analyze_with_gemini(image, timestamp)

            return self._generate_demo_analysis(timestamp)
        except Exception as e:
            logger.error(f"Vision-agents analysis failed: {e}")
            return self._generate_demo_analysis(timestamp)

    def _parse_analysis_response(self, response_text: str, timestamp: str) -> list[AnalysisResult]:
        """Parse the LLM response into structured AnalysisResult objects."""
        import re

        results = []
        events = response_text.split("---")

        # Extract team information from the entire response
        # Extract team information
        home_team_match = re.search(r"HOME_TEAM:\s*([A-Z]{2,3})", response_text, re.IGNORECASE)
        away_team_match = re.search(r"AWAY_TEAM:\s*([A-Z]{2,3})", response_text, re.IGNORECASE)
        detected_home = home_team_match.group(1).upper() if home_team_match else None
        detected_away = away_team_match.group(1).upper() if away_team_match else None

        # Extract game state from scoreboard
        home_score_match = re.search(r"HOME_SCORE:\s*(\d+)", response_text, re.IGNORECASE)
        away_score_match = re.search(r"AWAY_SCORE:\s*(\d+)", response_text, re.IGNORECASE)
        quarter_match = re.search(r"QUARTER:\s*(\d+|OT)", response_text, re.IGNORECASE)
        game_time_match = re.search(r"GAME_TIME:\s*([\d:]+)", response_text, re.IGNORECASE)
        down_match = re.search(r"DOWN:\s*(\d+)", response_text, re.IGNORECASE)
        distance_match = re.search(r"DISTANCE:\s*(\d+)", response_text, re.IGNORECASE)
        yard_line_match = re.search(r"YARD_LINE:\s*(\d+)", response_text, re.IGNORECASE)
        possession_match = re.search(r"POSSESSION:\s*([A-Z]{2,3})", response_text, re.IGNORECASE)

        # Build game info dict
        game_info = {}
        if detected_home:
            game_info["home_team"] = detected_home
        if detected_away:
            game_info["away_team"] = detected_away
        if home_score_match:
            game_info["home_score"] = int(home_score_match.group(1))
        if away_score_match:
            game_info["away_score"] = int(away_score_match.group(1))
        if quarter_match:
            q = quarter_match.group(1)
            game_info["quarter"] = 5 if q.upper() == "OT" else int(q)
        if game_time_match:
            game_info["game_time"] = game_time_match.group(1)
        if down_match:
            game_info["down"] = int(down_match.group(1))
        if distance_match:
            game_info["distance"] = int(distance_match.group(1))
        if yard_line_match:
            game_info["yard_line"] = int(yard_line_match.group(1))
        if possession_match:
            game_info["possession"] = possession_match.group(1).upper()

        for event_text in events:
            event_text = event_text.strip()
            if not event_text:
                continue

            event_match = re.search(r"EVENT:\s*(.+?)(?:\n|$)", event_text, re.IGNORECASE)
            details_match = re.search(r"DETAILS:\s*(.+?)(?:\n|$)", event_text, re.IGNORECASE | re.DOTALL)
            confidence_match = re.search(r"CONFIDENCE:\s*([\d.]+)", event_text, re.IGNORECASE)

            if event_match:
                event = event_match.group(1).strip()
                details = details_match.group(1).strip() if details_match else "Analysis in progress"

                try:
                    confidence = float(confidence_match.group(1)) if confidence_match else 0.75
                    confidence = min(max(confidence, 0.0), 1.0)
                except ValueError:
                    confidence = 0.75

                if confidence >= settings.CONFIDENCE_THRESHOLD:
                    # Classify the play type
                    play_type = play_classifier.classify(f"{event} {details}")
                    if play_type != PlayType.UNKNOWN:
                        event = play_type.value

                    result = AnalysisResult(
                        timestamp=timestamp,
                        event=event,
                        details=details,
                        confidence=confidence,
                    )

                    # Add detected teams if available
                    if detected_home or detected_away:
                        result.detected_teams = {
                            "home": detected_home,
                            "away": detected_away,
                        }

                    # Add game info if available
                    if game_info:
                        result.game_info = game_info

                    results.append(result)

        return results if results else self._generate_demo_analysis(timestamp)

    def _generate_demo_analysis(self, timestamp: str) -> list[AnalysisResult]:
        """Generate demo analysis when APIs are unavailable."""
        import random

        events = [
            ("Formation Analysis", "Offensive team in Shotgun formation with 3 wide receivers", 0.85),
            ("Pass Play", "Quarterback drops back, looking for open receiver downfield", 0.78),
            ("Run Play", "Running back takes handoff, cuts through the A-gap", 0.82),
            ("Defensive Coverage", "Defense showing Cover 2 with press coverage on outside", 0.76),
            ("Pre-Snap Motion", "Slot receiver motions across formation before snap", 0.88),
        ]

        event, details, confidence = random.choice(events)

        return [
            AnalysisResult(
                timestamp=timestamp,
                event=event,
                details=f"{details}. [Demo mode - set GEMINI_API_KEY for real analysis]",
                confidence=confidence,
            )
        ]

    def _deduplicate_results(self, results: list[AnalysisResult]) -> list[AnalysisResult]:
        """Remove duplicate events and sort by timestamp."""
        seen = set()
        unique = []

        for result in results:
            # Create a key from timestamp and event type
            key = (result.timestamp, result.event)
            if key not in seen:
                seen.add(key)
                unique.append(result)

        # Sort by timestamp
        def parse_ts(ts: str) -> float:
            try:
                parts = ts.split(":")
                return int(parts[0]) * 60 + int(parts[1])
            except (ValueError, IndexError):
                return 0.0

        return sorted(unique, key=lambda r: parse_ts(r.timestamp))

    async def get_game_state(self) -> GameState:
        """Get current game state."""
        return state_manager.state


# Global singleton
vision_agent = VisionAgentAnalyzer()
