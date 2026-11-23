"""Endpoints de autenticación: registro, login con cookie HttpOnly, logout y /me."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.deps import UsuarioActual
from app.modules.auth.schemas import Mensaje
from app.modules.auth.service import (
    AuthService,
    CredencialesInvalidas,
    CuentaDesactivada,
    UsuarioDuplicado,
)
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE = "access_token"


def get_auth_service() -> AuthService:
    return AuthService(UsuarioUnitOfWork())


ServicioAuth = Annotated[AuthService, Depends(get_auth_service)]


@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar un usuario (rol user)",
)
def registrar(data: UserCreate, service: ServicioAuth) -> UserPublic:
    try:
        return service.registrar(data)
    except UsuarioDuplicado as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e)) from e


@router.post("/token", response_model=Mensaje, summary="Login (formulario OAuth2)")
def login(
    response: Response,
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: ServicioAuth,
) -> Mensaje:
    try:
        token = service.autenticar(form.username, form.password)
    except CredencialesInvalidas as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)) from e
    except CuentaDesactivada as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    # El token viaja SOLO en la cookie: HttpOnly impide que JavaScript lo lea.
    response.set_cookie(
        key=COOKIE,
        value=token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,  # en producción con HTTPS: True
        path="/",
    )
    return Mensaje(message="Login exitoso")


@router.post("/logout", response_model=Mensaje, summary="Cerrar sesión (borra la cookie)")
def logout(response: Response) -> Mensaje:
    response.delete_cookie(key=COOKIE, path="/", httponly=True, samesite="lax")
    return Mensaje(message="Sesión cerrada")


@router.get("/me", response_model=UserPublic, summary="Usuario de la sesión")
def me(usuario: UsuarioActual) -> UserPublic:
    return UserPublic.model_validate(usuario)
