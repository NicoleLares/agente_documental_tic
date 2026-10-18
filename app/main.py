
"""
Archivo TIC IA - Practica 2.3

Backend FastAPI compatible con:
- Localhost: Google Drive y sincronizacion.
- Vercel: consultas a OpenAI y File Search.
"""

import logging
from pathlib import Path
from ipaddress import ip_address
from secrets import compare_digest

from fastapi import (
    FastAPI,
    HTTPException,
    Request,
    Depends
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.models.documento import AskRequest, AskResponse


# ==========================================
# CONFIGURACION
# ==========================================

log = logging.getLogger("archivo_tic_ia")

ROOT = Path(__file__).resolve().parents[1]

app = FastAPI(
    title="Archivo TIC IA",
    description="Agente documental con OpenAI y Google Drive",
    version="1.2.0"
)


# ==========================================
# ORIGENES PERMITIDOS
# ==========================================

# Este es el origen correcto de GitHub Pages.
# NO incluye /agente-documental-tic/.

allowed_origins = {
    "https://nicolelares.github.io"
}

# Agregar el origen de las variables de entorno.

if settings.frontend_origin:
    allowed_origins.add(
        settings.frontend_origin.strip().rstrip("/")
    )


# ==========================================
# CACHE
# ==========================================

@app.middleware("http")
async def no_api_cache(request: Request, call_next):

    response = await call_next(request)

    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"

    return response


# ==========================================
# ARCHIVOS ESTATICOS
# ==========================================

# GitHub Pages sirve el frontend en producción.
# FastAPI sirve los archivos HTML/CSS/JS en local.

if (
    not settings.is_vercel
    and (ROOT / "assets").is_dir()
):
    app.mount(
        "/assets",
        StaticFiles(directory=ROOT / "assets"),
        name="assets"
    )


# ==========================================
# SEGURIDAD DE SINCRONIZACION
# ==========================================

def local_only(request: Request):

    # OAuth de escritorio nunca debe
    # ejecutarse desde Vercel.

    if settings.is_vercel:
        raise HTTPException(
            status_code=404,
            detail="Sincronización disponible solo en localhost"
        )

    host = (
        request.client.host
        if request.client
        else ""
    )

    try:
        if not ip_address(host).is_loopback:
            raise ValueError("No es loopback")

    except ValueError:
        raise HTTPException(
            status_code=403,
            detail="Sincronización permitida solo desde localhost"
        )

    # Clave administrativa local opcional.

    if settings.local_admin_key:

        provided = request.headers.get(
            "X-Admin-Key", ""
        )

        if not compare_digest(
            provided,
            settings.local_admin_key
        ):
            raise HTTPException(
                status_code=401,
                detail="Clave administrativa incorrecta"
            )


# ==========================================
# RUTA PRINCIPAL
# ==========================================

@app.get("/")
def index():

    if settings.is_vercel:
        return {
            "service": "Archivo TIC IA API",
            "status": "ok"
        }

    return FileResponse(ROOT / "index.html")


# ==========================================
# ESTADO DEL SERVIDOR
# ==========================================

@app.get("/api/health")
def health():

    if settings.is_vercel:

        configured = bool(
            settings.openai_api_key
            and settings.vector_store_id
            and settings.document_manifest_b64
        )

    else:

        configured = bool(
            settings.openai_api_key
            and settings.drive_folder_id
        )

    return {
        "status": "ok",
        "configured": configured
    }


# ==========================================
# DOCUMENTOS INDEXADOS
# ==========================================

@app.get("/api/documents")
def documents():

    # Importacion diferida.
    # /api/health puede funcionar incluso
    # si el indice tiene un problema.

    from app.services.document_index import (
        load_document_index
    )

    try:
        manifest = load_document_index()

    except ValueError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc)
        ) from exc

    entries = manifest.get("documents", {})

    if not isinstance(entries, dict):
        raise HTTPException(
            status_code=503,
            detail="El inventario documental tiene un formato inválido"
        )

    docs = list(entries.values())

    return {
        "documents": docs,
        "indexed": len(docs),
        "vector_store_configured": bool(
            settings.vector_store_id
            or manifest.get("vector_store_id")
        )
    }


# ==========================================
# CONSULTAR OPENAI
# ==========================================

@app.post(
    "/api/ask",
    response_model=AskResponse
)
def ask(payload: AskRequest):

    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503,
            detail="Falta la configuración de OpenAI"
        )

    try:

        # Solo importar OpenAI cuando
        # se realice una consulta.

        from app.services.agent_service import (
            AgentService
        )

        agent = AgentService()

        return agent.ask(
            payload.question,
            payload.use_search
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc

    except Exception:

        log.exception(
            "Error durante la consulta documental"
        )

        raise HTTPException(
            status_code=502,
            detail="No se pudo completar la consulta de OpenAI"
        )


# ==========================================
# SINCRONIZAR GOOGLE DRIVE
# ==========================================

@app.post(
    "/api/sync",
    dependencies=[Depends(local_only)]
)
def sync():

    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503,
            detail="Falta la configuración de OpenAI"
        )

    # Este modulo solo se carga cuando
    # se sincroniza desde localhost.

    from app.services.sync_service import SyncService

    try:

        service = SyncService()

        return service.sync()

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc

    except Exception:

        log.exception(
            "Error durante la sincronizacion de Drive"
        )

        raise HTTPException(
            status_code=502,
            detail="No se pudo completar la sincronización"
        )


# ==========================================
# CORS PARA GITHUB PAGES
# ==========================================

# Se registra al final para envolver los
# demás middlewares de la aplicación.

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(allowed_origins),
    allow_methods=[
        "GET",
        "POST",
        "OPTIONS"
    ],
    allow_headers=[
        "Content-Type"
    ],
    allow_credentials=False
)
