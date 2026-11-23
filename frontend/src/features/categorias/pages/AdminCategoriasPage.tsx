import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { handleApiError } from '../../../shared/api/handleApiError';
import { EstadoError } from '../../../shared/components/EstadoError';
import { Skeleton } from '../../../shared/components/Skeleton';
import { TablaDatos } from '../../../shared/components/TablaDatos';
import { Button } from '../../../shared/ui/Button';
import { Modal } from '../../../shared/ui/Modal';
import { CategoriaForm } from '../components/CategoriaForm';
import {
  useActualizarCategoria,
  useCategorias,
  useCrearCategoria,
  useEliminarCategoria,
} from '../hooks/useCategorias';
import type { Categoria, CategoriaInput } from '../types/categoria';

export function AdminCategoriasPage() {
  const { data, isPending, isError, error, refetch } = useCategorias();
  const crear = useCrearCategoria();
  const actualizar = useActualizarCategoria();
  const eliminar = useEliminarCategoria();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [seleccionada, setSeleccionada] = useState<Categoria | null>(null);
  const mutacion = seleccionada ? actualizar : crear;

  const abrir = (categoria: Categoria | null) => {
    crear.reset();
    actualizar.reset();
    setSeleccionada(categoria);
    setModalAbierto(true);
  };

  const guardar = async (datos: CategoriaInput) => {
    try {
      if (seleccionada) await actualizar.mutateAsync({ id: seleccionada.id, datos });
      else await crear.mutateAsync(datos);
      setModalAbierto(false);
    } catch {
      // El error (p. ej. 409 nombre repetido) se muestra dentro del modal.
    }
  };

  const columnas: ColumnDef<Categoria>[] = [
      { accessorKey: 'id', header: '#' },
      { accessorKey: 'nombre', header: 'Nombre' },
      {
        accessorKey: 'descripcion',
        header: 'Descripción',
        cell: ({ getValue }) => getValue<string | null>() ?? <em className="text-stone-400">—</em>,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variante="secundario" tamano="sm" onClick={() => abrir(row.original)}>
              Editar
            </Button>
            <Button
              variante="peligro"
              tamano="sm"
              onClick={() => {
                if (window.confirm(`¿Dar de baja la categoría "${row.original.nombre}"? Sus productos siguen en el catálogo.`)) {
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
        <h1 className="text-3xl font-bold text-stone-900">Categorías</h1>
        <Button onClick={() => abrir(null)}>+ Nueva categoría</Button>
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
        <TablaDatos datos={data} columnas={columnas} mensajeVacio="No hay categorías."
          ordenInicial={[{ id: 'id', desc: true }]} />
      )}

      <Modal
        abierto={modalAbierto}
        titulo={seleccionada ? 'Editar categoría' : 'Nueva categoría'}
        onClose={() => setModalAbierto(false)}
      >
        <CategoriaForm
          key={seleccionada?.id ?? 'nueva'}
          categoria={seleccionada}
          enviando={mutacion.isPending}
          error={mutacion.isError ? handleApiError(mutacion.error) : null}
          onGuardar={guardar}
          onCancelar={() => setModalAbierto(false)}
        />
      </Modal>
    </section>
  );
}
