import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
from pydantic import Field

BASE_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = Path(__file__).resolve().parents[2]
for env_path in [ROOT_DIR / ".env", BASE_DIR / ".env", BASE_DIR / ".env.local", Path(".env"), Path("/app/.env")]:
    if env_path.exists():
        load_dotenv(env_path, override=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "myMentor"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8000
    UPLOAD_FOLDER: str = "./uploads"
    
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://my-mentor-wheat.vercel.app"
    ]
    
    # Database Settings
    DATABASE_URL: str = "sqlite:///./mymentor.db"
    
    # Security
    JWT_SECRET: str = "supersecretjwtkeyforlocaldevelopmentonlychangeinprod"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # API Keys
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY"))

    class Config:
        case_sensitive = True
        extra = "ignore"

settings = Settings()

# Ensure uploads folder exists
os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
