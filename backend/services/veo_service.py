import httpx
import asyncio
from typing import Optional
from config import settings
from utils.logger import logger


class VeoService:
    """Service for Veo 3.1 video generation from reference images."""

    def __init__(self):
        self._api_key = None
        self._model_id = "fal-ai/veo3.1/reference-to-video"
        self._base_url = "https://fal.run"
        self._initialized = False

    def initialize(self) -> bool:
        """Initialize the Veo service with API credentials."""
        if self._initialized:
            return True

        self._api_key = settings.VEO_API_KEY
        if not self._api_key:
            logger.warning("VEO_API_KEY not set. Veo features disabled.")
            return False

        try:
            self._initialized = True
            logger.info("Veo 3.1 API initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Veo: {e}")
            return False

    async def generate_video_from_images(
        self,
        prompt: str,
        image_urls: list[str],
        duration: str = "8s",
        resolution: str = "720p",
        aspect_ratio: str = "16:9",
        generate_audio: bool = True,
    ) -> Optional[dict]:
        """
        Generate a video from reference images using Veo 3.1.

        Args:
            prompt: Text prompt describing the video content
            image_urls: List of reference image URLs (at least 1, recommended 3+)
            duration: Video duration ("8s" is the only option currently)
            resolution: Video resolution ("720p", "1080p", or "4k")
            aspect_ratio: Video aspect ratio ("16:9" or "9:16")
            generate_audio: Whether to generate audio for the video

        Returns:
            Dict with video URL and metadata, or None if generation failed
        """
        if not self._initialized:
            if not self.initialize():
                logger.error("Veo service not initialized")
                return None

        if not image_urls or len(image_urls) == 0:
            logger.error("At least one reference image URL is required")
            return None

        # Validate inputs
        if len(prompt.strip()) == 0:
            logger.error("Prompt cannot be empty")
            return None

        payload = {
            "prompt": prompt,
            "image_urls": image_urls,
            "duration": duration,
            "resolution": resolution,
            "aspect_ratio": aspect_ratio,
            "generate_audio": generate_audio,
            "auto_fix": True,  # Let Veo fix prompts that fail content policy
        }

        try:
            headers = {
                "Authorization": f"Key {self._api_key}",
                "Content-Type": "application/json",
            }

            async with httpx.AsyncClient(timeout=600.0) as client:
                logger.info(f"Requesting video generation with prompt: {prompt[:50]}...")
                response = await client.post(
                    f"{self._base_url}/{self._model_id}",
                    json=payload,
                    headers=headers,
                )

                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"Video generated successfully: {result.get('video', {}).get('url', 'N/A')}")
                    return {
                        "video_url": result.get("video", {}).get("url"),
                        "status": "completed",
                        "prompt": prompt,
                        "image_count": len(image_urls),
                    }
                else:
                    logger.error(
                        f"Video generation failed with status {response.status_code}: {response.text}"
                    )
                    return None

        except httpx.TimeoutException:
            logger.error("Video generation request timed out")
            return None
        except Exception as e:
            logger.error(f"Video generation failed: {e}")
            return None

    async def generate_halftime_video(
        self,
        reference_image_urls: list[str],
        game_context: dict,
    ) -> Optional[dict]:
        """
        Generate a Super Bowl halftime highlight video.

        Args:
            reference_image_urls: List of highlight image URLs
            game_context: Dict with game info (teams, quarter, score, etc.)

        Returns:
            Dict with generated video URL or None if failed
        """
        # Build a dynamic prompt based on game context
        home_team = game_context.get("home_team", "Team")
        away_team = game_context.get("away_team", "Team")
        quarter = game_context.get("quarter", 2)
        home_score = game_context.get("home_score", 0)
        away_score = game_context.get("away_score", 0)

        prompt = (
            f"Create an exciting Super Bowl halftime action video featuring {home_team} vs {away_team}. "
            f"Score: {home_team} {home_score} - {away_score} {away_team}, Quarter {quarter}. "
            "Show dynamic football action with athletes in motion, featuring highlight moments with energy and intensity. "
            "Include smooth transitions between plays and showcase the most impactful moments. "
            "Make it cinematic with a musical halftime theme featuring coordinated movements and action sequences."
        )

        return await self.generate_video_from_images(
            prompt=prompt,
            image_urls=reference_image_urls,
            duration="8s",
            resolution="720p",
            aspect_ratio="16:9",
            generate_audio=True,
        )


# Global singleton instance
veo_service = VeoService()
