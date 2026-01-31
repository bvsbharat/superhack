import asyncio
from typing import Callable, Optional, Coroutine, Any
from models.schemas import GameState, ScoreState
from utils.logger import logger


class StateManager:
    """Manages game state and notifies subscribers of changes."""

    def __init__(self):
        self._state = GameState(
            clock="15:00",
            quarter=1,
            score=ScoreState(home=0, away=0),
            down=1,
            distance=10,
            possession="KC",
            lastPlay="Ready for kickoff.",
            winProb=50.0,
            offensiveEpa=0.0,
            defensiveStopRate=50.0,
            engagement="0",
        )
        self._subscribers: list[Callable[[GameState], Coroutine[Any, Any, None]]] = []
        self._lock = asyncio.Lock()

    @property
    def state(self) -> GameState:
        """Get current game state."""
        return self._state

    def subscribe(self, callback: Callable[[GameState], Coroutine[Any, Any, None]]) -> None:
        """Subscribe to state changes."""
        self._subscribers.append(callback)
        logger.debug(f"New subscriber added. Total: {len(self._subscribers)}")

    def unsubscribe(self, callback: Callable[[GameState], Coroutine[Any, Any, None]]) -> None:
        """Unsubscribe from state changes."""
        if callback in self._subscribers:
            self._subscribers.remove(callback)
            logger.debug(f"Subscriber removed. Total: {len(self._subscribers)}")

    async def _notify_subscribers(self) -> None:
        """Notify all subscribers of state change."""
        for callback in self._subscribers:
            try:
                await callback(self._state)
            except Exception as e:
                logger.error(f"Failed to notify subscriber: {e}")

    async def update_score(self, home: Optional[int] = None, away: Optional[int] = None) -> None:
        """Update game score."""
        async with self._lock:
            if home is not None:
                self._state.score.home = home
            if away is not None:
                self._state.score.away = away
            await self._notify_subscribers()

    async def update_clock(self, clock: str, quarter: Optional[int] = None) -> None:
        """Update game clock and optionally quarter."""
        async with self._lock:
            self._state.clock = clock
            if quarter is not None:
                self._state.quarter = quarter
            await self._notify_subscribers()

    async def update_possession(
        self,
        possession: str,
        down: Optional[int] = None,
        distance: Optional[int] = None,
    ) -> None:
        """Update possession and down/distance."""
        async with self._lock:
            self._state.possession = possession
            if down is not None:
                self._state.down = down
            if distance is not None:
                self._state.distance = distance
            await self._notify_subscribers()

    async def update_play(
        self,
        last_play: str,
        win_prob: Optional[float] = None,
        epa: Optional[float] = None,
    ) -> None:
        """Update last play description and analytics."""
        async with self._lock:
            self._state.lastPlay = last_play
            if win_prob is not None:
                self._state.winProb = win_prob
            if epa is not None:
                self._state.offensiveEpa = epa
            await self._notify_subscribers()

    async def set_state(self, state: GameState) -> None:
        """Set complete game state."""
        async with self._lock:
            self._state = state
            await self._notify_subscribers()

    def reset(self) -> None:
        """Reset to initial state."""
        self._state = GameState(
            clock="15:00",
            quarter=1,
            score=ScoreState(home=0, away=0),
            down=1,
            distance=10,
            possession="KC",
            lastPlay="Ready for kickoff.",
            winProb=50.0,
            offensiveEpa=0.0,
            defensiveStopRate=50.0,
            engagement="0",
        )


# Global singleton instance
state_manager = StateManager()
