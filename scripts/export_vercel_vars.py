
"""
Archivo TIC IA

Exportar configuración documental para Vercel.

Lee data/manifest.json y obtiene:
- VECTOR_STORE_ID
- DOCUMENT_MANIFEST_B64

No realiza solicitudes a OpenAI.
"""

import base64
import json

from pathlib import Path


# ==========================================
# UBICACION DEL PROYECTO
# ==========================================

ROOT = Path(__file__).resolve().parents[1]

MANIFEST_PATH = (
    ROOT / "data" / "manifest.json"
)


# ==========================================
# VERIFICAR ARCHIVO
# ==========================================

if not MANIFEST_PATH.exists():

    raise SystemExit(
        "No existe data/manifest.json. "
        "Primero sincroniza tus documentos "
        "desde localhost."
    )


# ==========================================
# CARGAR MANIFIESTO
# ==========================================

manifest = json.loads(
    MANIFEST_PATH.read_text(
        encoding="utf-8"
    )
)


# ==========================================
# VALIDAR VECTOR STORE
# ==========================================

vector_store_id = manifest.get(
    "vector_store_id"
)

if not vector_store_id:

    raise SystemExit(
        "No se encontró vector_store_id "
        "en el manifiesto."
    )


# ==========================================
# VALIDAR DOCUMENTOS
# ==========================================

documents = manifest.get(
    "documents"
)

if not documents:

    raise SystemExit(
        "El manifiesto no contiene "
        "documentos indexados."
    )


# ==========================================
# CODIFICAR MANIFIESTO
# ==========================================

json_content = json.dumps(
    manifest,
    ensure_ascii=False,
    separators=(",", ":")
)

encoded_manifest = base64.b64encode(
    json_content.encode("utf-8")
).decode("ascii")


# ==========================================
# MOSTRAR VARIABLES
# ==========================================

print("\n===================================")
print("ARCHIVO TIC IA - VARIABLES VERCEL")
print("===================================\n")

print("VECTOR_STORE_ID=")
print(vector_store_id)

print("\nDOCUMENT_MANIFEST_B64=")
print(encoded_manifest)

print("\n===================================")
print("EXPORTACION COMPLETADA")
print("===================================\n")

print(
    "Copia ambos valores a las variables "
    "de entorno privadas de Vercel."
)

print(
    "No publiques el manifiesto "
    "ni sus valores en GitHub."
)
