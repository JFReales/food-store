import { useState } from 'react';
import { handleApiError } from '../../../shared/api/handleApiError';
import { EstadoError } from '../../../shared/components/EstadoError';
import { EstadoVacio } from '../../../shared/components/EstadoVacio';
import { Paginacion } from '../../../shared/components/Paginacion';
import { SkeletonGrilla } from '../../../shared/components/Skeleton';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { Input, Select } from '../../../shared/ui/Input';
import { useCategorias } from '../../categorias/hooks/useCategorias';
import { ProductoCard } from '../components/ProductoCard';
import { useProductos } from '../hooks/useProductos';

const POR_PAGINA = 8;

export function CatalogoPage() {
  const [pagina, setPagina] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | undefined>(undefined);
  const busquedaDemorada = useDebounce(busqueda.trim());

  // Paginación en el servidor: skip = página × limit.
  const { data, isPending, isError, error, refetch, isFetching } = useProductos({
    skip: pagina * POR_PAGINA,
    limit: POR_PAGINA,
    search: busquedaDemorada || undefined,
    categoria_id: categoriaId,
  });
  const { data: categorias } = useCategorias();

  const totalPaginas = data ? Math.ceil(data.total / POR_PAGINA) : 0;

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Catálogo</h1>
          <p className="text-sm text-stone-500">
            {data ? `${data.total} productos` : 'Cargando…'}
            {isFetching && !isPending && ' · actualizando…'}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:w-[32rem] sm:grid-cols-2">
          <Input
            label="Buscar"
            type="search"
            placeholder="Nombre del producto"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(0);
            }}
          />
          <Select
            label="Categoría"
            value={categoriaId ?? ''}
            onChange={(e) => {
              setCategoriaId(e.target.value ? Number(e.target.value) : undefined);
              setPagina(0);
            }}
          >
            <option value="">Todas</option>
            {categorias?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isPending ? (
        <SkeletonGrilla cantidad={POR_PAGINA} />
      ) : isError ? (
        <EstadoError mensaje={handleApiError(error)} onReintentar={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EstadoVacio
          titulo="No encontramos productos"
          mensaje={busquedaDemorada || categoriaId ? 'Probá con otra búsqueda o categoría.' : 'Todavía no hay productos cargados.'}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((producto) => (
              <ProductoCard key={producto.id} producto={producto} />
            ))}
          </div>
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
        </>
      )}
    </section>
  );
}
