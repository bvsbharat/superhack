import math
from utils.logger import logger


class WinProbabilityModel:
    """
    Win probability model using logistic regression.

    Factors: score differential, time remaining, possession, field position
    """

    # Model coefficients (simplified logistic model)
    INTERCEPT = 0.0
    SCORE_DIFF_COEF = 0.15  # Per point difference
    TIME_COEF = -0.001  # Per second remaining (reduces score impact)
    POSSESSION_COEF = 0.1  # Bonus for having possession
    FIELD_POS_COEF = 0.01  # Per yard closer to opponent end zone

    def calculate_win_probability(
        self,
        score_diff: int,
        seconds_remaining: int,
        has_possession: bool,
        yard_line: int = 50,
        is_own_territory: bool = True,
    ) -> float:
        """
        Calculate win probability for the team with the ball.

        Args:
            score_diff: Current score differential (positive = leading)
            seconds_remaining: Seconds left in the game
            has_possession: Whether calculating for possessing team
            yard_line: Current yard line
            is_own_territory: Whether in own territory

        Returns:
            Win probability (0.0 to 1.0)
        """
        # Convert field position to unified scale
        if is_own_territory:
            field_pos = yard_line
        else:
            field_pos = 100 - yard_line

        # Calculate logit
        logit = self.INTERCEPT
        logit += self.SCORE_DIFF_COEF * score_diff
        logit += self.TIME_COEF * seconds_remaining * abs(score_diff)
        logit += self.POSSESSION_COEF if has_possession else -self.POSSESSION_COEF
        logit += self.FIELD_POS_COEF * (field_pos - 50)

        # Time pressure adjustment
        # As time decreases, score differential becomes more important
        if seconds_remaining < 300:  # Last 5 minutes
            logit += self.SCORE_DIFF_COEF * score_diff * 0.5

        # Convert to probability via sigmoid
        try:
            prob = 1.0 / (1.0 + math.exp(-logit))
        except OverflowError:
            prob = 0.0 if logit < 0 else 1.0

        return round(prob, 4)

    def calculate_from_game_state(self, game_state: dict) -> float:
        """
        Calculate win probability from a GameState dictionary.

        Args:
            game_state: Dictionary with clock, quarter, score, possession

        Returns:
            Win probability as percentage (0-100)
        """
        # Parse clock
        clock = game_state.get("clock", "15:00")
        try:
            parts = clock.split(":")
            minutes = int(parts[0])
            seconds = int(parts[1]) if len(parts) > 1 else 0
        except (ValueError, IndexError):
            minutes, seconds = 15, 0

        quarter = game_state.get("quarter", 1)

        # Calculate total seconds remaining
        quarter_seconds = minutes * 60 + seconds
        remaining_quarters = 4 - quarter
        total_seconds = quarter_seconds + (remaining_quarters * 15 * 60)

        # Get score differential for possession team
        score = game_state.get("score", {"home": 0, "away": 0})
        possession = game_state.get("possession", "KC")

        if possession == "KC":
            score_diff = score.get("home", 0) - score.get("away", 0)
        else:
            score_diff = score.get("away", 0) - score.get("home", 0)

        prob = self.calculate_win_probability(
            score_diff=score_diff,
            seconds_remaining=total_seconds,
            has_possession=True,
        )

        return round(prob * 100, 1)


# Global singleton
win_probability_model = WinProbabilityModel()
