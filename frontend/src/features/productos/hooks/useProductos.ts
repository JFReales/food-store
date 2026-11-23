import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  actualizarProducto,
  actualizarStock,
  crearProducto,
  eliminarProducto,
  listarProductos,
} from '../api/productos';
import type { FiltrosProductos } from '../types/producto';

// Cada combinación de filtros (página, búsqueda, categoría) se cachea por separado.
export const useProductos = (filtros: FiltrosProductos) =>
  useQuery({
    queryKey: ['productos', filtros],
    queryFn: () => listarProductos(filtros),
    // Mientras llega la página nueva se sigue mostrando la anterior.
    placeholderData: keepPreviousData,
  });

const useInvalidarProductos = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['productos'] });
};

export const useCrearProducto = () => {
  const invalidar = useInvalidarProductos();
  return useMutation({ mutationFn: crearProducto, onSuccess: invalidar });
};

export const useActualizarProducto = () => {
  const invalidar = useInvalidarProductos();
  return useMutation({ mutationFn: actualizarProducto, onSuccess: invalidar });
};

export const useActualizarStock = () => {
  const invalidar = useInvalidarProductos();
  return useMutation({ mutationFn: actualizarStock, onSuccess: invalidar });
};

export const useEliminarProducto = () => {
  const invalidar = useInvalidarProductos();
  return useMutation({ mutationFn: eliminarProducto, onSuccess: invalidar });
};
