import { Link } from 'react-router-dom';
import { handleApiError } from '../../../shared/api/handleApiError';
import { EstadoError } from '../../../shared/components/EstadoError';
import { Skeleton } from '../../../shared/components/Skeleton';
import { formatearPrecio } from '../../../shared/utils/formato';
import { ResumenCard } from '../components/ResumenCard';
import { useResumenPedidos } from '../hooks/usePedidos';

export function AdminResumenPage() {
  const { data, isPending, isError, error, refetch } = useResumenPedidos();

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold text-stone-900">Resumen del negocio</h1>
        <Link to="/admin/pedidos" className="text-sm font-semibold text-orange-700 hover:underline">
          Gestionar pedidos →
        </Link>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : isError ? (
        <EstadoError mensaje={handleApiError(error)} onReintentar={() => void refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ResumenCard titulo="Pendientes" valor={String(data.pendientes)} acento="ambar" detalle="Esperan ser preparados" />
          <ResumenCard titulo="En preparación" valor={String(data.en_preparacion)} acento="cielo" />
          <ResumenCard titulo="Entregados" valor={String(data.entregados)} acento="verde" />
          <ResumenCard titulo="Cancelados" valor={String(data.cancelados)} acento="gris" />
          <ResumenCard titulo="Pedidos de hoy" valor={String(data.pedidos_hoy)} acento="naranja" />
          <ResumenCard
            titulo="Ingresos entregados"
            valor={formatearPrecio(data.ingresos_entregados)}
            acento="verde"
            detalle="Suma del total de los pedidos ENTREGADO"
          />
        </div>
      )}
    </section>
  );
}
