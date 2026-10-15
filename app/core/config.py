
"""Configuración centralizada; carga .env solo en el servidor."""
import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

@dataclass(frozen=True)
class Settings:
    # OpenAI
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    vector_store_id: str = os.getenv("VECTOR_STORE_ID", "")

    # Google Drive
    drive_folder_id: str = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "")

    # Seguridad local
    local_admin_key: str = os.getenv("LOCAL_ADMIN_KEY", "")

    # Google OAuth 2.0 Web
    google_web_client_id: str = os.getenv("GOOGLE_WEB_CLIENT_ID", "")
    google_web_client_secret: str = os.getenv("GOOGLE_WEB_CLIENT_SECRET", "")

    google_allowed_email: str = os.getenv(
                "GOOGLE_ALLOWED_EMAIL", ""
                ).strip().lower()

    # Aplicación web
    app_base_url: str = os.getenv("APP_BASE_URL", "http://localhost:5000").rstrip("/")
    session_secret: str = os.getenv("SESSION_SECRET", "")

settings = Settings()
  