import os
import tempfile
import base64
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import aiofiles
from PIL import Image
import io

from models.schemas import VideoAnalysisResponse, AnalysisResult
from core.vision_agent import vision_agent
from utils.logger import logger

router = APIRouter()


class FrameAnalysisRequest(BaseModel):
    """Request model for single frame analysis."""
    image: str  # Base64 encoded image


@router.post("/analyze_video", response_model=VideoAnalysisResponse)
async def analyze_video(file: UploadFile = File(...)):
    """
    Analyze an uploaded video file for football events using vision-agents.

    Accepts video files (mp4, mov, avi, etc.) and returns
    timestamped analysis results with detected events.

    The video is processed frame-by-frame through the vision agent
    which uses Gemini Vision API for real-time analysis.
    """
    # Validate file type
    allowed_extensions = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v", ".3gp", ".flv"}
    file_ext = os.path.splitext(file.filename or "")[1].lower()

    logger.info(f"Received file: {file.filename}, extension: {file_ext}, content_type: {file.content_type}")

    # Allow if extension matches OR if content type is video
    if file_ext not in allowed_extensions:
        if file.content_type and file.content_type.startswith("video/"):
            logger.info(f"Allowing file based on content_type: {file.content_type}")
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{file_ext}'. Allowed: {', '.join(allowed_extensions)}",
            )

    temp_path = None
    try:
        # Create temp file with proper extension
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=file_ext
        ) as temp_file:
            temp_path = temp_file.name

        # Write uploaded content to temp file
        async with aiofiles.open(temp_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)

        logger.info(f"Processing video: {file.filename} ({len(content)} bytes)")

        # Process video using vision agent
        results = await vision_agent.analyze_video_file(temp_path)

        return VideoAnalysisResponse(analysis=results)

    except FileNotFoundError as e:
        logger.error(f"File not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))

    except ValueError as e:
        logger.error(f"Invalid video: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        logger.error(f"Video analysis failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Video analysis failed: {str(e)}",
        )

    finally:
        # Cleanup temp file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file: {e}")


@router.post("/analyze_frame", response_model=VideoAnalysisResponse)
async def analyze_frame(request: FrameAnalysisRequest):
    """
    Analyze a single video frame for football events.

    Accepts a base64 encoded image and returns analysis results.
    Used for real-time live stream analysis.
    """
    try:
        # Decode base64 image
        image_data = base64.b64decode(request.image)
        image = Image.open(io.BytesIO(image_data))

        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')

        logger.info(f"Analyzing frame: {image.size[0]}x{image.size[1]}")

        # Ensure vision agent is initialized
        if not vision_agent._initialized:
            await vision_agent.initialize()

        # Use vision agent to analyze the frame
        import time
        timestamp = time.strftime("%M:%S")

        # Check if Gemini model is available
        if vision_agent._gemini_model:
            results = await vision_agent._analyze_with_gemini(image, timestamp)
        else:
            # Fallback to demo if no model
            results = vision_agent._generate_demo_analysis(timestamp)

        return VideoAnalysisResponse(analysis=results)

    except Exception as e:
        logger.error(f"Frame analysis failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Frame analysis failed: {str(e)}",
        )


@router.get("/video_info")
async def get_video_capabilities():
    """Get information about video processing capabilities."""
    from core.vision_agent import VISION_AGENTS_AVAILABLE
    from config import settings

    return {
        "supported_formats": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
        "max_file_size_mb": 100,
        "analysis_fps": settings.ANALYSIS_FPS,
        "vision_agents_enabled": VISION_AGENTS_AVAILABLE,
        "gemini_enabled": bool(settings.GEMINI_API_KEY),
        "features": [
            "Formation detection",
            "Play type classification",
            "Player tracking",
            "Event detection",
            "Strategic insights",
            "Real-time frame analysis",
        ],
    }
