import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { handleApiError } from '../../../shared/api/handleApiError';
import { EstadoError } from '../../../shared/components/EstadoError';
import { Skeleton } from '../../../shared/components/Skeleton';
import { TablaDatos } from '../../../shared/components/TablaDatos';
import { BadgeEstado } from '../../../shared/ui/BadgeEstado';
import { Button } from '../../../shared/ui/Button';
import { Select } from '../../../shared/ui/Input';
import { Modal } from '../../../shared/ui/Modal';
import { formatearFecha, formatearPrecio } from '../../../shared/utils/formato';
import { PedidoDetalle } from '../components/PedidoDetalle';
import { useCambiarEstadoPedido, usePedidos } from '../hooks/usePedidos';
import { ESTADOS, TRANSICIONES, type EstadoPedido, type Pedido } from '../types/pedido';

const ACCION: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'Preparar',
  ENTREGADO: 'Entregar',
  CANCELADO: 'Cancelar',
};

export function AdminPedidosPage() {
  const [estado, setEstado] = useState<EstadoPedido | undefined>(undefined);
  const [detalle, setDetalle] = useState<Pedido | null>(null);
  // El panel pide hasta 100 pedidos y los pagina del lado del cliente.
  const { data, isPending, isError, error, refetch } = usePedidos({ skip: 0, limit: 100, estado });
  const cambiarEstado = useCambiarEstadoPedido();

  const columnas = useMemo<ColumnDef<Pedido>[]>(() => {
    const avanzar = (pedido: Pedido, destino: EstadoPedido) => {
      if (destino === 'CANCELADO' && !window.confirm(`¿Cancelar el pedido #${pedido.id}? Se restituye el stock.`)) {
        return;
      }
      cambiarEstado.mutate({ id: pedido.id, estado: destino });
    };
    return [
      { accessorKey: 'id', header: '#' },
      { accessorKey: 'created_at', header: 'Fecha', cell: ({ getValue }) => formatearFecha(getValue<string>()) },
      { accessorKey: 'usuario_id', header: 'Cliente', cell: ({ getValue }) => `Usuario ${getValue<number>()}` },
      { accessorKey: 'estado', header: 'Estado', cell: ({ row }) => <BadgeEstado estado={row.original.estado} /> },
      { accessorKey: 'forma_pago', header: 'Pago' },
      { accessorKey: 'total', header: 'Total', cell: ({ getValue }) => formatearPrecio(getValue<number>()) },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const pedido = row.original;
          return (
            <div className="flex flex-wrap gap-2">
              <Button variante="secundario" tamano="sm" onClick={() => setDetalle(pedido)}>
                Ver
              </Button>
              {/* Solo los botones que permite la máquina de estados. */}
              {TRANSICIONES[pedido.estado].map((destino) => (
                <Button
                  key={destino}
                  tamano="sm"
                  variante={destino === 'CANCELADO' ? 'peligro' : 'primario'}
                  disabled={cambiarEstado.isPending}
                  onClick={() => avanzar(pedido, destino)}
                >
                  {ACCION[destino]}
                </Button>
              ))}
            </div>
          );
        },
      },
    ];
  }, [cambiarEstado]);

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold text-stone-900">Pedidos</h1>
        <div className="w-56">
          <Select
            label="Filtrar por estado"
            value={estado ?? ''}
            onChange={(e) => setEstado(ESTADOS.find((x) => x === e.target.value))}
          >
            <option value="">Todos</option>
            {ESTADOS.map((x) => (
              <option key={x} value={x}>
                {x.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {cambiarEstado.isError && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {handleApiError(cambiarEstado.error)}
        </p>
      )}

      {isPending ? (
        <Skeleton className="h-64" />
      ) : isError ? (
        <EstadoError mensaje={handleApiError(error)} onReintentar={() => void refetch()} />
      ) : (
        <TablaDatos datos={data.items} columnas={columnas} mensajeVacio="No hay pedidos con ese filtro." />
      )}

      <Modal abierto={detalle !== null} titulo={detalle ? `Pedido #${detalle.id}` : ''} onClose={() => setDetalle(null)}>
        {detalle && (
          <>
            <div className="mb-3 flex items-center gap-3 text-sm text-stone-600">
              <BadgeEstado estado={detalle.estado} />
              <span>{formatearFecha(detalle.created_at)}</span>
              <span>· Usuario {detalle.usuario_id}</span>
            </div>
            <PedidoDetalle pedido={detalle} />
          </>
        )}
      </Modal>
    </section>
  );
}
