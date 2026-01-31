"""
Stream routes for WebRTC-based video analysis sessions.

Provides endpoints for creating and managing real-time
video streaming sessions using vision-agents.
"""

import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from core.football_agent import football_agent, SessionStatus, VISION_AGENTS_AVAILABLE
from utils.logger import logger

router = APIRouter(prefix="/stream")


class CreateSessionResponse(BaseModel):
    """Response model for session creation."""
    session_id: str
    status: str
    stream_url: Optional[str] = None
    api_key: Optional[str] = None
    error: Optional[str] = None


class SessionInfoResponse(BaseModel):
    """Response model for session information."""
    session_id: str
    status: str
    stream_url: Optional[str] = None


class EndSessionResponse(BaseModel):
    """Response model for ending a session."""
    session_id: str
    stopped: bool
    message: str


@router.post("/sessions", response_model=CreateSessionResponse)
async def create_session():
    """
    Create a new WebRTC streaming session for video analysis.

    Returns connection details including session ID and stream URL
    for connecting the frontend video stream.

    The session uses GetStream's edge servers for low-latency
    WebRTC streaming with Gemini Vision analysis.
    """
    if not VISION_AGENTS_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Vision-agents framework not available. Install with: pip install vision-agents[gemini,getstream]"
        )

    # Generate unique session ID
    session_id = str(uuid.uuid4())

    # Create session through football agent
    session = await football_agent.create_session(session_id)

    if session.status == SessionStatus.ERROR:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create session: {session.error}"
        )

    from config import settings

    return CreateSessionResponse(
        session_id=session.session_id,
        status=session.status.value,
        stream_url=session.stream_url,
        api_key=settings.STREAM_API_KEY,
    )


@router.delete("/sessions/{session_id}", response_model=EndSessionResponse)
async def end_session(session_id: str):
    """
    End an active streaming session.

    Args:
        session_id: The session ID to terminate

    Returns:
        Confirmation that session was stopped
    """
    session = football_agent.get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=404,
            detail=f"Session not found: {session_id}"
        )

    if session.status == SessionStatus.ENDED:
        return EndSessionResponse(
            session_id=session_id,
            stopped=True,
            message="Session was already ended"
        )

    success = await football_agent.end_session(session_id)

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to end session"
        )

    return EndSessionResponse(
        session_id=session_id,
        stopped=True,
        message="Session ended successfully"
    )


@router.get("/sessions/{session_id}", response_model=SessionInfoResponse)
async def get_session(session_id: str):
    """
    Get information about a streaming session.

    Args:
        session_id: The session ID to query

    Returns:
        Current session status and connection info
    """
    session = football_agent.get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=404,
            detail=f"Session not found: {session_id}"
        )

    return SessionInfoResponse(
        session_id=session.session_id,
        status=session.status.value,
        stream_url=session.stream_url,
    )


@router.get("/sessions")
async def list_sessions():
    """
    List all streaming sessions.

    Returns:
        List of all sessions with their current status
    """
    sessions = football_agent.get_all_sessions()

    return {
        "sessions": [
            {
                "session_id": s.session_id,
                "status": s.status.value,
                "stream_url": s.stream_url,
            }
            for s in sessions
        ],
        "total": len(sessions),
    }


@router.get("/capabilities")
async def get_stream_capabilities():
    """
    Get streaming capabilities and status.

    Returns information about WebRTC streaming availability
    and configuration.
    """
    from config import settings

    return {
        "vision_agents_available": VISION_AGENTS_AVAILABLE,
        "stream_configured": bool(settings.STREAM_API_KEY and settings.STREAM_API_SECRET),
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "agent_initialized": football_agent.is_available,
        "features": {
            "webrtc_streaming": VISION_AGENTS_AVAILABLE,
            "real_time_analysis": True,
            "sub_30ms_latency": VISION_AGENTS_AVAILABLE,
            "camera_capture": True,
            "screen_capture": True,
        },
    }
