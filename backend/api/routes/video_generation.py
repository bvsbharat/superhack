from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.veo_service import veo_service
from utils.logger import logger

router = APIRouter()


class VideoGenerationRequest(BaseModel):
    """Request model for video generation."""
    prompt: str
    image_urls: list[str]
    duration: Optional[str] = "8s"
    resolution: Optional[str] = "720p"
    aspect_ratio: Optional[str] = "16:9"
    generate_audio: Optional[bool] = True


class HalftimeVideoRequest(BaseModel):
    """Request model for halftime highlight video generation."""
    reference_image_urls: list[str]
    home_team: str
    away_team: str
    quarter: Optional[int] = 2
    home_score: Optional[int] = 0
    away_score: Optional[int] = 0


class VideoGenerationResponse(BaseModel):
    """Response model for video generation."""
    status: str
    video_url: Optional[str] = None
    message: str


@router.post("/generate_video", response_model=VideoGenerationResponse)
async def generate_video(request: VideoGenerationRequest):
    """
    Generate a video from reference images using Veo 3.1.

    Requires:
    - prompt: Text description of the desired video
    - image_urls: List of reference image URLs (at least 1)

    Optional:
    - duration: Video duration ("8s")
    - resolution: "720p", "1080p", or "4k"
    - aspect_ratio: "16:9" or "9:16"
    - generate_audio: Whether to generate audio

    Returns:
    - status: "success" or "error"
    - video_url: URL to the generated video (if successful)
    """
    try:
        # Validate request
        if not request.image_urls or len(request.image_urls) == 0:
            raise HTTPException(
                status_code=400,
                detail="At least one reference image URL is required"
            )

        if not request.prompt or len(request.prompt.strip()) == 0:
            raise HTTPException(
                status_code=400,
                detail="Prompt cannot be empty"
            )

        # Initialize service if needed
        if not veo_service._initialized:
            if not veo_service.initialize():
                raise HTTPException(
                    status_code=503,
                    detail="Veo service is not available. Please check VEO_API_KEY configuration."
                )

        logger.info(f"Generating video with {len(request.image_urls)} reference images")

        # Generate video
        result = await veo_service.generate_video_from_images(
            prompt=request.prompt,
            image_urls=request.image_urls,
            duration=request.duration,
            resolution=request.resolution,
            aspect_ratio=request.aspect_ratio,
            generate_audio=request.generate_audio,
        )

        if result and result.get("video_url"):
            return VideoGenerationResponse(
                status="success",
                video_url=result["video_url"],
                message=f"Video generated successfully with {result['image_count']} reference images"
            )
        else:
            logger.error("Video generation returned no URL")
            raise HTTPException(
                status_code=500,
                detail="Video generation failed or returned no URL"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Video generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Video generation failed: {str(e)}"
        )


@router.post("/generate_halftime_video", response_model=VideoGenerationResponse)
async def generate_halftime_video(request: HalftimeVideoRequest):
    """
    Generate a Super Bowl halftime highlight video.

    Takes 4+ reference images and creates a dynamic halftime video
    featuring the two teams with current game context.

    Requires:
    - reference_image_urls: List of highlight image URLs (4+ recommended)
    - home_team: Home team name
    - away_team: Away team name

    Optional:
    - quarter: Current quarter
    - home_score: Home team score
    - away_score: Away team score

    Returns:
    - status: "success" or "error"
    - video_url: URL to the generated halftime video
    """
    try:
        # Validate minimum images for halftime video
        if len(request.reference_image_urls) < 1:
            raise HTTPException(
                status_code=400,
                detail="At least 4 reference images recommended for halftime video generation"
            )

        # Initialize service if needed
        if not veo_service._initialized:
            if not veo_service.initialize():
                raise HTTPException(
                    status_code=503,
                    detail="Veo service is not available. Please check VEO_API_KEY configuration."
                )

        logger.info(
            f"Generating halftime video: {request.home_team} vs {request.away_team} "
            f"({request.home_score}-{request.away_score}), Q{request.quarter}, "
            f"{len(request.reference_image_urls)} images"
        )

        # Generate halftime video
        result = await veo_service.generate_halftime_video(
            reference_image_urls=request.reference_image_urls,
            game_context={
                "home_team": request.home_team,
                "away_team": request.away_team,
                "quarter": request.quarter,
                "home_score": request.home_score,
                "away_score": request.away_score,
            }
        )

        if result and result.get("video_url"):
            return VideoGenerationResponse(
                status="success",
                video_url=result["video_url"],
                message=f"Halftime video generated successfully"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Halftime video generation failed"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Halftime video generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Halftime video generation failed: {str(e)}"
        )


@router.get("/video_generation_status")
async def get_video_generation_status():
    """Get information about video generation capabilities."""
    veo_initialized = veo_service.initialize()

    return {
        "veo_enabled": veo_initialized,
        "supported_resolutions": ["720p", "1080p", "4k"],
        "supported_aspect_ratios": ["16:9", "9:16"],
        "video_duration": "8s",
        "recommended_reference_images": 4,
        "features": [
            "Image-to-video generation",
            "Halftime highlight videos",
            "Audio generation",
            "Multiple resolution options",
        ],
    }
