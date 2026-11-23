import { useState } from 'react';
import { formatearPrecio } from '../../../shared/utils/formato';
import { Button } from '../../../shared/ui/Button';
import { useCartStore } from '../../../store/cartStore';
import type { Producto } from '../types/producto';

interface ProductoCardProps {
  producto: Producto;
}

export function ProductoCard({ producto }: ProductoCardProps) {
  const agregar = useCartStore((s) => s.agregar);
  const enCarrito = useCartStore(
    (s) => s.items.find((i) => i.producto_id === producto.id)?.cantidad ?? 0,
  );
  const [imagenRota, setImagenRota] = useState(false);

  const sinStock = producto.stock === 0;
  const vendible = producto.disponible && !sinStock;
  const tope = enCarrito >= producto.stock;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative flex h-40 items-center justify-center bg-orange-50 text-5xl">
        {producto.imagen_url && !imagenRota ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            loading="lazy"
            onError={() => setImagenRota(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden="true">🍽️</span>
        )}
        <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-stone-700">
          {producto.categoria.nombre}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-stone-900">{producto.nombre}</h3>
        {producto.descripcion && (
          <p className="mt-1 line-clamp-2 text-sm text-stone-600">{producto.descripcion}</p>
        )}
        <div className="mt-3 flex items-end justify-between">
          <p className="text-xl font-bold text-orange-700">{formatearPrecio(producto.precio_base)}</p>
          <p className={`text-xs ${sinStock ? 'font-semibold text-red-600' : 'text-stone-500'}`}>
            {sinStock ? 'Sin stock' : `Stock: ${producto.stock}`}
          </p>
        </div>

        <Button
          className="mt-4 w-full"
          variante={vendible ? 'primario' : 'secundario'}
          disabled={!vendible || tope}
          onClick={() => agregar(producto)}
        >
          {!producto.disponible
            ? 'No disponible'
            : sinStock
              ? 'Sin stock'
              : tope
                ? `Máximo en el carrito (${enCarrito})`
                : enCarrito > 0
                  ? `Agregar otro (${enCarrito} en el carrito)`
                  : 'Agregar al carrito'}
        </Button>
      </div>
    </article>
  );
}
