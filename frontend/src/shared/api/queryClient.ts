import { QueryClient } from '@tanstack/react-query';
import { esErrorCliente } from './handleApiError';

// Instancia única de TanStack Query (caché del estado del servidor).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Un 4xx (404, 403...) no se arregla reintentando; un fallo de red sí.
      retry: (intentos, error) => !esErrorCliente(error) && intentos < 2,
      refetchOnWindowFocus: false,
    },
  },
});
