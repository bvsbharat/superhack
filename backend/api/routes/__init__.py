from .video import router as video_router
from .game_state import router as game_state_router
from .websocket import router as websocket_router
from .stream import router as stream_router
from .video_generation import router as video_generation_router

__all__ = ["video_router", "game_state_router", "websocket_router", "stream_router", "video_generation_router"]
