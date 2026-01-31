import cv2
import numpy as np
from PIL import Image
from pathlib import Path
from typing import Generator, Optional
import asyncio

from models.schemas import AnalysisResult, FrameAnalysis
from core.frame_analyzer import FrameAnalyzer
from config import settings
from utils.logger import logger


class VideoProcessor:
    """Processes video files for football analysis."""

    def __init__(self, fps: Optional[int] = None):
        """
        Initialize video processor.

        Args:
            fps: Frames per second to extract (default from settings)
        """
        self.analysis_fps = fps or settings.ANALYSIS_FPS
        self.frame_analyzer = FrameAnalyzer()

    def extract_frames(
        self,
        video_path: str,
    ) -> Generator[tuple[Image.Image, int, float], None, None]:
        """
        Extract frames from video at specified FPS.

        Args:
            video_path: Path to video file

        Yields:
            Tuple of (PIL Image, frame_number, timestamp_seconds)
        """
        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")

        video_fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        if video_fps <= 0:
            video_fps = 30.0  # Default assumption

        # Calculate frame interval
        frame_interval = max(1, int(video_fps / self.analysis_fps))

        logger.info(
            f"Processing video: {total_frames} frames @ {video_fps:.1f} FPS, "
            f"extracting every {frame_interval} frames"
        )

        frame_count = 0
        extracted_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % frame_interval == 0:
                # Convert BGR to RGB
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(rgb_frame)

                timestamp_seconds = frame_count / video_fps
                yield pil_image, frame_count, timestamp_seconds
                extracted_count += 1

            frame_count += 1

        cap.release()
        logger.info(f"Extracted {extracted_count} frames from video")

    async def process_video(self, video_path: str) -> list[AnalysisResult]:
        """
        Process a video file and return analysis results.

        Args:
            video_path: Path to video file

        Returns:
            List of analysis results
        """
        path = Path(video_path)
        if not path.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cap = cv2.VideoCapture(str(path))
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")

        video_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        cap.release()

        all_results: list[AnalysisResult] = []
        batch_size = 3  # Process 3 frames at a time

        frames_batch: list[tuple[Image.Image, int]] = []

        for pil_image, frame_num, _ in self.extract_frames(str(path)):
            frames_batch.append((pil_image, frame_num))

            if len(frames_batch) >= batch_size:
                batch_results = await self.frame_analyzer.analyze_batch(
                    frames_batch, video_fps, total_frames
                )
                all_results.extend(batch_results)
                frames_batch = []

                # Yield control to event loop
                await asyncio.sleep(0)

        # Process remaining frames
        if frames_batch:
            batch_results = await self.frame_analyzer.analyze_batch(
                frames_batch, video_fps, total_frames
            )
            all_results.extend(batch_results)

        # Sort by timestamp and remove duplicates
        all_results = self._deduplicate_results(all_results)

        logger.info(f"Video analysis complete: {len(all_results)} events detected")
        return all_results

    def _deduplicate_results(
        self, results: list[AnalysisResult]
    ) -> list[AnalysisResult]:
        """Remove duplicate events and sort by timestamp."""
        seen = set()
        unique = []

        for result in results:
            key = (result.timestamp, result.event, result.details[:50])
            if key not in seen:
                seen.add(key)
                unique.append(result)

        # Sort by timestamp
        return sorted(unique, key=lambda r: self._parse_timestamp(r.timestamp))

    def _parse_timestamp(self, ts: str) -> float:
        """Parse timestamp string to seconds."""
        try:
            parts = ts.split(":")
            if len(parts) == 2:
                return int(parts[0]) * 60 + int(parts[1])
            return float(ts)
        except (ValueError, IndexError):
            return 0.0

    def get_video_info(self, video_path: str) -> dict:
        """Get basic video information."""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"error": "Could not open video"}

        info = {
            "fps": cap.get(cv2.CAP_PROP_FPS),
            "total_frames": int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
            "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            "duration_seconds": cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS)
            if cap.get(cv2.CAP_PROP_FPS) > 0
            else 0,
        }
        cap.release()
        return info
