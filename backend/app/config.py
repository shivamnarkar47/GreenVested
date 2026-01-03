from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://nmysjuoyupfrjrzltafv:qdyxqgsgqcgzxdczubnlnqijklomfc@9qasp5v56q8ckkf5dc.leapcellpool.com:6438/oizdouccekdkjexgquqo?sslmode=require"

    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Gemini API
    GEMINI_API_KEY: str = "AIzaSyD_OoBT2XPAdVP4bicwPzVNMQbU_Onc7mM"

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # App Settings
    DEBUG: bool = True
    LOG_LEVEL: str = "info"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
