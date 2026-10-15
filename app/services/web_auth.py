
"""Autenticación web con Google OAuth 2.0."""

import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token

from app.core.config import settings


router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


def callback_url():
    return settings.app_base_url + "/api/auth/google/callback"


@router.get("/google/login")
def google_login(request: Request):

    if not (
        settings.google_web_client_id
        and settings.google_web_client_secret
        and settings.google_allowed_email
    ):
        raise HTTPException(
            status_code=503,
            detail="Autenticación Google no configurada"
        )

    state = secrets.token_urlsafe(32)

    request.session.clear()
    request.session["oauth_state"] = state

    params = {
        "client_id": settings.google_web_client_id,
        "redirect_uri": callback_url(),
        "response_type": "code",
        "scope": "openid email",
        "state": state,
        "prompt": "select_account",
    }

    url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        + urlencode(params)
    )

    return RedirectResponse(url)


@router.get("/google/callback")
def google_callback(request: Request):

    received_state = request.query_params.get("state", "")
    saved_state = request.session.pop("oauth_state", "")

    if (
        not saved_state
        or not received_state
        or not secrets.compare_digest(saved_state, received_state)
    ):
        raise HTTPException(
            status_code=400,
            detail="Estado OAuth inválido"
        )

    code = request.query_params.get("code")

    if not code:
        raise HTTPException(
            status_code=400,
            detail="Google no devolvió autorización"
        )

    try:
        response = httpx.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_web_client_id,
                "client_secret": settings.google_web_client_secret,
                "redirect_uri": callback_url(),
                "grant_type": "authorization_code",
            },
            timeout=20,
        )

        response.raise_for_status()
        tokens = response.json()

        info = id_token.verify_oauth2_token(
            tokens["id_token"],
            GoogleRequest(),
            settings.google_web_client_id,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="No se pudo verificar la autenticación Google"
        ) from exc

    email = info.get("email", "").strip().lower()

    if (
        not info.get("email_verified")
        or not settings.google_allowed_email
        or email != settings.google_allowed_email
    ):
        request.session.clear()
        raise HTTPException(
            status_code=403,
            detail="Cuenta de Google no autorizada"
        )

    request.session.clear()
    request.session["email"] = email

    return RedirectResponse(url="/", status_code=303)


@router.get("/me")
def current_user(request: Request):

    email = request.session.get("email", "")

    authorized = bool(
        settings.google_allowed_email
        and email == settings.google_allowed_email
    )

    return {"authenticated": authorized}


@router.post("/logout")
def logout(request: Request):
    request.session.clear()
    return {"success": True}


# ==========================================
# PROTEGER RUTAS DEL AGENTE
# ==========================================

def require_user(request: Request):
    """
    Verifica que exista una sesión iniciada
    con la cuenta de Google autorizada.
    """

    email = (
        request.session.get("email") or ""
    ).strip().lower()

    allowed_email = settings.google_allowed_email

    if not allowed_email or email != allowed_email:
        raise HTTPException(
            status_code=401,
            detail="Debes iniciar sesión con Google para continuar"
        )

    return email
