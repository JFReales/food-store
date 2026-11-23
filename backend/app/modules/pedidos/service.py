"""Reglas de negocio de pedidos (RN-01 a RN-06).

Todo ocurre dentro de `with self.uow as uow:`. Si se lanza cualquier
excepción, el Unit of Work hace rollback: no se persiste nada, tampoco el
descuento de stock.
"""

from datetime import UTC, datetime

from app.core.utils import ahora
from app.modules.pedidos.models import DetallePedido, EstadoPedido, Pedido
from app.modules.pedidos.schemas import (
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.service import ProductoNoEncontrado
from app.modules.usuarios.models import Usuario

# RN-02: mapa de transiciones válidas. Los estados terminales no admiten cambios.
TRANSICIONES: dict[str, set[str]] = {
    EstadoPedido.PENDIENTE: {EstadoPedido.EN_PREPARACION, EstadoPedido.CANCELADO},
    EstadoPedido.EN_PREPARACION: {EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO},
    EstadoPedido.ENTREGADO: set(),
    EstadoPedido.CANCELADO: set(),
}


# --- Excepciones de dominio (el Router las traduce a HTTP) -------------------


class PedidoNoEncontrado(Exception):
    """404"""


class PedidoAjeno(Exception):
    """403: el pedido es de otro usuario."""


class ReglaDeNegocio(Exception):
    """400: base de las reglas de negocio incumplidas."""


class ProductoRepetido(ReglaDeNegocio):
    pass


class ProductoNoDisponible(ReglaDeNegocio):
    pass


class StockInsuficiente(ReglaDeNegocio):
    pass


class TransicionInvalida(ReglaDeNegocio):
    pass


class PedidoNoCancelable(ReglaDeNegocio):
    pass


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork) -> None:
        self.uow = uow

    # RN-01 -----------------------------------------------------------------
    def crear(self, usuario_id: int, data: PedidoCreate) -> PedidoRead:
        with self.uow as uow:
            ids = [item.producto_id for item in data.items]
            if len(ids) != len(set(ids)):
                raise ProductoRepetido("Un producto no puede repetirse en el pedido")

            pedido = Pedido(
                usuario_id=usuario_id,
                estado=EstadoPedido.PENDIENTE,
                forma_pago=data.forma_pago,
                direccion_entrega=data.direccion_entrega,
                notas=data.notas,
                total=0,
            )
            uow.pedidos.add(pedido)

            total = 0.0
            for item in data.items:
                # En la misma iteración: verificar, descontar y crear la línea.
                producto = uow.productos.get_para_actualizar(item.producto_id)
                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado(f"Producto con id {item.producto_id} no encontrado")
                if not producto.disponible:
                    raise ProductoNoDisponible(f"El producto '{producto.nombre}' no está disponible")
                if producto.stock < item.cantidad:
                    raise StockInsuficiente(
                        f"Stock insuficiente para '{producto.nombre}': "
                        f"hay {producto.stock} y se pidieron {item.cantidad}"
                    )
                producto.stock -= item.cantidad
                subtotal = round(producto.precio_base * item.cantidad, 2)
                pedido.items.append(
                    DetallePedido(
                        producto_id=item.producto_id,
                        cantidad=item.cantidad,
                        nombre_producto=producto.nombre,  # copia (RN-05)
                        precio_unitario=producto.precio_base,  # copia (RN-05)
                        subtotal=subtotal,
                    )
                )
                total += subtotal

            pedido.total = round(total, 2)
            uow.session.flush()
            return PedidoRead.model_validate(pedido)

    # RN-04 -----------------------------------------------------------------
    def listar(
        self, usuario: Usuario, estado: str | None, skip: int, limit: int
    ) -> PedidosPaginados:
        """El admin ve todos; el cliente, solo los suyos."""
        with self.uow as uow:
            filtro_usuario = None if usuario.role == "admin" else usuario.id
            total, pedidos = uow.pedidos.list_by_usuario(filtro_usuario, estado, skip, limit)
            return PedidosPaginados(
                total=total, items=[PedidoRead.model_validate(p) for p in pedidos]
            )

    def obtener(self, pedido_id: int, usuario: Usuario) -> PedidoRead:
        with self.uow as uow:
            pedido = self._buscar(uow, pedido_id)
            if usuario.role != "admin" and pedido.usuario_id != usuario.id:
                raise PedidoAjeno("El pedido pertenece a otro usuario")
            return PedidoRead.model_validate(pedido)

    # RN-02 y RN-03 (admin) -------------------------------------------------
    def cambiar_estado(self, pedido_id: int, nuevo_estado: str) -> PedidoRead:
        with self.uow as uow:
            pedido = self._buscar(uow, pedido_id)
            if nuevo_estado not in TRANSICIONES[pedido.estado]:
                raise TransicionInvalida(
                    f"No se puede pasar un pedido de {pedido.estado} a {nuevo_estado}"
                )
            if nuevo_estado == EstadoPedido.CANCELADO:
                self._restituir_stock(uow, pedido)
            pedido.estado = nuevo_estado
            pedido.updated_at = ahora()
            uow.session.flush()
            return PedidoRead.model_validate(pedido)

    # RN-03 y RN-04 (cliente dueño) -----------------------------------------
    def cancelar(self, pedido_id: int, usuario: Usuario) -> PedidoRead:
        with self.uow as uow:
            pedido = self._buscar(uow, pedido_id)
            if pedido.usuario_id != usuario.id:
                raise PedidoAjeno("El pedido pertenece a otro usuario")
            if pedido.estado != EstadoPedido.PENDIENTE:
                raise PedidoNoCancelable(
                    f"Solo se puede cancelar un pedido PENDIENTE (está {pedido.estado})"
                )
            self._restituir_stock(uow, pedido)
            pedido.estado = EstadoPedido.CANCELADO
            pedido.updated_at = ahora()
            uow.session.flush()
            return PedidoRead.model_validate(pedido)

    def resumen(self) -> ResumenPedidos:
        with self.uow as uow:
            conteos = uow.pedidos.count_by_estado()
            # "Hoy" según la hora local del servidor, convertido a UTC para la consulta.
            inicio_hoy = datetime.now().astimezone().replace(hour=0, minute=0, second=0, microsecond=0)
            return ResumenPedidos(
                pendientes=conteos.get(EstadoPedido.PENDIENTE, 0),
                en_preparacion=conteos.get(EstadoPedido.EN_PREPARACION, 0),
                entregados=conteos.get(EstadoPedido.ENTREGADO, 0),
                cancelados=conteos.get(EstadoPedido.CANCELADO, 0),
                pedidos_hoy=uow.pedidos.count_desde(inicio_hoy.astimezone(UTC)),
                ingresos_entregados=round(
                    uow.pedidos.suma_total_por_estado(EstadoPedido.ENTREGADO), 2
                ),
            )

    # -- auxiliares -------------------------------------------------------

    @staticmethod
    def _buscar(uow: PedidoUnitOfWork, pedido_id: int) -> Pedido:
        pedido = uow.pedidos.get_con_items(pedido_id)
        if pedido is None:
            raise PedidoNoEncontrado(f"Pedido con id {pedido_id} no encontrado")
        return pedido

    @staticmethod
    def _restituir_stock(uow: PedidoUnitOfWork, pedido: Pedido) -> None:
        """Devuelve al stock las cantidades de cada línea, en la misma transacción."""
        for linea in pedido.items:
            producto = uow.productos.get_para_actualizar(linea.producto_id)
            if producto is not None:
                producto.stock += linea.cantidad
