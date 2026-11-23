import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cambiarEstadoPedido,
  cancelarPedido,
  crearPedido,
  listarPedidos,
  obtenerResumen,
} from '../api/pedidos';
import type { FiltrosPedidos } from '../types/pedido';

export const usePedidos = (filtros: FiltrosPedidos) =>
  useQuery({ queryKey: ['pedidos', filtros], queryFn: () => listarPedidos(filtros) });

export const useResumenPedidos = () =>
  useQuery({ queryKey: ['pedidos', 'resumen'], queryFn: obtenerResumen });

// Un pedido cambia el stock: se invalidan los pedidos (incluido el resumen) y
// los productos.
const useInvalidarPedidosYProductos = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['pedidos'] }),
      queryClient.invalidateQueries({ queryKey: ['productos'] }),
    ]);
};

export const useCrearPedido = () => {
  const invalidar = useInvalidarPedidosYProductos();
  return useMutation({ mutationFn: crearPedido, onSuccess: invalidar });
};

export const useCambiarEstadoPedido = () => {
  const invalidar = useInvalidarPedidosYProductos();
  return useMutation({ mutationFn: cambiarEstadoPedido, onSuccess: invalidar });
};

export const useCancelarPedido = () => {
  const invalidar = useInvalidarPedidosYProductos();
  return useMutation({ mutationFn: cancelarPedido, onSuccess: invalidar });
};
