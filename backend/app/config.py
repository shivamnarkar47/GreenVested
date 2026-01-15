from pydantic import Field
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = Field(default="sqlite:///./esg_platform.db")

    # JWT
    SECRET_KEY: str = Field(default="your-secret-key-here")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)

    # Gemini API
    GEMINI_API_KEY: str = Field(default="")

    # CORS
    FRONTEND_URL: str = Field(default="http://localhost:5173")

    # App Settings
    DEBUG: bool = Field(default=False)
    LOG_LEVEL: str = Field(default="info")

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
