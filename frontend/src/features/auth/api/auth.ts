import { api } from '../../../shared/api/axiosInstance';
import type { Mensaje, RegistroInput, Usuario } from '../types/auth';

// POST /auth/token con formulario OAuth2. El JWT queda en la cookie HttpOnly:
// la respuesta solo trae un mensaje.
export const login = async (username: string, password: string): Promise<Mensaje> => {
  const formulario = new URLSearchParams({ username, password });
  const { data } = await api.post<Mensaje>('/auth/token', formulario);
  return data;
};

export const logout = async (): Promise<Mensaje> => {
  const { data } = await api.post<Mensaje>('/auth/logout');
  return data;
};

export const obtenerPerfil = async (): Promise<Usuario> => {
  const { data } = await api.get<Usuario>('/auth/me');
  return data;
};

export const registrar = async (datos: RegistroInput): Promise<Usuario> => {
  const { data } = await api.post<Usuario>('/auth/register', datos);
  return data;
};
