import type { EstadoPedido } from '../../features/pedidos/types/pedido';

interface BadgeEstadoProps {
  estado: EstadoPedido;
}

const ESTILOS: Record<EstadoPedido, { texto: string; clase: string }> = {
  PENDIENTE: { texto: 'Pendiente', clase: 'bg-amber-100 text-amber-800' },
  EN_PREPARACION: { texto: 'En preparación', clase: 'bg-sky-100 text-sky-800' },
  ENTREGADO: { texto: 'Entregado', clase: 'bg-green-100 text-green-800' },
  CANCELADO: { texto: 'Cancelado', clase: 'bg-stone-200 text-stone-600' },
};

export function BadgeEstado({ estado }: BadgeEstadoProps) {
  const { texto, clase } = ESTILOS[estado];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${clase}`}>{texto}</span>;
}
