import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Producto } from '../features/productos/types/producto';

export interface ItemCarrito {
  producto_id: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  stock: number; // tope para no pedir más de lo que hay (el backend igual valida)
  imagen_url: string | null;
}

interface CartState {
  items: ItemCarrito[];
  agregar: (producto: Producto, cantidad?: number) => void;
  quitar: (productoId: number) => void;
  cambiarCantidad: (productoId: number, cantidad: number) => void;
  vaciar: () => void;
  total: () => number;
  cantidadItems: () => number;
}

const limitar = (cantidad: number, stock: number): number =>
  Math.max(1, Math.min(cantidad, Math.max(stock, 1)));

// Estado del CLIENTE: el carrito, persistido en el navegador (sobrevive a la recarga).
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      agregar: (producto, cantidad = 1) =>
        set((estado) => {
          const existente = estado.items.find((i) => i.producto_id === producto.id);
          if (existente) {
            return {
              items: estado.items.map((i) =>
                i.producto_id === producto.id
                  ? { ...i, stock: producto.stock, cantidad: limitar(i.cantidad + cantidad, producto.stock) }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...estado.items,
              {
                producto_id: producto.id,
                nombre: producto.nombre,
                precio_unitario: producto.precio_base,
                cantidad: limitar(cantidad, producto.stock),
                stock: producto.stock,
                imagen_url: producto.imagen_url,
              },
            ],
          };
        }),

      quitar: (productoId) =>
        set((estado) => ({ items: estado.items.filter((i) => i.producto_id !== productoId) })),

      cambiarCantidad: (productoId, cantidad) =>
        set((estado) => ({
          items: estado.items.map((i) =>
            i.producto_id === productoId ? { ...i, cantidad: limitar(cantidad, i.stock) } : i,
          ),
        })),

      vaciar: () => set({ items: [] }),

      total: () =>
        Math.round(get().items.reduce((suma, i) => suma + i.precio_unitario * i.cantidad, 0) * 100) /
        100,

      cantidadItems: () => get().items.reduce((suma, i) => suma + i.cantidad, 0),
    }),
    { name: 'foodstore-carrito', partialize: (estado) => ({ items: estado.items }) },
  ),
);
