import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { handleApiError } from '../../../shared/api/handleApiError';
import { EstadoError } from '../../../shared/components/EstadoError';
import { Skeleton } from '../../../shared/components/Skeleton';
import { TablaDatos } from '../../../shared/components/TablaDatos';
import { Button } from '../../../shared/ui/Button';
import { Modal } from '../../../shared/ui/Modal';
import { formatearPrecio } from '../../../shared/utils/formato';
import { useCategorias } from '../../categorias/hooks/useCategorias';
import { ProductoForm } from '../components/ProductoForm';
import { StockForm } from '../components/StockForm';
import {
  useActualizarProducto,
  useActualizarStock,
  useCrearProducto,
  useEliminarProducto,
  useProductos,
} from '../hooks/useProductos';
import type { Producto, ProductoInput, StockInput } from '../types/producto';

type Edicion = { tipo: 'producto'; producto: Producto | null } | { tipo: 'stock'; producto: Producto };

export function AdminProductosPage() {
  // El panel pide hasta 100 productos y los pagina del lado del cliente.
  const { data, isPending, isError, error, refetch } = useProductos({ skip: 0, limit: 100 });
  const { data: categorias = [] } = useCategorias();
  const crear = useCrearProducto();
  const actualizar = useActualizarProducto();
  const actualizarStock = useActualizarStock();
  const eliminar = useEliminarProducto();

  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const cerrar = () => setEdicion(null);

  const abrir = (nueva: Edicion) => {
    crear.reset();
    actualizar.reset();
    actualizarStock.reset();
    setEdicion(nueva);
  };

  const guardarProducto = async (datos: ProductoInput) => {
    try {
      if (edicion?.tipo === 'producto' && edicion.producto) {
        await actualizar.mutateAsync({ id: edicion.producto.id, datos });
      } else {
        await crear.mutateAsync(datos);
      }
      cerrar();
    } catch {
      // El error se muestra dentro del modal.
    }
  };

  const guardarStock = async (datos: StockInput) => {
    if (edicion?.tipo !== 'stock') return;
    try {
      await actualizarStock.mutateAsync({ id: edicion.producto.id, datos });
      cerrar();
    } catch {
      // El error se muestra dentro del modal.
    }
  };

  const mutacionProducto = edicion?.tipo === 'producto' && edicion.producto ? actualizar : crear;

  const columnas: ColumnDef<Producto>[] = [
    { accessorKey: 'id', header: '#' },
    { accessorKey: 'nombre', header: 'Nombre' },
    { id: 'categoria', header: 'Categoría', accessorFn: (p) => p.categoria.nombre },
    { accessorKey: 'precio_base', header: 'Precio', cell: ({ getValue }) => formatearPrecio(getValue<number>()) },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ getValue }) => {
        const stock = getValue<number>();
        return <span className={stock === 0 ? 'font-semibold text-red-600' : ''}>{stock}</span>;
      },
    },
    {
      accessorKey: 'disponible',
      header: 'Venta',
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">Disponible</span>
        ) : (
          <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-600">Pausado</span>
        ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button variante="secundario" tamano="sm" onClick={() => abrir({ tipo: 'producto', producto: row.original })}>
            Editar
          </Button>
          <Button variante="secundario" tamano="sm" onClick={() => abrir({ tipo: 'stock', producto: row.original })}>
            Stock
          </Button>
          <Button
            variante="peligro"
            tamano="sm"
            onClick={() => {
              if (window.confirm(`¿Dar de baja "${row.original.nombre}"? Deja de verse en el catálogo.`)) {
                eliminar.mutate(row.original.id);
              }
            }}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-stone-900">Productos</h1>
        <Button onClick={() => abrir({ tipo: 'producto', producto: null })}>+ Nuevo producto</Button>
      </div>

      {eliminar.isError && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {handleApiError(eliminar.error)}
        </p>
      )}

      {isPending ? (
        <Skeleton className="h-64" />
      ) : isError ? (
        <EstadoError mensaje={handleApiError(error)} onReintentar={() => void refetch()} />
      ) : (
        <TablaDatos datos={data.items} columnas={columnas} mensajeVacio="No hay productos."
          ordenInicial={[{ id: 'id', desc: true }]} />
      )}

      <Modal
        abierto={edicion?.tipo === 'producto'}
        titulo={edicion?.tipo === 'producto' && edicion.producto ? 'Editar producto' : 'Nuevo producto'}
        onClose={cerrar}
      >
        {edicion?.tipo === 'producto' && (
          <ProductoForm
            key={edicion.producto?.id ?? 'nuevo'}
            producto={edicion.producto}
            categorias={categorias}
            enviando={mutacionProducto.isPending}
            error={mutacionProducto.isError ? handleApiError(mutacionProducto.error) : null}
            onGuardar={guardarProducto}
            onCancelar={cerrar}
          />
        )}
      </Modal>

      <Modal abierto={edicion?.tipo === 'stock'} titulo="Stock y disponibilidad" onClose={cerrar}>
        {edicion?.tipo === 'stock' && (
          <StockForm
            key={edicion.producto.id}
            producto={edicion.producto}
            enviando={actualizarStock.isPending}
            error={actualizarStock.isError ? handleApiError(actualizarStock.error) : null}
            onGuardar={guardarStock}
            onCancelar={cerrar}
          />
        )}
      </Modal>
    </section>
  );
}
