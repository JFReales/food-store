"""Gestión de usuarios por el admin: listar, activar y desactivar."""

from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class UsuarioNoEncontrado(Exception):
    """404"""


class AutoDesactivacion(Exception):
    """400: el admin no puede desactivarse a sí mismo."""


class UsuarioService:
    def __init__(self, uow: UsuarioUnitOfWork) -> None:
        self.uow = uow

    def listar(self) -> list[UserPublic]:
        with self.uow as uow:
            return [UserPublic.model_validate(u) for u in uow.usuarios.listar()]

    def _cambiar_estado(self, usuario_id: int, disabled: bool) -> UserPublic:
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(usuario_id)
            if usuario is None:
                raise UsuarioNoEncontrado(f"Usuario con id {usuario_id} no encontrado")
            usuario.disabled = disabled  # idempotente: 200 aunque no cambie
            uow.session.add(usuario)
            uow.session.flush()
            return UserPublic.model_validate(usuario)

    def activar(self, usuario_id: int) -> UserPublic:
        return self._cambiar_estado(usuario_id, disabled=False)

    def desactivar(self, usuario_id: int, admin_id: int) -> UserPublic:
        if usuario_id == admin_id:
            raise AutoDesactivacion("Un administrador no puede desactivarse a sí mismo")
        return self._cambiar_estado(usuario_id, disabled=True)
