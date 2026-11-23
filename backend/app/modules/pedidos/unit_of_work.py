"""Unit of Work de pedidos: repositorios de pedidos y de productos sobre la MISMA sesión.

Por eso crear un pedido, descontar el stock y crear las líneas es una sola
transacción: o se confirma todo en __exit__, o se revierte todo.
"""

from sqlmodel import Session

from app.core.unit_of_work import UnitOfWork
from app.modules.pedidos.repository import PedidoRepository
from app.modules.productos.repository import ProductoRepository


class PedidoUnitOfWork(UnitOfWork):
    pedidos: PedidoRepository
    productos: ProductoRepository

    def _crear_repositorios(self, session: Session) -> None:
        self.pedidos = PedidoRepository(session)
        self.productos = ProductoRepository(session)
