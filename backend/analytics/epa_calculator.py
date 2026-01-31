from typing import Optional
from utils.logger import logger


class EPACalculator:
    """
    Expected Points Added calculator.

    Uses a simplified model based on down, distance, and field position
    to estimate expected points for a given situation.
    """

    # Expected points by field position (yard line to opponent end zone)
    # Simplified lookup table
    FIELD_POSITION_EP = {
        # Own territory
        1: -1.5,  # Own 1 yard line
        5: -1.2,
        10: -0.8,
        15: -0.5,
        20: -0.2,
        25: 0.0,
        30: 0.3,
        35: 0.6,
        40: 0.9,
        45: 1.2,
        50: 1.5,
        # Opponent territory
        55: 1.8,
        60: 2.1,
        65: 2.4,
        70: 2.8,
        75: 3.2,
        80: 3.6,
        85: 4.0,
        90: 4.5,
        95: 5.2,
        99: 6.0,
    }

    # Down adjustment factors
    DOWN_ADJUSTMENTS = {
        1: 0.0,   # First down - baseline
        2: -0.3,  # Second down - slightly harder
        3: -0.8,  # Third down - much harder
        4: -1.5,  # Fourth down - critical
    }

    # Distance penalty (per yard over 10)
    DISTANCE_PENALTY_PER_YARD = 0.05

    def calculate_ep(
        self,
        down: int,
        distance: int,
        yard_line: int,
        is_own_territory: bool = True,
    ) -> float:
        """
        Calculate expected points for a given situation.

        Args:
            down: Current down (1-4)
            distance: Yards to first down
            yard_line: Yard line (1-50 for own territory, 1-50 for opponent)
            is_own_territory: Whether the ball is in own territory

        Returns:
            Expected points value
        """
        # Convert to unified field position (1-99, higher = closer to opponent end zone)
        if is_own_territory:
            field_pos = yard_line
        else:
            field_pos = 100 - yard_line

        # Get base EP from field position
        base_ep = self._interpolate_ep(field_pos)

        # Apply down adjustment
        down_adj = self.DOWN_ADJUSTMENTS.get(down, 0.0)

        # Apply distance penalty (if > 10 yards)
        distance_adj = 0.0
        if distance > 10:
            distance_adj = -(distance - 10) * self.DISTANCE_PENALTY_PER_YARD

        ep = base_ep + down_adj + distance_adj
        return round(ep, 2)

    def _interpolate_ep(self, field_pos: int) -> float:
        """Interpolate EP value from lookup table."""
        field_pos = max(1, min(99, field_pos))

        # Find surrounding values
        lower_key = max(k for k in self.FIELD_POSITION_EP.keys() if k <= field_pos)
        upper_key = min(k for k in self.FIELD_POSITION_EP.keys() if k >= field_pos)

        if lower_key == upper_key:
            return self.FIELD_POSITION_EP[lower_key]

        # Linear interpolation
        lower_ep = self.FIELD_POSITION_EP[lower_key]
        upper_ep = self.FIELD_POSITION_EP[upper_key]

        ratio = (field_pos - lower_key) / (upper_key - lower_key)
        return lower_ep + ratio * (upper_ep - lower_ep)

    def calculate_epa(
        self,
        pre_down: int,
        pre_distance: int,
        pre_yard_line: int,
        post_down: int,
        post_distance: int,
        post_yard_line: int,
        is_turnover: bool = False,
        is_touchdown: bool = False,
        pre_own_territory: bool = True,
        post_own_territory: bool = False,
    ) -> float:
        """
        Calculate EPA for a play.

        Args:
            pre_*/post_*: Situation before and after the play
            is_turnover: Whether possession changed
            is_touchdown: Whether a touchdown was scored

        Returns:
            Expected Points Added for the play
        """
        if is_touchdown:
            return 7.0 - self.calculate_ep(pre_down, pre_distance, pre_yard_line, pre_own_territory)

        pre_ep = self.calculate_ep(pre_down, pre_distance, pre_yard_line, pre_own_territory)

        if is_turnover:
            # Opponent gets the ball, flip perspective
            post_ep = -self.calculate_ep(1, 10, post_yard_line, not post_own_territory)
        else:
            post_ep = self.calculate_ep(post_down, post_distance, post_yard_line, post_own_territory)

        return round(post_ep - pre_ep, 2)


# Global singleton
epa_calculator = EPACalculator()
