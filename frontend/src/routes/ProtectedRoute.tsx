import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Rol } from '../features/auth/types/auth';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  roles?: Rol[]; // sin roles: alcanza con tener sesión
}

// Sin sesión -> /login (recordando a dónde iba); sin el rol -> /unauthorized.
// Ocultar botones no protege nada: la protección real es require_role en el backend.
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const usuario = useAuthStore((s) => s.usuario);
  const cargando = useAuthStore((s) => s.cargando);
  const location = useLocation();

  if (cargando) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-stone-500">
        <span className="size-5 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" />
        Verificando la sesión…
      </div>
    );
  }
  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }
  if (roles && !roles.includes(usuario.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}
