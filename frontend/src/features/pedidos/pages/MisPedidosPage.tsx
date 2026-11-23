import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { handleApiError } from '../../../shared/api/handleApiError';
import { EstadoError } from '../../../shared/components/EstadoError';
import { EstadoVacio } from '../../../shared/components/EstadoVacio';
import { Paginacion } from '../../../shared/components/Paginacion';
import { Skeleton } from '../../../shared/components/Skeleton';
import { BadgeEstado } from '../../../shared/ui/BadgeEstado';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { Select } from '../../../shared/ui/Input';
import { formatearFecha, formatearPrecio } from '../../../shared/utils/formato';
import { PedidoDetalle } from '../components/PedidoDetalle';
import { useCancelarPedido, usePedidos } from '../hooks/usePedidos';
import { ESTADOS, type EstadoPedido } from '../types/pedido';

const POR_PAGINA = 5;

export function MisPedidosPage() {
  const location = useLocation();
  const pedidoCreado = (location.state as { pedidoCreado?: number } | null)?.pedidoCreado;

  const [pagina, setPagina] = useState(0);
  const [estado, setEstado] = useState<EstadoPedido | undefined>(undefined);
  const [abierto, setAbierto] = useState<number | null>(pedidoCreado ?? null);

  const { data, isPending, isError, error, refetch } = usePedidos({
    skip: pagina * POR_PAGINA,
    limit: POR_PAGINA,
    estado,
  });
  const cancelar = useCancelarPedido();

  const handleCancelar = (id: number) => {
    if (window.confirm(`¿Cancelar el pedido #${id}? El stock se devuelve al catálogo.`)) {
      cancelar.mutate(id);
    }
  };

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold text-stone-900">Mis pedidos</h1>
        <div className="w-56">
          <Select
            label="Estado"
            value={estado ?? ''}
            onChange={(e) => {
              setEstado(ESTADOS.find((x) => x === e.target.value));
              setPagina(0);
            }}
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

      {pedidoCreado && (
        <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          ¡Pedido #{pedidoCreado} creado! Lo podés cancelar mientras esté pendiente.
        </p>
      )}
      {cancelar.isError && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {handleApiError(cancelar.error)}
        </p>
      )}

      {isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : isError ? (
        <EstadoError mensaje={handleApiError(error)} onReintentar={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EstadoVacio titulo="No tenés pedidos" mensaje={estado ? 'No hay pedidos en ese estado.' : 'Cuando confirmes un pedido va a aparecer acá.'} />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {data.items.map((pedido) => (
              <li key={pedido.id}>
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-900">
                        Pedido #{pedido.id}{' '}
                        <span className="text-sm font-normal text-stone-500">· {formatearFecha(pedido.created_at)}</span>
                      </p>
                      <p className="text-sm text-stone-500">
                        {pedido.items.length} {pedido.items.length === 1 ? 'producto' : 'productos'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <BadgeEstado estado={pedido.estado} />
                      <span className="text-lg font-bold text-stone-900">{formatearPrecio(pedido.total)}</span>
                      <Button
                        variante="secundario"
                        tamano="sm"
                        onClick={() => setAbierto(abierto === pedido.id ? null : pedido.id)}
                      >
                        {abierto === pedido.id ? 'Ocultar detalle' : 'Ver detalle'}
                      </Button>
                      {pedido.estado === 'PENDIENTE' && (
                        <Button
                          variante="peligro"
                          tamano="sm"
                          cargando={cancelar.isPending && cancelar.variables === pedido.id}
                          onClick={() => handleCancelar(pedido.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                  {abierto === pedido.id && (
                    <div className="mt-4 border-t border-stone-100 pt-4">
                      <PedidoDetalle pedido={pedido} />
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
          <Paginacion pagina={pagina} totalPaginas={Math.ceil(data.total / POR_PAGINA)} onCambiar={setPagina} />
        </>
      )}
    </section>
  );
}
