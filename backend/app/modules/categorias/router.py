"""Endpoints de categorías: lecturas públicas, escrituras solo admin.

El Router obtiene el Service con Depends, no abre el Unit of Work y traduce
las excepciones de dominio a HTTPException.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, status

from app.core.deps import UsuarioAdmin
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.service import CategoriaNoEncontrada, CategoriaService, NombreDuplicado
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork

router = APIRouter(prefix="/categorias", tags=["categorias"])

CategoriaId = Annotated[int, Path(gt=0)]


def get_categoria_service() -> CategoriaService:
    return CategoriaService(CategoriaUnitOfWork())


Servicio = Annotated[CategoriaService, Depends(get_categoria_service)]


def _a_http(error: Exception) -> HTTPException:
    if isinstance(error, CategoriaNoEncontrada):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    if isinstance(error, NombreDuplicado):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    raise error


@router.get("", response_model=list[CategoriaRead], summary="Listar categorías activas")
def listar_categorias(service: Servicio) -> list[CategoriaRead]:
    return service.listar()


@router.get("/{categoria_id}", response_model=CategoriaRead, summary="Detalle de una categoría")
def detalle_categoria(categoria_id: CategoriaId, service: Servicio) -> CategoriaRead:
    try:
        return service.obtener(categoria_id)
    except CategoriaNoEncontrada as e:
        raise _a_http(e) from e


@router.post(
    "",
    response_model=CategoriaRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear categoría (admin)",
)
def crear_categoria(data: CategoriaCreate, _admin: UsuarioAdmin, service: Servicio) -> CategoriaRead:
    try:
        return service.crear(data)
    except NombreDuplicado as e:
        raise _a_http(e) from e


@router.put("/{categoria_id}", response_model=CategoriaRead, summary="Actualizar categoría (admin)")
def actualizar_categoria(
    categoria_id: CategoriaId, data: CategoriaUpdate, _admin: UsuarioAdmin, service: Servicio
) -> CategoriaRead:
    try:
        return service.actualizar(categoria_id, data)
    except (CategoriaNoEncontrada, NombreDuplicado) as e:
        raise _a_http(e) from e


@router.delete(
    "/{categoria_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Baja lógica de una categoría (admin)",
)
def eliminar_categoria(categoria_id: CategoriaId, _admin: UsuarioAdmin, service: Servicio) -> None:
    try:
        service.eliminar(categoria_id)
    except CategoriaNoEncontrada as e:
        raise _a_http(e) from e
