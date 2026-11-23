"""Reglas de negocio de categorías.

Cada método abre el Unit of Work, aplica las reglas y devuelve el schema de
salida DENTRO del bloque; el commit lo hace el Unit of Work al salir.
"""

from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaNoEncontrada(Exception):
    """404 (también si está dada de baja)."""


class NombreDuplicado(Exception):
    """409"""


class CategoriaService:
    def __init__(self, uow: CategoriaUnitOfWork) -> None:
        self.uow = uow

    def listar(self) -> list[CategoriaRead]:
        with self.uow as uow:
            return [CategoriaRead.model_validate(c) for c in uow.categorias.list_activas()]

    def obtener(self, categoria_id: int) -> CategoriaRead:
        with self.uow as uow:
            return CategoriaRead.model_validate(self._buscar(uow, categoria_id))

    def crear(self, data: CategoriaCreate) -> CategoriaRead:
        with self.uow as uow:
            self._validar_nombre_libre(uow, data.nombre)
            categoria = uow.categorias.add(Categoria.model_validate(data))
            return CategoriaRead.model_validate(categoria)

    def actualizar(self, categoria_id: int, data: CategoriaUpdate) -> CategoriaRead:
        with self.uow as uow:
            categoria = self._buscar(uow, categoria_id)
            cambios = data.model_dump(exclude_unset=True)
            if cambios.get("nombre") is not None:
                self._validar_nombre_libre(uow, cambios["nombre"], excluir_id=categoria_id)
            elif "nombre" in cambios:
                cambios.pop("nombre")  # nombre: null no borra un campo obligatorio
            categoria.sqlmodel_update(cambios)
            uow.categorias.add(categoria)
            return CategoriaRead.model_validate(categoria)

    def eliminar(self, categoria_id: int) -> None:
        """Baja lógica. No oculta sus productos ni libera el nombre."""
        with self.uow as uow:
            categoria = self._buscar(uow, categoria_id)
            categoria.activo = False
            uow.categorias.add(categoria)

    # -- auxiliares -------------------------------------------------------

    @staticmethod
    def _buscar(uow: CategoriaUnitOfWork, categoria_id: int) -> Categoria:
        categoria = uow.categorias.get_activa(categoria_id)
        if categoria is None:
            raise CategoriaNoEncontrada(f"Categoría con id {categoria_id} no encontrada")
        return categoria

    @staticmethod
    def _validar_nombre_libre(
        uow: CategoriaUnitOfWork, nombre: str, excluir_id: int | None = None
    ) -> None:
        existente = uow.categorias.get_by_nombre(nombre)
        if existente is not None and existente.id != excluir_id:
            raise NombreDuplicado(f"Ya existe una categoría con el nombre '{nombre}'")
