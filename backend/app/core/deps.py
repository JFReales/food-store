"""Dependencias de sesión y rol.

- get_current_user: lee el JWT de la cookie HttpOnly access_token, valida
  firma y expiración y carga el usuario (401 si algo falla).
- get_current_active_user: además rechaza usuarios desactivados (400).
- require_role: además exige uno de los roles indicados (403).
"""

from collections.abc import Callable, Iterator
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyCookie
from sqlmodel import Session

from app.core.database import session_factory
from app.core.security import decode_access_token
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.repository import UsuarioRepository

CUENTA_DESACTIVADA = "Cuenta de usuario desactivada"

# Declararlo como esquema de seguridad hace que /docs muestre qué endpoints
# requieren sesión. El navegador envía la cookie solo (también desde /docs).
cookie_access_token = APIKeyCookie(
    name="access_token",
    auto_error=False,
    description="JWT en cookie HttpOnly; se obtiene con POST /api/v1/auth/token.",
)


def get_db() -> Iterator[Session]:
    """Sesión de solo lectura para resolver el usuario de la cookie."""
    with session_factory() as session:
        yield session


def _no_autenticado(detalle: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detalle)


def get_current_user(
    token: Annotated[str | None, Depends(cookie_access_token)],
    session: Annotated[Session, Depends(get_db)],
) -> Usuario:
    if not token:
        raise _no_autenticado("No autenticado")
    username = decode_access_token(token)
    if username is None:
        raise _no_autenticado("Token inválido o vencido")
    usuario = UsuarioRepository(session).get_by_username(username)
    if usuario is None:
        raise _no_autenticado("Token inválido o vencido")
    return usuario


def get_current_active_user(
    usuario: Annotated[Usuario, Depends(get_current_user)],
) -> Usuario:
    if usuario.disabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=CUENTA_DESACTIVADA)
    return usuario


def require_role(roles: list[str]) -> Callable[[Usuario], Usuario]:
    def verificar_rol(usuario: Annotated[Usuario, Depends(get_current_active_user)]) -> Usuario:
        if usuario.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para realizar esta acción",
            )
        return usuario

    return verificar_rol


# Atajos para los routers.
UsuarioActual = Annotated[Usuario, Depends(get_current_active_user)]
UsuarioAdmin = Annotated[Usuario, Depends(require_role(["admin"]))]
