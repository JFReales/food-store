"""Schemas de pedidos."""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import StringConstraints
from sqlmodel import Field, SQLModel

# RN-06: valores permitidos y largo de la dirección, validados en el schema.
FormaPagoValida = Literal["EFECTIVO", "TRANSFERENCIA"]
EstadoValido = Literal["PENDIENTE", "EN_PREPARACION", "ENTREGADO", "CANCELADO"]
Direccion = Annotated[
    str, StringConstraints(strip_whitespace=True), Field(min_length=5, max_length=200)
]
Notas = Annotated[str, StringConstraints(strip_whitespace=True), Field(max_length=500)]


class ItemPedidoCreate(SQLModel):
    producto_id: Annotated[int, Field(gt=0)]
    cantidad: Annotated[int, Field(ge=1)]


class PedidoCreate(SQLModel):
    items: Annotated[list[ItemPedidoCreate], Field(min_length=1)]
    forma_pago: FormaPagoValida
    direccion_entrega: Direccion
    notas: Notas | None = None


class DetallePedidoRead(SQLModel):
    producto_id: int
    nombre_producto: str
    precio_unitario: float
    cantidad: int
    subtotal: float


class PedidoRead(SQLModel):
    id: int
    usuario_id: int
    estado: str
    forma_pago: str
    direccion_entrega: str
    notas: str | None
    total: float
    created_at: datetime
    updated_at: datetime
    items: list[DetallePedidoRead]


class PedidosPaginados(SQLModel):
    total: int
    items: list[PedidoRead]


class CambioEstado(SQLModel):
    estado: EstadoValido


class ResumenPedidos(SQLModel):
    pendientes: int
    en_preparacion: int
    entregados: int
    cancelados: int
    pedidos_hoy: int
    ingresos_entregados: float
