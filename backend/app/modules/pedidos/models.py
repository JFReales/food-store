"""Modelos de tabla Pedido y DetallePedido."""

from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from app.core.utils import ahora

if TYPE_CHECKING:
    from app.modules.productos.models import Producto
    from app.modules.usuarios.models import Usuario


class EstadoPedido(StrEnum):
    PENDIENTE = "PENDIENTE"
    EN_PREPARACION = "EN_PREPARACION"
    ENTREGADO = "ENTREGADO"
    CANCELADO = "CANCELADO"


class FormaPago(StrEnum):
    EFECTIVO = "EFECTIVO"
    TRANSFERENCIA = "TRANSFERENCIA"


class Pedido(SQLModel, table=True):
    """Un pedido no se borra: se cancela. total queda fijo desde la creación (RN-05)."""

    id: int | None = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    estado: str = Field(default=EstadoPedido.PENDIENTE, max_length=20, index=True)
    forma_pago: str = Field(max_length=20)
    direccion_entrega: str = Field(max_length=200)
    notas: str | None = None
    total: float = 0
    created_at: datetime = Field(default_factory=ahora)
    updated_at: datetime = Field(default_factory=ahora)

    # Usuario 1:N Pedido
    usuario: "Usuario" = Relationship(back_populates="pedidos")
    # Pedido 1:N DetallePedido (composición: las líneas pertenecen al pedido)
    items: list["DetallePedido"] = Relationship(back_populates="pedido")


class DetallePedido(SQLModel, table=True):
    """Línea inmutable: copia el nombre y el precio del producto al crearse."""

    id: int | None = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id", index=True)
    producto_id: int = Field(foreign_key="producto.id", index=True)
    cantidad: int = Field(ge=1)
    nombre_producto: str = Field(max_length=150)
    precio_unitario: float
    subtotal: float

    pedido: Pedido = Relationship(back_populates="items")
    # Producto 1:N DetallePedido
    producto: "Producto" = Relationship(back_populates="detalles")
