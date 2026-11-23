import { api } from '../../../shared/api/axiosInstance';
import type {
  FiltrosProductos,
  Producto,
  ProductoInput,
  ProductosPaginados,
  StockInput,
} from '../types/producto';

export const listarProductos = async (filtros: FiltrosProductos): Promise<ProductosPaginados> => {
  // Axios omite los parámetros undefined (filtros no usados).
  const { data } = await api.get<ProductosPaginados>('/productos', { params: filtros });
  return data;
};

export const crearProducto = async (datos: ProductoInput): Promise<Producto> => {
  const { data } = await api.post<Producto>('/productos', datos);
  return data;
};

export const actualizarProducto = async ({
  id,
  datos,
}: {
  id: number;
  datos: Partial<ProductoInput>;
}): Promise<Producto> => {
  const { data } = await api.put<Producto>(`/productos/${id}`, datos);
  return data;
};

export const actualizarStock = async ({
  id,
  datos,
}: {
  id: number;
  datos: StockInput;
}): Promise<Producto> => {
  const { data } = await api.patch<Producto>(`/productos/${id}/stock`, datos);
  return data;
};

export const eliminarProducto = async (id: number): Promise<void> => {
  await api.delete(`/productos/${id}`);
};
