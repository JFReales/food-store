import { Link, useNavigate } from 'react-router-dom';
import { EstadoVacio } from '../../../shared/components/EstadoVacio';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { formatearPrecio } from '../../../shared/utils/formato';
import { useCartStore } from '../../../store/cartStore';

export function CarritoPage() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total());
  const { quitar, cambiarCantidad, vaciar } = useCartStore();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <EstadoVacio
        titulo="Tu carrito está vacío"
        mensaje="Agregá productos desde el catálogo."
        accion={
          <Link to="/" className="font-semibold text-orange-700 hover:underline">
            Ir al catálogo →
          </Link>
        }
      />
    );
  }

  return (
    <section>
      <h1 className="mb-6 text-3xl font-bold text-stone-900">Carrito</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ul className="flex flex-col gap-3 lg:col-span-2">
          {items.map((item) => (
            <li key={item.producto_id}>
              <Card className="flex flex-wrap items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-orange-50 text-2xl">
                  {item.imagen_url ? (
                    <img src={item.imagen_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    '🍽️'
                  )}
                </div>
                <div className="min-w-40 flex-1">
                  <p className="font-semibold text-stone-900">{item.nombre}</p>
                  <p className="text-sm text-stone-500">{formatearPrecio(item.precio_unitario)} c/u</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variante="secundario"
                    tamano="sm"
                    aria-label={`Restar uno de ${item.nombre}`}
                    disabled={item.cantidad <= 1}
                    onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
                  >
                    −
                  </Button>
                  <span className="w-8 text-center font-semibold" aria-label="Cantidad">
                    {item.cantidad}
                  </span>
                  <Button
                    variante="secundario"
                    tamano="sm"
                    aria-label={`Sumar uno de ${item.nombre}`}
                    disabled={item.cantidad >= item.stock}
                    onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
                  >
                    +
                  </Button>
                </div>
                <p className="w-28 text-right font-bold text-stone-900">
                  {formatearPrecio(item.precio_unitario * item.cantidad)}
                </p>
                <Button variante="fantasma" tamano="sm" onClick={() => quitar(item.producto_id)}>
                  Quitar
                </Button>
              </Card>
            </li>
          ))}
        </ul>

        <Card className="h-fit">
          <h2 className="text-lg font-semibold text-stone-900">Resumen</h2>
          <dl className="mt-4 flex justify-between text-lg">
            <dt>Total</dt>
            <dd className="font-bold text-orange-700">{formatearPrecio(total)}</dd>
          </dl>
          <p className="mt-2 text-xs text-stone-500">
            El precio y el stock se confirman al crear el pedido.
          </p>
          <Button className="mt-5 w-full" onClick={() => navigate('/checkout')}>
            Confirmar pedido
          </Button>
          <Button variante="fantasma" className="mt-2 w-full" onClick={vaciar}>
            Vaciar carrito
          </Button>
        </Card>
      </div>
    </section>
  );
}
