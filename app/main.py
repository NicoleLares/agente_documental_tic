
"""Aplicación FastAPI con Google Drive, OpenAI RAG y OAuth 2.0."""

from pathlib import Path
from ipaddress import ip_address

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.core.config import settings
from app.models.documento import AskRequest, AskResponse
from app.services.sync_service import SyncService
from app.services.agent_service import AgentService

# Nuevas rutas de autenticación con Google
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
        "32 caracteres en el archivo .env"
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
# 3. RUTAS DE AUTENTICACIÓN GOOGLE
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
# 5. PROTECCIÓN LOCAL DE SINCRONIZACIÓN
# ==========================================

def local_only(request: Request):
    """
    Permite sincronizar únicamente desde localhost.

    Protección temporal para pruebas locales.
    No equivale a autenticación pública.
    """

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
# 6. PÁGINA PRINCIPAL
# ==========================================

@app.get("/")
def index():
    return FileResponse(ROOT / "index.html")


# ==========================================
# 7. ESTADO DEL SERVIDOR
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
# 8. DOCUMENTOS INDEXADOS
# ==========================================

@app.get("/api/documents")
def documents():

    manifest = SyncService.load_manifest()

    indexed_documents = manifest.get(
        "documents", {}
    )

    return {
        "documents": list(indexed_documents.values()),
        "indexed": len(indexed_documents),
        "vector_store_configured": bool(
            settings.vector_store_id
            or manifest.get("vector_store_id")
        )
    }


# ==========================================
# 9. CONSULTAR AGENTE CON OPENAI RAG
# ==========================================

@app.post(
    "/api/ask",
    response_model=AskResponse
)
def ask(payload: AskRequest):

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
                "Revisa el registro local."
            )
        )


# ==========================================
# 10. SINCRONIZAR GOOGLE DRIVE
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
