from PIL import Image
from typing import Optional
import asyncio

from models.schemas import AnalysisResult
from services.llm_service import llm_service
from analytics.play_classifier import play_classifier, PlayType
from config import settings
from utils.logger import logger


class FrameAnalyzer:
    """Analyzes individual video frames for football events."""

    def __init__(self):
        self._last_events: list[AnalysisResult] = []

    async def analyze(
        self,
        frame: Image.Image,
        frame_number: int,
        fps: float,
        total_frames: int,
    ) -> list[AnalysisResult]:
        """
        Analyze a single frame for football events.

        Args:
            frame: PIL Image of the frame
            frame_number: Frame number in sequence
            fps: Video frames per second
            total_frames: Total frames in video

        Returns:
            List of detected events
        """
        # Calculate timestamp
        timestamp_seconds = frame_number / fps
        minutes = int(timestamp_seconds // 60)
        seconds = int(timestamp_seconds % 60)
        timestamp = f"{minutes}:{seconds:02d}"

        # Use LLM service for analysis
        events = await llm_service.analyze_frame(frame, timestamp)

        # Classify and enrich events
        for event in events:
            play_type = play_classifier.classify(f"{event.event} {event.details}")
            if play_type != PlayType.UNKNOWN:
                event.event = play_type.value

        # Filter out duplicate consecutive events
        events = self._filter_duplicates(events)

        self._last_events = events
        return events

    def _filter_duplicates(self, events: list[AnalysisResult]) -> list[AnalysisResult]:
        """Remove events that are too similar to recent ones."""
        if not self._last_events:
            return events

        filtered = []
        for event in events:
            is_duplicate = False
            for last_event in self._last_events:
                if (
                    event.event == last_event.event
                    and self._similarity(event.details, last_event.details) > 0.8
                ):
                    is_duplicate = True
                    break
            if not is_duplicate:
                filtered.append(event)

        return filtered if filtered else events[:1]  # Always return at least one

    def _similarity(self, text1: str, text2: str) -> float:
        """Simple word overlap similarity."""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        if not words1 or not words2:
            return 0.0
        intersection = words1 & words2
        union = words1 | words2
        return len(intersection) / len(union)

    async def analyze_batch(
        self,
        frames: list[tuple[Image.Image, int]],
        fps: float,
        total_frames: int,
    ) -> list[AnalysisResult]:
        """
        Analyze multiple frames concurrently.

        Args:
            frames: List of (frame, frame_number) tuples
            fps: Video FPS
            total_frames: Total frames

        Returns:
            Combined list of events
        """
        tasks = [
            self.analyze(frame, frame_num, fps, total_frames)
            for frame, frame_num in frames
        ]

        results = await asyncio.gather(*tasks)

        # Flatten and deduplicate
        all_events = []
        seen = set()
        for event_list in results:
            for event in event_list:
                key = (event.timestamp, event.event)
                if key not in seen:
                    seen.add(key)
                    all_events.append(event)

        return sorted(all_events, key=lambda e: self._parse_timestamp(e.timestamp))

    def _parse_timestamp(self, ts: str) -> float:
        """Parse timestamp string to seconds."""
        try:
            parts = ts.split(":")
            if len(parts) == 2:
                return int(parts[0]) * 60 + int(parts[1])
            return float(ts)
        except (ValueError, IndexError):
            return 0.0
