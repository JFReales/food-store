"""Endpoints de pedidos.

El Router obtiene el Service con Depends(get_pedido_service), no abre el Unit
of Work y traduce las excepciones de dominio a HTTPException.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.core.deps import UsuarioActual, UsuarioAdmin
from app.modules.pedidos.schemas import (
    CambioEstado,
    EstadoValido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.service import (
    PedidoAjeno,
    PedidoNoEncontrado,
    PedidoService,
    ReglaDeNegocio,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.service import ProductoNoEncontrado

router = APIRouter(prefix="/pedidos", tags=["pedidos"])

PedidoId = Annotated[int, Path(gt=0)]


def get_pedido_service() -> PedidoService:
    return PedidoService(PedidoUnitOfWork())


Servicio = Annotated[PedidoService, Depends(get_pedido_service)]


def _a_http(error: Exception) -> HTTPException:
    """Excepción de dominio -> código HTTP."""
    if isinstance(error, PedidoNoEncontrado | ProductoNoEncontrado):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    if isinstance(error, PedidoAjeno):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    if isinstance(error, ReglaDeNegocio):
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    raise error


ERRORES = (PedidoNoEncontrado, ProductoNoEncontrado, PedidoAjeno, ReglaDeNegocio)


@router.post(
    "",
    response_model=PedidoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un pedido desde el carrito (RN-01)",
)
def crear_pedido(data: PedidoCreate, usuario: UsuarioActual, service: Servicio) -> PedidoRead:
    try:
        return service.crear(usuario.id or 0, data)
    except ERRORES as e:
        raise _a_http(e) from e


@router.get("", response_model=PedidosPaginados, summary="Pedidos propios (user) o todos (admin)")
def listar_pedidos(
    usuario: UsuarioActual,
    service: Servicio,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    estado: EstadoValido | None = None,
) -> PedidosPaginados:
    return service.listar(usuario, estado, skip, limit)


# Se declara ANTES de /{pedido_id} para que "resumen" no se interprete como id.
@router.get("/resumen", response_model=ResumenPedidos, summary="Indicadores del panel (admin)")
def resumen_pedidos(_admin: UsuarioAdmin, service: Servicio) -> ResumenPedidos:
    return service.resumen()


@router.get("/{pedido_id}", response_model=PedidoRead, summary="Detalle (dueño o admin)")
def detalle_pedido(pedido_id: PedidoId, usuario: UsuarioActual, service: Servicio) -> PedidoRead:
    try:
        return service.obtener(pedido_id, usuario)
    except ERRORES as e:
        raise _a_http(e) from e


@router.patch(
    "/{pedido_id}/estado",
    response_model=PedidoRead,
    summary="Avanzar o cancelar según la máquina de estados (admin)",
)
def cambiar_estado(
    pedido_id: PedidoId, data: CambioEstado, _admin: UsuarioAdmin, service: Servicio
) -> PedidoRead:
    try:
        return service.cambiar_estado(pedido_id, data.estado)
    except ERRORES as e:
        raise _a_http(e) from e


@router.patch(
    "/{pedido_id}/cancelar",
    response_model=PedidoRead,
    summary="Cancelar un pedido propio en PENDIENTE (dueño)",
)
def cancelar_pedido(pedido_id: PedidoId, usuario: UsuarioActual, service: Servicio) -> PedidoRead:
    try:
        return service.cancelar(pedido_id, usuario)
    except ERRORES as e:
        raise _a_http(e) from e
