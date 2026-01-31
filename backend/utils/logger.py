import logging
import sys
from config import settings


def setup_logger(name: str = "superbowl") -> logging.Logger:
    """Set up and return a configured logger."""
    log = logging.getLogger(name)

    if log.handlers:
        return log

    level = logging.DEBUG if settings.DEBUG else logging.INFO
    log.setLevel(level)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)

    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s - %(name)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    log.addHandler(handler)

    return log


logger = setup_logger()
