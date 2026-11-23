import axios from 'axios';

const CUENTA_DESACTIVADA = 'Cuenta de usuario desactivada';

// Instancia única de Axios. withCredentials: true hace que el navegador
// adjunte la cookie HttpOnly access_token en cada petición: el frontend nunca
// lee ni guarda el token.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
  withCredentials: true,
});

// El authStore registra acá qué hacer cuando la sesión se pierde. Así este
// módulo no importa el store y no se forma un import circular.
let alPerderSesion: () => void = () => {};

export const registrarAlPerderSesion = (callback: () => void): void => {
  alPerderSesion = callback;
};

// Interceptor de respuesta: ante un 401 (fuera del login y de /auth/me) o un
// 400 "Cuenta de usuario desactivada", limpia la sesión. ProtectedRoute, al
// quedar sin usuario, redirige a /login.
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      const url = error.config?.url ?? '';
      const esLoginOMe = url.includes('/auth/token') || url.includes('/auth/me');
      const datos: unknown = error.response.data;
      const detail =
        typeof datos === 'object' && datos !== null && 'detail' in datos ? datos.detail : null;

      if (
        (error.response.status === 401 && !esLoginOMe) ||
        (error.response.status === 400 && detail === CUENTA_DESACTIVADA)
      ) {
        alPerderSesion();
      }
    }
    return Promise.reject(error);
  },
);
