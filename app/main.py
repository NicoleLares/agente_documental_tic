
"""Archivo TIC IA - FastAPI, Google Drive, OpenAI RAG y OAuth 2.0."""

import os
from pathlib import Path
from ipaddress import ip_address

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from openai import OpenAI

from app.core.config import settings
from app.models.documento import AskRequest, AskResponse
from app.services.sync_service import SyncService
from app.services.agent_service import AgentService
from app.services.web_auth import router as auth_router


# ==========================================
# 1. CONFIGURACIÓN GENERAL
# ==========================================

ROOT = Path(__file__).resolve().parents[1]

app = FastAPI(
    title="Archivo TIC IA",
    version="1.0.0",
    description=(
        "Agente documental con Google Drive, "
        "OpenAI File Search (RAG) y OAuth 2.0"
    )
)


# ==========================================
# 2. CONFIGURACIÓN DE SESIONES
# ==========================================

if not settings.session_secret or len(settings.session_secret) < 32:
    raise RuntimeError(
        "Configura SESSION_SECRET con al menos "
        "32 caracteres en las variables de entorno"
    )

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret,
    session_cookie="archivo_tic_session",
    max_age=3600,
    same_site="lax",
    https_only=settings.app_base_url.startswith("https://"),
)


# ==========================================
# 3. AUTENTICACIÓN GOOGLE OAUTH 2.0
# ==========================================

app.include_router(auth_router)


# ==========================================
# 4. ARCHIVOS ESTÁTICOS
# ==========================================

app.mount(
    "/assets",
    StaticFiles(directory=ROOT / "assets"),
    name="assets"
)


# ==========================================
# 5. CONFIGURACIÓN DE SEGURIDAD
# ==========================================

def public_ask_enabled():
    """
    Habilita consultas cuando la variable
    ENABLE_PUBLIC_ASK está configurada en true.
    """
    return (
        os.getenv("ENABLE_PUBLIC_ASK", "").lower()
        == "true"
    )


def local_sync_enabled():
    """
    Permite sincronización local cuando
    ENABLE_LOCAL_SYNC está configurada en true.
    """
    return (
        os.getenv("ENABLE_LOCAL_SYNC", "").lower()
        == "true"
    )


# ==========================================
# 6. PROTECCIÓN DE SINCRONIZACIÓN LOCAL
# ==========================================

def local_only(request: Request):
    """
    Permite sincronizar únicamente desde localhost.

    La sincronización pública de Google Drive
    todavía no está habilitada.
    """

    if not local_sync_enabled():
        raise HTTPException(
            status_code=403,
            detail="Sincronización temporalmente deshabilitada"
        )

    host = request.client.host if request.client else ""

    try:
        if not ip_address(host).is_loopback:
            raise ValueError()

    except ValueError:
        raise HTTPException(
            status_code=403,
            detail="Sincronización disponible solo desde localhost"
        )

    key = settings.local_admin_key

    if key and request.headers.get("X-Admin-Key") != key:
        raise HTTPException(
            status_code=401,
            detail="Clave administrativa incorrecta"
        )


# ==========================================
# 7. PÁGINA PRINCIPAL
# ==========================================

@app.get("/")
def index():
    return FileResponse(ROOT / "index.html")


# ==========================================
# 8. ESTADO DEL SERVIDOR
# ==========================================

@app.get("/api/health")
def health():

    return {
        "status": "ok",
        "configured": bool(
            settings.openai_api_key
            and settings.drive_folder_id
        )
    }


# ==========================================
# 9. DOCUMENTOS INDEXADOS
# ==========================================

@app.get("/api/documents")
def documents():

    manifest = SyncService.load_manifest()

    local_docs = manifest.get("documents", {})

    store_id = (
        settings.vector_store_id
        or manifest.get("vector_store_id")
    )

    # Utilizar el manifiesto local si contiene documentos.
    if local_docs:
        return {
            "documents": list(local_docs.values()),
            "indexed": len(local_docs),
            "vector_store_configured": bool(store_id)
        }

    # Verificar que exista un Vector Store.
    if not store_id:
        return {
            "documents": [],
            "indexed": 0,
            "vector_store_configured": False
        }

    # En Vercel, recuperar documentos desde OpenAI.
    try:
        client = OpenAI(
            api_key=settings.openai_api_key
        )

        response = client.vector_stores.files.list(
            vector_store_id=store_id,
            limit=100
        )

        indexed_documents = []

        for item in response.data:

            file_info = client.files.retrieve(
                item.id
            )

            indexed_documents.append({
                "name": file_info.filename,
                "url": None,
                "openai_file_id": item.id,
                "status": item.status
            })

        return {
            "documents": indexed_documents,
            "indexed": len(indexed_documents),
            "vector_store_configured": True
        }

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=(
                "No se pudieron recuperar los "
                "documentos de OpenAI"
            )
        ) from exc


# ==========================================
# 10. CONSULTAR AGENTE CON OPENAI RAG
# ==========================================

@app.post(
    "/api/ask",
    response_model=AskResponse
)
def ask(payload: AskRequest):

    # Protección temporal para Vercel.
    if not public_ask_enabled():
        raise HTTPException(
            status_code=503,
            detail="Consultas temporalmente deshabilitadas"
        )

    try:
        if not settings.openai_api_key:
            raise ValueError(
                "Falta OPENAI_API_KEY"
            )

        return AgentService().ask(
            payload.question,
            payload.use_search
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    except Exception:
        raise HTTPException(
            status_code=502,
            detail=(
                "Error al consultar OpenAI. "
                "Revisa el registro del servidor."
            )
        )


# ==========================================
# 11. SINCRONIZAR GOOGLE DRIVE
# ==========================================

@app.post(
    "/api/sync",
    dependencies=[Depends(local_only)]
)
def sync():

    try:
        if not settings.openai_api_key:
            raise ValueError(
                "Falta OPENAI_API_KEY"
            )

        return SyncService().sync()

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Sincronización fallida: {exc}"
        )
