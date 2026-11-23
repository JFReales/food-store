import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  listarCategorias,
} from '../api/categorias';

const CLAVE = ['categorias'];

export const useCategorias = () => useQuery({ queryKey: CLAVE, queryFn: listarCategorias });

// Después de cada escritura se invalida el listado. Los productos muestran su
// categoría anidada, así que también se invalidan.
const useInvalidar = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: CLAVE }),
      queryClient.invalidateQueries({ queryKey: ['productos'] }),
    ]);
};

export const useCrearCategoria = () => {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: crearCategoria, onSuccess: invalidar });
};

export const useActualizarCategoria = () => {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: actualizarCategoria, onSuccess: invalidar });
};

export const useEliminarCategoria = () => {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: eliminarCategoria, onSuccess: invalidar });
};
