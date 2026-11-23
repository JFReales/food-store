import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { activarUsuario, desactivarUsuario, listarUsuarios } from '../api/usuarios';

const CLAVE = ['usuarios'];

export const useUsuarios = () => useQuery({ queryKey: CLAVE, queryFn: listarUsuarios });

const useInvalidarUsuarios = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CLAVE });
};

export const useActivarUsuario = () => {
  const invalidar = useInvalidarUsuarios();
  return useMutation({ mutationFn: activarUsuario, onSuccess: invalidar });
};

export const useDesactivarUsuario = () => {
  const invalidar = useInvalidarUsuarios();
  return useMutation({ mutationFn: desactivarUsuario, onSuccess: invalidar });
};
