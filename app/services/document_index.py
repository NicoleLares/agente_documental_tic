
"""
Archivo TIC IA

Servicio para cargar el índice documental
en localhost y Vercel.
"""

import base64
import binascii
import json

from app.core.config import settings


# ==========================================
# CARGAR INDICE DOCUMENTAL
# ==========================================

def load_document_index():

    # ======================================
    # MODO LOCALHOST
    # ======================================

    if not settings.is_vercel:

        from app.services.sync_service import (
            SyncService
        )

        return SyncService.load_manifest()

    # ======================================
    # MODO VERCEL
    # ======================================

    # Si no existe un manifiesto configurado,
    # devolver un índice vacío.

    if not settings.document_manifest_b64:

        return {
            "vector_store_id": (
                settings.vector_store_id
            ),
            "documents": {}
        }

    # ======================================
    # DECODIFICAR MANIFIESTO
    # ======================================

    try:

        raw = base64.b64decode(
            settings.document_manifest_b64,
            validate=True
        )

        manifest = json.loads(
            raw.decode("utf-8")
        )

        # Validar estructura.
        if (
            not isinstance(manifest, dict)
            or not isinstance(
                manifest.get("documents"),
                dict
            )
        ):

            raise ValueError(
                "Formato de manifiesto incorrecto"
            )

        return manifest

    except (
        ValueError,
        UnicodeError,
        binascii.Error,
        json.JSONDecodeError
    ) as exc:

        raise ValueError(
            "DOCUMENT_MANIFEST_B64 no es válido"
        ) from exc
