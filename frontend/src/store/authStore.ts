import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '../features/auth/api/auth';
import type { Usuario } from '../features/auth/types/auth';
import { registrarAlPerderSesion } from '../shared/api/axiosInstance';
import { queryClient } from '../shared/api/queryClient';

interface AuthState {
  usuario: Usuario | null;
  cargando: boolean; // true mientras checkSession confirma la sesión
  login: (username: string, password: string) => Promise<Usuario>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  limpiarSesion: () => void;
}

// Estado del CLIENTE: la sesión. El token nunca pasa por acá: viaja en la
// cookie HttpOnly. persist + partialize guardan solo el usuario.
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: null,
      cargando: true,

      login: async (username, password) => {
        await authApi.login(username, password); // deja la cookie
        const usuario = await authApi.obtenerPerfil();
        queryClient.clear(); // no reutilizar datos cacheados de otra sesión
        set({ usuario });
        return usuario;
      },

      logout: async () => {
        try {
          await authApi.logout(); // el backend borra la cookie
        } finally {
          queryClient.clear();
          set({ usuario: null });
        }
      },

      // Se llama una vez al montar la aplicación (App.tsx). Si había un usuario
      // guardado, se confirma con GET /auth/me que la cookie siga vigente. Un
      // visitante que nunca inició sesión no tiene nada que confirmar: así no se
      // dispara un 401 en cada carga de la página.
      checkSession: async () => {
        if (get().usuario === null) {
          set({ cargando: false });
          return;
        }
        set({ cargando: true });
        try {
          set({ usuario: await authApi.obtenerPerfil() });
        } catch {
          set({ usuario: null });
        } finally {
          set({ cargando: false });
        }
      },

      limpiarSesion: () => {
        queryClient.clear();
        set({ usuario: null });
      },
    }),
    {
      name: 'foodstore-auth',
      partialize: (estado) => ({ usuario: estado.usuario }),
    },
  ),
);

// El interceptor de Axios limpia la sesión ante un 401 o una cuenta desactivada.
registrarAlPerderSesion(() => useAuthStore.getState().limpiarSesion());
