import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Button } from '../ui/Button';

interface TablaDatosProps<T> {
  datos: T[];
  columnas: ColumnDef<T>[];
  tamanoPagina?: number;
  mensajeVacio?: string;
  ordenInicial?: SortingState;
}

// Tabla genérica del panel de administración con TanStack Table:
// ordenamiento al hacer clic en el encabezado y paginación del lado del cliente.
export function TablaDatos<T>({
  datos,
  columnas,
  tamanoPagina = 10,
  mensajeVacio = 'No hay registros.',
  ordenInicial = [],
}: TablaDatosProps<T>) {
  const [orden, setOrden] = useState<SortingState>(ordenInicial);

  const tabla = useReactTable({
    data: datos,
    columns: columnas,
    state: { sorting: orden },
    onSortingChange: setOrden,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: tamanoPagina } },
  });

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-100 text-xs tracking-wide text-stone-500 uppercase">
            {tabla.getHeaderGroups().map((grupo) => (
              <tr key={grupo.id}>
                {grupo.headers.map((encabezado) => {
                  const ordenable = encabezado.column.getCanSort();
                  const sentido = encabezado.column.getIsSorted();
                  return (
                    <th key={encabezado.id} className="px-4 py-3 font-semibold whitespace-nowrap">
                      {encabezado.isPlaceholder ? null : (
                        <button
                          type="button"
                          disabled={!ordenable}
                          onClick={encabezado.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 uppercase disabled:cursor-default"
                        >
                          {flexRender(encabezado.column.columnDef.header, encabezado.getContext())}
                          {sentido === 'asc' ? '▲' : sentido === 'desc' ? '▼' : ''}
                        </button>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-stone-100">
            {tabla.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} className="px-4 py-8 text-center text-stone-500">
                  {mensajeVacio}
                </td>
              </tr>
            ) : (
              tabla.getRowModel().rows.map((fila) => (
                <tr key={fila.id} className="hover:bg-stone-50">
                  {fila.getVisibleCells().map((celda) => (
                    <td key={celda.id} className="px-4 py-3 align-middle">
                      {flexRender(celda.column.columnDef.cell, celda.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {tabla.getPageCount() > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-4 py-3 text-sm text-stone-600">
          <span>
            Página {tabla.getState().pagination.pageIndex + 1} de {tabla.getPageCount()} ·{' '}
            {datos.length} registros
          </span>
          <div className="flex gap-2">
            <Button variante="secundario" tamano="sm" disabled={!tabla.getCanPreviousPage()} onClick={() => tabla.previousPage()}>
              ← Anterior
            </Button>
            <Button variante="secundario" tamano="sm" disabled={!tabla.getCanNextPage()} onClick={() => tabla.nextPage()}>
              Siguiente →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
