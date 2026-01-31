import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set

from models.schemas import GameState
from services.state_manager import state_manager
from utils.logger import logger

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        """Accept and register a new connection."""
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        """Remove a connection."""
        async with self._lock:
            self.active_connections.discard(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Send message to all connected clients."""
        if not self.active_connections:
            return

        dead_connections = set()
        message_json = json.dumps(message)

        async with self._lock:
            for connection in self.active_connections:
                try:
                    await connection.send_text(message_json)
                except Exception as e:
                    logger.warning(f"Failed to send to client: {e}")
                    dead_connections.add(connection)

            # Remove dead connections
            self.active_connections -= dead_connections

    async def send_personal(self, websocket: WebSocket, message: dict):
        """Send message to a specific client."""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.warning(f"Failed to send personal message: {e}")


# Global connection manager
manager = ConnectionManager()


async def on_state_change(state: GameState):
    """Callback for state manager to broadcast updates."""
    await manager.broadcast({
        "type": "game_state_update",
        "data": state.model_dump(),
    })


# Subscribe to state changes
state_manager.subscribe(on_state_change)


@router.websocket("/ws/game_updates")
async def game_updates_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time game updates.

    Clients receive:
    - game_state_update: When game state changes
    - analysis_update: When new video analysis is available
    - ping: Periodic keepalive

    Clients can send:
    - subscribe: Subscribe to specific update types
    - unsubscribe: Unsubscribe from update types
    """
    await manager.connect(websocket)

    # Send initial state
    await manager.send_personal(websocket, {
        "type": "connected",
        "data": {
            "message": "Connected to Super Bowl Analytics",
            "initial_state": state_manager.state.model_dump(),
        },
    })

    try:
        while True:
            # Wait for client messages
            try:
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30.0,  # 30 second timeout
                )

                # Handle client messages
                try:
                    message = json.loads(data)
                    msg_type = message.get("type", "")

                    if msg_type == "ping":
                        await manager.send_personal(websocket, {"type": "pong"})

                    elif msg_type == "get_state":
                        await manager.send_personal(websocket, {
                            "type": "game_state_update",
                            "data": state_manager.state.model_dump(),
                        })

                    elif msg_type == "subscribe":
                        # Acknowledge subscription
                        await manager.send_personal(websocket, {
                            "type": "subscribed",
                            "data": {"topics": message.get("topics", [])},
                        })

                except json.JSONDecodeError:
                    await manager.send_personal(websocket, {
                        "type": "error",
                        "data": {"message": "Invalid JSON"},
                    })

            except asyncio.TimeoutError:
                # Send keepalive ping
                await manager.send_personal(websocket, {"type": "ping"})

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await manager.disconnect(websocket)


@router.get("/ws/status")
async def websocket_status():
    """Get WebSocket connection status."""
    return {
        "active_connections": len(manager.active_connections),
        "endpoint": "/ws/game_updates",
    }
