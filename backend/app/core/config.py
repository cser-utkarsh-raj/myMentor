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


def _origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "")
    if raw.strip():
        return [item.strip().rstrip("/") for item in raw.split(",") if item.strip()]
    return [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://my-mentor-wheat.vercel.app",
        "https://my-mentor-cser-utkarsh-rajs-projects.vercel.app",
    ]


class Settings(BaseSettings):
    PROJECT_NAME: str = "myMentor"
    API_V1_STR: str = "/api/v1"
    PORT: int = 8000
    UPLOAD_FOLDER: str = "./uploads"
    ALLOWED_ORIGINS: list[str] = Field(default_factory=_origins)
    DATABASE_URL: str = "sqlite:///./mymentor.db"
    JWT_SECRET: str = "supersecretjwtkeyforlocaldevelopmentonlychangeinprod"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY"))
    GEMINI_API_KEY_2: str | None = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY_2"))
    GEMINI_API_KEY_3: str | None = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY_3"))
    DEEPSEEK_API_KEY: str | None = Field(default_factory=lambda: os.getenv("DEEPSEEK_API_KEY"))
    SUPABASE_JWT_SECRET: str | None = Field(default_factory=lambda: os.getenv("SUPABASE_JWT_SECRET"))

    class Config:
        case_sensitive = True
        extra = "ignore"


settings = Settings()
os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
