"""Consultas de productos."""

from collections.abc import Sequence

from sqlalchemy.orm import selectinload
from sqlmodel import col, func, select

from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    model = Producto

    def get_activo(self, producto_id: int) -> Producto | None:
        """Un producto dado de baja se trata como inexistente."""
        producto = self.get_by_id(producto_id)
        return producto if producto is not None and producto.activo else None

    def get_para_actualizar(self, producto_id: int) -> Producto | None:
        """Lee el producto bloqueando su fila (SELECT ... FOR UPDATE).

        Dos pedidos simultáneos del mismo producto no pueden descontar el mismo
        stock: el segundo espera a que termine la transacción del primero.
        (SQLite ignora FOR UPDATE.)
        """
        return self.session.exec(
            select(Producto).where(Producto.id == producto_id).with_for_update()
        ).first()

    def search(
        self,
        skip: int,
        limit: int,
        search: str | None = None,
        categoria_id: int | None = None,
        disponible: bool | None = None,
    ) -> tuple[int, Sequence[Producto]]:
        """Productos ACTIVOS con filtros dinámicos y paginación: (total, página)."""
        consulta = select(Producto).where(col(Producto.activo).is_(True))
        if search:
            consulta = consulta.where(col(Producto.nombre).ilike(f"%{search.strip()}%"))
        if categoria_id is not None:
            consulta = consulta.where(Producto.categoria_id == categoria_id)
        if disponible is not None:
            consulta = consulta.where(col(Producto.disponible).is_(disponible))

        total = self.session.exec(select(func.count()).select_from(consulta.subquery())).one()
        items = self.session.exec(
            consulta.options(selectinload(Producto.categoria))  # type: ignore[arg-type]
            .order_by(col(Producto.id))
            .offset(skip)
            .limit(limit)
        ).all()
        return total, items
