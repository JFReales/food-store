"""Schemas de categorías."""

from typing import Annotated

from pydantic import StringConstraints
from sqlmodel import Field, SQLModel

NombreCategoria = Annotated[
    str, StringConstraints(strip_whitespace=True), Field(min_length=2, max_length=100)
]
Descripcion = Annotated[str, StringConstraints(strip_whitespace=True), Field(max_length=500)]


class CategoriaCreate(SQLModel):
    nombre: NombreCategoria
    descripcion: Descripcion | None = None


class CategoriaUpdate(SQLModel):
    """PUT parcial: solo se actualizan los campos enviados."""

    nombre: NombreCategoria | None = None
    descripcion: Descripcion | None = None


class CategoriaRead(SQLModel):
    id: int
    nombre: str
    descripcion: str | None
    activo: bool
