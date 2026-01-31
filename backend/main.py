"""
Super Bowl Analytics Backend

A production-ready backend for real-time Super Bowl video analysis
using the vision-agents framework with Gemini Vision API.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import settings
from api.routes import video_router, game_state_router, websocket_router, stream_router
from api.routes.match import router as match_router
from core.vision_agent import vision_agent, VISION_AGENTS_AVAILABLE
from core.football_agent import football_agent, VISION_AGENTS_AVAILABLE as STREAM_AVAILABLE
from utils.logger import logger

# Database imports
try:
    from database.connection import init_db
    DATABASE_AVAILABLE = True
except ImportError:
    DATABASE_AVAILABLE = False
    logger.warning("Database module not available - running without persistence")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown."""
    # Startup
    logger.info("Starting Super Bowl Analytics Backend...")

    # Initialize database
    if DATABASE_AVAILABLE:
        try:
            init_db()
            logger.info("PostgreSQL database initialized")
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            logger.warning("Running without database persistence")

    # Initialize vision agent (for file-based analysis)
    await vision_agent.initialize()

    # Initialize football agent (for WebRTC streaming)
    stream_initialized = await football_agent.initialize()

    if VISION_AGENTS_AVAILABLE:
        logger.info("Vision-agents framework loaded")
    else:
        logger.info("Using fallback Gemini Vision API")

    if STREAM_AVAILABLE and stream_initialized:
        logger.info("WebRTC streaming enabled with GetStream edge")
    else:
        logger.info("WebRTC streaming disabled (vision-agents not available)")

    if settings.GEMINI_API_KEY:
        logger.info("Gemini API configured")
    else:
        logger.warning("GEMINI_API_KEY not set - running in demo mode")

    if settings.STREAM_API_KEY:
        logger.info("Stream API configured")
    else:
        logger.warning("STREAM_API_KEY not set - live streaming disabled")

    logger.info(f"Server ready on {settings.HOST}:{settings.PORT}")

    yield

    # Shutdown
    logger.info("Shutting down Super Bowl Analytics Backend...")


# Create FastAPI application
app = FastAPI(
    title="Super Bowl Analytics API",
    description="Real-time video analysis and game insights for Super Bowl LIX using vision-agents",
    version="2.0.0",
    lifespan=lifespan,
)

# Configure CORS - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(video_router, tags=["Video Analysis"])
app.include_router(game_state_router, tags=["Game State"])
app.include_router(websocket_router, tags=["WebSocket"])
app.include_router(stream_router, tags=["WebRTC Streaming"])
app.include_router(match_router, prefix="/match", tags=["Match Management"])


@app.get("/")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Super Bowl Analytics API",
        "version": "2.0.0",
        "features": {
            "video_analysis": True,
            "live_stats": True,
            "websocket": True,
            "database": DATABASE_AVAILABLE,
            "vision_agents": VISION_AGENTS_AVAILABLE,
            "webrtc_streaming": STREAM_AVAILABLE and football_agent.is_available,
            "gemini_enabled": bool(settings.GEMINI_API_KEY),
            "stream_enabled": bool(settings.STREAM_API_KEY),
        },
    }


@app.get("/health")
async def detailed_health():
    """Detailed health check with component status."""
    return {
        "status": "healthy",
        "components": {
            "api": "ok",
            "vision_agent": "ok" if VISION_AGENTS_AVAILABLE else "fallback",
            "football_agent": "ok" if football_agent.is_available else "disabled",
            "gemini_api": "ok" if settings.GEMINI_API_KEY else "disabled",
            "stream_api": "ok" if settings.STREAM_API_KEY else "disabled",
            "video_processor": "ok",
        },
        "config": {
            "analysis_fps": settings.ANALYSIS_FPS,
            "confidence_threshold": settings.CONFIDENCE_THRESHOLD,
            "debug_mode": settings.DEBUG,
        },
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )
