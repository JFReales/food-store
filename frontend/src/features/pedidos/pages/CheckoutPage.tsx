import { Link, useNavigate } from 'react-router-dom';
import { handleApiError } from '../../../shared/api/handleApiError';
import { EstadoVacio } from '../../../shared/components/EstadoVacio';
import { Card } from '../../../shared/ui/Card';
import { formatearPrecio } from '../../../shared/utils/formato';
import { useCartStore } from '../../../store/cartStore';
import { CheckoutForm, type DatosEntrega } from '../components/CheckoutForm';
import { useCrearPedido } from '../hooks/usePedidos';

export function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const vaciar = useCartStore((s) => s.vaciar);
  const crearPedido = useCrearPedido();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <EstadoVacio
        titulo="No hay nada para confirmar"
        mensaje="Tu carrito está vacío."
        accion={
          <Link to="/" className="font-semibold text-orange-700 hover:underline">
            Ir al catálogo →
          </Link>
        }
      />
    );
  }

  const confirmar = async (datos: DatosEntrega) => {
    try {
      const pedido = await crearPedido.mutateAsync({
        items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
        ...datos,
      });
      vaciar();
      navigate('/mis-pedidos', { state: { pedidoCreado: pedido.id } });
    } catch {
      // El mensaje lo muestra el formulario con crearPedido.error.
    }
  };

  return (
    <section>
      <h1 className="mb-6 text-3xl font-bold text-stone-900">Confirmar pedido</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <h2 className="mb-4 text-lg font-semibold text-stone-900">Entrega y pago</h2>
          <CheckoutForm
            enviando={crearPedido.isPending}
            error={crearPedido.isError ? handleApiError(crearPedido.error) : null}
            onConfirmar={confirmar}
          />
        </Card>

        <Card className="h-fit lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-stone-900">Tu pedido</h2>
          <ul className="divide-y divide-stone-100 text-sm">
            {items.map((i) => (
              <li key={i.producto_id} className="flex justify-between gap-3 py-2">
                <span>
                  {i.cantidad} × {i.nombre}
                </span>
                <span className="font-medium">{formatearPrecio(i.precio_unitario * i.cantidad)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between border-t border-stone-200 pt-3 text-lg font-bold">
            <span>Total</span>
            <span className="text-orange-700">{formatearPrecio(total)}</span>
          </p>
          <Link to="/carrito" className="mt-3 inline-block text-sm text-orange-700 hover:underline">
            ← Modificar el carrito
          </Link>
        </Card>
      </div>
    </section>
  );
}
