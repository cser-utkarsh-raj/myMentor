import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "myMentor"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8000
    UPLOAD_FOLDER: str = "./uploads"
    
    # Database Settings
    DATABASE_URL: str = "sqlite:///./mymentor.db"
    
    # Security
    JWT_SECRET: str = "supersecretjwtkeyforlocaldevelopmentonlychangeinprod"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # API Keys (V2 Expansion Placeholders)
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()

# Ensure uploads folder exists
os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
