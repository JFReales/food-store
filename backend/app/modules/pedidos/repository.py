"""Consultas de pedidos."""

from collections.abc import Sequence
from datetime import datetime

from sqlalchemy.orm import selectinload
from sqlmodel import col, func, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import Pedido


class PedidoRepository(BaseRepository[Pedido]):
    model = Pedido

    def get_con_items(self, pedido_id: int) -> Pedido | None:
        return self.session.exec(
            select(Pedido)
            .where(Pedido.id == pedido_id)
            .options(selectinload(Pedido.items))  # type: ignore[arg-type]
        ).first()

    def list_by_usuario(
        self, usuario_id: int | None, estado: str | None, skip: int, limit: int
    ) -> tuple[int, Sequence[Pedido]]:
        """Pedidos de un usuario (o de todos si usuario_id es None), más recientes primero."""
        consulta = select(Pedido)
        if usuario_id is not None:
            consulta = consulta.where(Pedido.usuario_id == usuario_id)
        if estado is not None:
            consulta = consulta.where(Pedido.estado == estado)

        total = self.session.exec(select(func.count()).select_from(consulta.subquery())).one()
        items = self.session.exec(
            consulta.options(selectinload(Pedido.items))  # type: ignore[arg-type]
            .order_by(col(Pedido.created_at).desc(), col(Pedido.id).desc())
            .offset(skip)
            .limit(limit)
        ).all()
        return total, items

    def count_by_estado(self) -> dict[str, int]:
        filas = self.session.exec(
            select(Pedido.estado, func.count(col(Pedido.id))).group_by(Pedido.estado)
        ).all()
        return {estado: cantidad for estado, cantidad in filas}

    def count_desde(self, desde: datetime) -> int:
        return self.session.exec(
            select(func.count(col(Pedido.id))).where(col(Pedido.created_at) >= desde)
        ).one()

    def suma_total_por_estado(self, estado: str) -> float:
        suma = self.session.exec(
            select(func.coalesce(func.sum(Pedido.total), 0)).where(Pedido.estado == estado)
        ).one()
        return float(suma)
