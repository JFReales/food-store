"""Schemas de productos."""

from typing import Annotated

from pydantic import StringConstraints
from sqlmodel import Field, SQLModel

from app.modules.categorias.schemas import CategoriaRead

NombreProducto = Annotated[
    str, StringConstraints(strip_whitespace=True), Field(min_length=2, max_length=150)
]
Descripcion = Annotated[str, StringConstraints(strip_whitespace=True), Field(max_length=1000)]
UrlImagen = Annotated[
    str, StringConstraints(strip_whitespace=True, pattern=r"^https?://\S+$"), Field(max_length=500)
]
Precio = Annotated[float, Field(ge=0)]
Stock = Annotated[int, Field(ge=0)]
IdCategoria = Annotated[int, Field(gt=0)]


class ProductoCreate(SQLModel):
    nombre: NombreProducto
    descripcion: Descripcion | None = None
    precio_base: Precio
    imagen_url: UrlImagen | None = None
    stock: Stock = 0
    disponible: bool = True
    categoria_id: IdCategoria


class ProductoUpdate(SQLModel):
    """PUT parcial: solo se actualizan los campos enviados."""

    nombre: NombreProducto | None = None
    descripcion: Descripcion | None = None
    precio_base: Precio | None = None
    imagen_url: UrlImagen | None = None
    stock: Stock | None = None
    disponible: bool | None = None
    categoria_id: IdCategoria | None = None


class ProductoStockUpdate(SQLModel):
    """PATCH /productos/{id}/stock"""

    stock: Stock | None = None
    disponible: bool | None = None


class ProductoRead(SQLModel):
    id: int
    nombre: str
    descripcion: str | None
    precio_base: float
    imagen_url: str | None
    stock: int
    disponible: bool
    categoria_id: int
    activo: bool
    categoria: CategoriaRead  # Producto.categoria anidada


class ProductosPaginados(SQLModel):
    total: int
    items: list[ProductoRead]
