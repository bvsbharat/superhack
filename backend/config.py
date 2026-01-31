import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application configuration loaded from environment variables."""

    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    STREAM_API_KEY: str = os.getenv("STREAM_API_KEY", "")
    STREAM_API_SECRET: str = os.getenv("STREAM_API_SECRET", "")
    VEO_API_KEY: str = os.getenv("VEO_API_KEY", "")

    # Server config
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Analysis config
    ANALYSIS_FPS: int = int(os.getenv("ANALYSIS_FPS", "5"))
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))

    # Allowed origins for CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]


settings = Settings()
