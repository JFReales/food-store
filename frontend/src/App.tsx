import { useEffect } from 'react';
import { AppRouter } from './routes/AppRouter';
import { useAuthStore } from './store/authStore';

export function App() {
  const checkSession = useAuthStore((s) => s.checkSession);

  // La ÚNICA llamada al servidor dentro de un useEffect: confirmar la sesión
  // (GET /auth/me) al montar la aplicación. El resto de los datos los maneja
  // TanStack Query.
  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  return <AppRouter />;
}
