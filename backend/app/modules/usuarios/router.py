"""Endpoints de gestión de usuarios (solo admin)."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, status

from app.core.deps import UsuarioAdmin
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import AutoDesactivacion, UsuarioNoEncontrado, UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork

router = APIRouter(prefix="/admin/usuarios", tags=["usuarios (admin)"])

UsuarioId = Annotated[int, Path(gt=0)]


def get_usuario_service() -> UsuarioService:
    return UsuarioService(UsuarioUnitOfWork())


ServicioUsuarios = Annotated[UsuarioService, Depends(get_usuario_service)]


@router.get("", response_model=list[UserPublic], summary="Listar usuarios")
def listar_usuarios(_admin: UsuarioAdmin, service: ServicioUsuarios) -> list[UserPublic]:
    return service.listar()


@router.post("/{usuario_id}/activar", response_model=UserPublic, summary="Activar usuario")
def activar_usuario(
    usuario_id: UsuarioId, _admin: UsuarioAdmin, service: ServicioUsuarios
) -> UserPublic:
    try:
        return service.activar(usuario_id)
    except UsuarioNoEncontrado as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e


@router.post("/{usuario_id}/desactivar", response_model=UserPublic, summary="Desactivar usuario")
def desactivar_usuario(
    usuario_id: UsuarioId, admin: UsuarioAdmin, service: ServicioUsuarios
) -> UserPublic:
    try:
        return service.desactivar(usuario_id, admin_id=admin.id or 0)
    except UsuarioNoEncontrado as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    except AutoDesactivacion as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
