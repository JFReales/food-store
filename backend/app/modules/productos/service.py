"""Reglas de negocio de productos."""

from app.modules.categorias.service import CategoriaNoEncontrada
from app.modules.productos.models import Producto
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork


class ProductoNoEncontrado(Exception):
    """404 (también si está dado de baja)."""


class ProductoService:
    def __init__(self, uow: ProductoUnitOfWork) -> None:
        self.uow = uow

    def listar(
        self,
        skip: int,
        limit: int,
        search: str | None,
        categoria_id: int | None,
        disponible: bool | None,
    ) -> ProductosPaginados:
        with self.uow as uow:
            total, items = uow.productos.search(skip, limit, search, categoria_id, disponible)
            return ProductosPaginados(
                total=total, items=[ProductoRead.model_validate(p) for p in items]
            )

    def obtener(self, producto_id: int) -> ProductoRead:
        with self.uow as uow:
            return ProductoRead.model_validate(self._buscar(uow, producto_id))

    def crear(self, data: ProductoCreate) -> ProductoRead:
        with self.uow as uow:
            self._validar_categoria(uow, data.categoria_id)
            producto = uow.productos.add(Producto.model_validate(data))
            return ProductoRead.model_validate(producto)

    def actualizar(self, producto_id: int, data: ProductoUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._buscar(uow, producto_id)
            # Solo los campos enviados; un null explícito no borra obligatorios.
            cambios = {k: v for k, v in data.model_dump(exclude_unset=True).items()
                       if v is not None or k in ("descripcion", "imagen_url")}
            if "categoria_id" in cambios:
                self._validar_categoria(uow, cambios["categoria_id"])
            producto.sqlmodel_update(cambios)
            uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def actualizar_stock(self, producto_id: int, data: ProductoStockUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._buscar(uow, producto_id)
            producto.sqlmodel_update(data.model_dump(exclude_unset=True, exclude_none=True))
            uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def eliminar(self, producto_id: int) -> None:
        """Baja lógica: el producto queda en los pedidos ya hechos."""
        with self.uow as uow:
            producto = self._buscar(uow, producto_id)
            producto.activo = False
            uow.productos.add(producto)

    # -- auxiliares -------------------------------------------------------

    @staticmethod
    def _buscar(uow: ProductoUnitOfWork, producto_id: int) -> Producto:
        producto = uow.productos.get_activo(producto_id)
        if producto is None:
            raise ProductoNoEncontrado(f"Producto con id {producto_id} no encontrado")
        return producto

    @staticmethod
    def _validar_categoria(uow: ProductoUnitOfWork, categoria_id: int) -> None:
        if uow.categorias.get_activa(categoria_id) is None:
            raise CategoriaNoEncontrada(
                f"Categoría con id {categoria_id} no encontrada o dada de baja"
            )
