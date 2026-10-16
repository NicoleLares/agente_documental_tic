
"""
Archivo TIC IA
Configuración para localhost y Vercel.
"""

import os

from dataclasses import dataclass
from dotenv import load_dotenv


# Leer .env cuando existe.
load_dotenv()


@dataclass(frozen=True)
class Settings:

    # ====================================
    # OPENAI
    # ====================================

    openai_api_key: str = os.getenv(
        "OPENAI_API_KEY",
        ""
    )

    openai_model: str = os.getenv(
        "OPENAI_MODEL",
        "gpt-4.1-mini"
    )

    # ====================================
    # GOOGLE DRIVE
    # ====================================

    drive_folder_id: str = os.getenv(
        "GOOGLE_DRIVE_FOLDER_ID",
        ""
    )

    # ====================================
    # VECTOR STORE
    # ====================================

    vector_store_id: str = os.getenv(
        "VECTOR_STORE_ID",
        ""
    )

    # ====================================
    # ADMINISTRACION LOCAL
    # ====================================

    local_admin_key: str = os.getenv(
        "LOCAL_ADMIN_KEY",
        ""
    )

    # ====================================
    # GITHUB PAGES / CORS
    # ====================================

    frontend_origin: str = os.getenv(
        "FRONTEND_ORIGIN",
        ""
    ).rstrip("/")

    # ====================================
    # MANIFIESTO PARA VERCEL
    # ====================================

    # Copia codificada en Base64 de los
    # metadatos del índice local.
    #
    # Se almacena como variable privada
    # de entorno en Vercel.

    document_manifest_b64: str = os.getenv(
        "DOCUMENT_MANIFEST_B64",
        ""
    )

    # ====================================
    # DETECCION DE VERCEL
    # ====================================

    is_vercel: bool = bool(
        os.getenv("VERCEL")
    )


settings = Settings()
