"""
Football Agent using GetStream's vision-agents framework.

This module provides real-time video analysis using vision-agents
with WebRTC streaming for sub-30ms latency.
"""

from typing import Optional, Callable, Any
import asyncio
from dataclasses import dataclass
from enum import Enum

from config import settings
from utils.logger import logger

# Try to import vision-agents components
VISION_AGENTS_AVAILABLE = False
Agent = None
User = None
getstream = None
gemini = None
AgentLauncher = None

try:
    from vision_agents.core import Agent, User
    from vision_agents.plugins import getstream, gemini
    from vision_agents.core import AgentLauncher
    VISION_AGENTS_AVAILABLE = True
    logger.info("vision-agents framework loaded successfully")
except ImportError as e:
    logger.warning(f"vision-agents not installed: {e}. WebRTC streaming disabled.")
except Exception as e:
    # Handle protobuf version conflicts and other runtime errors
    logger.warning(f"vision-agents failed to load: {e}. WebRTC streaming disabled.")


FOOTBALL_INSTRUCTIONS = """
You are an expert NFL analyst for Super Bowl video analysis.
Your job is to analyze live video footage and identify key events in real-time.

For each significant event, identify:
1. **EVENT**: The type of event (Formation, Pass Play, Run Play, Sack, Touchdown, etc.)
2. **DETAILS**: Specific description including:
   - Offensive/defensive formations
   - Player actions and positions
   - Strategic observations
3. **CONFIDENCE**: Your confidence level (0.0-1.0)

Be concise and data-driven. Focus on tactical insights that would help coaches and analysts.
Respond in a structured format:
EVENT: <event_type>
DETAILS: <description>
CONFIDENCE: <0.0-1.0>
---
"""


class SessionStatus(str, Enum):
    """Status of a streaming session."""
    PENDING = "pending"
    CONNECTING = "connecting"
    ACTIVE = "active"
    ENDED = "ended"
    ERROR = "error"


@dataclass
class StreamSession:
    """Represents a streaming session."""
    session_id: str
    status: SessionStatus
    stream_url: Optional[str] = None
    error: Optional[str] = None


class FootballAgent:
    """
    Football analysis agent using vision-agents framework.

    Provides real-time video analysis through WebRTC streaming
    with GetStream edge servers.
    """

    def __init__(self):
        self._launcher: Optional[Any] = None
        self._sessions: dict[str, StreamSession] = {}
        self._agent_sessions: dict[str, Any] = {}  # Maps session_id to AgentSession
        self._initialized = False
        self._agent_factory: Optional[Callable] = None

    async def initialize(self) -> bool:
        """Initialize the football agent with vision-agents framework."""
        if self._initialized:
            return True

        if not VISION_AGENTS_AVAILABLE:
            logger.warning("vision-agents not available, streaming disabled")
            return False

        if not settings.STREAM_API_KEY or not settings.STREAM_API_SECRET:
            logger.warning("Stream API keys not configured")
            return False

        if not settings.GEMINI_API_KEY:
            logger.warning("Gemini API key not configured")
            return False

        try:
            # Create agent factory function
            def create_agent() -> Agent:
                """Factory function to create football analysis agents."""
                return Agent(
                    edge=getstream.Edge(
                        api_key=settings.STREAM_API_KEY,
                        api_secret=settings.STREAM_API_SECRET,
                    ),
                    agent_user=User(
                        name="SuperBowl Analyst",
                        id="superbowl_analyst"
                    ),
                    instructions=FOOTBALL_INSTRUCTIONS,
                    llm=gemini.Realtime(
                        api_key=settings.GEMINI_API_KEY,
                    ),
                )

            self._agent_factory = create_agent

            # Define join_call callback for AgentLauncher
            async def join_call(agent: Agent, call_id: str, session_id: str):
                """Handle joining a call with the agent."""
                await agent.join(call_id=call_id)
                logger.info(f"Agent joined call {call_id} for session {session_id}")

            # Create AgentLauncher with required join_call callback
            self._launcher = AgentLauncher(
                create_agent=create_agent,
                join_call=join_call,
            )

            self._initialized = True
            logger.info("Football Agent initialized with vision-agents framework")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize Football Agent: {e}")
            return False

    async def create_session(self, session_id: str) -> StreamSession:
        """
        Create a new streaming session for video analysis.

        Args:
            session_id: Unique identifier for the session

        Returns:
            StreamSession with connection details
        """
        if not self._initialized:
            await self.initialize()

        if not self._launcher:
            return StreamSession(
                session_id=session_id,
                status=SessionStatus.ERROR,
                error="Vision-agents not available"
            )

        try:
            # Start session with AgentLauncher
            # call_id is used to identify the Stream call
            call_id = f"superbowl-{session_id}"

            # Start the launcher if not already running
            if not self._launcher.running:
                await self._launcher.start()

            # Start a session for this call
            agent_session = await self._launcher.start_session(
                call_id=call_id,
                call_type="default",
            )

            # Build stream URL using GetStream format
            stream_url = f"wss://video.stream-io-api.com/video/call/{call_id}"

            session = StreamSession(
                session_id=session_id,
                status=SessionStatus.ACTIVE,
                stream_url=stream_url,
            )

            # Store both our session and the agent session reference
            self._sessions[session_id] = session
            self._agent_sessions[session_id] = agent_session
            logger.info(f"Created streaming session: {session_id}, call: {call_id}")

            return session

        except Exception as e:
            logger.error(f"Failed to create session {session_id}: {e}")
            session = StreamSession(
                session_id=session_id,
                status=SessionStatus.ERROR,
                error=str(e)
            )
            self._sessions[session_id] = session
            return session

    async def end_session(self, session_id: str) -> bool:
        """
        End an active streaming session.

        Args:
            session_id: Session identifier to end

        Returns:
            True if session was ended successfully
        """
        if session_id not in self._sessions:
            logger.warning(f"Session not found: {session_id}")
            return False

        try:
            if self._launcher:
                await self._launcher.close_session(session_id)

            self._sessions[session_id].status = SessionStatus.ENDED
            logger.info(f"Ended streaming session: {session_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to end session {session_id}: {e}")
            return False

    def get_session(self, session_id: str) -> Optional[StreamSession]:
        """Get session information by ID."""
        return self._sessions.get(session_id)

    def get_all_sessions(self) -> list[StreamSession]:
        """Get all active sessions."""
        return list(self._sessions.values())

    @property
    def is_available(self) -> bool:
        """Check if vision-agents streaming is available."""
        return VISION_AGENTS_AVAILABLE and self._initialized


# Global singleton
football_agent = FootballAgent()
