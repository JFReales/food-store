"""Modelo de tabla Categoria."""

from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.modules.productos.models import Producto


class Categoria(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    # Único aun dado de baja: la baja lógica no libera el nombre.
    nombre: str = Field(max_length=100, unique=True, index=True)
    descripcion: str | None = None
    activo: bool = True  # baja lógica

    # Categoria 1:N Producto
    productos: list["Producto"] = Relationship(back_populates="categoria")
