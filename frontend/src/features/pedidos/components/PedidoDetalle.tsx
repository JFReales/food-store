import { formatearPrecio } from '../../../shared/utils/formato';
import type { Pedido } from '../types/pedido';

interface PedidoDetalleProps {
  pedido: Pedido;
}

// Líneas del pedido con el nombre y el precio copiados al crearlo (RN-05).
export function PedidoDetalle({ pedido }: PedidoDetalleProps) {
  return (
    <div className="text-sm">
      <table className="w-full">
        <thead className="text-left text-xs text-stone-500 uppercase">
          <tr>
            <th className="py-1 font-semibold">Producto</th>
            <th className="py-1 text-right font-semibold">Precio</th>
            <th className="py-1 text-right font-semibold">Cant.</th>
            <th className="py-1 text-right font-semibold">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {pedido.items.map((linea) => (
            <tr key={linea.producto_id}>
              <td className="py-1.5">{linea.nombre_producto}</td>
              <td className="py-1.5 text-right">{formatearPrecio(linea.precio_unitario)}</td>
              <td className="py-1.5 text-right">{linea.cantidad}</td>
              <td className="py-1.5 text-right font-medium">{formatearPrecio(linea.subtotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-stone-200">
            <td colSpan={3} className="pt-2 text-right font-semibold">
              Total
            </td>
            <td className="pt-2 text-right font-bold text-orange-700">{formatearPrecio(pedido.total)}</td>
          </tr>
        </tfoot>
      </table>
      <dl className="mt-3 grid grid-cols-1 gap-1 text-stone-600 sm:grid-cols-2">
        <div>
          <dt className="inline font-medium text-stone-700">Entrega: </dt>
          <dd className="inline">{pedido.direccion_entrega}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-stone-700">Pago: </dt>
          <dd className="inline">{pedido.forma_pago === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}</dd>
        </div>
        {pedido.notas && (
          <div className="sm:col-span-2">
            <dt className="inline font-medium text-stone-700">Notas: </dt>
            <dd className="inline">{pedido.notas}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
