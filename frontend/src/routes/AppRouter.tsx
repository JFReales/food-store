import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { UnauthorizedPage } from '../features/auth/pages/UnauthorizedPage';
import { CarritoPage } from '../features/pedidos/pages/CarritoPage';
import { CheckoutPage } from '../features/pedidos/pages/CheckoutPage';
import { MisPedidosPage } from '../features/pedidos/pages/MisPedidosPage';
import { CatalogoPage } from '../features/productos/pages/CatalogoPage';
import { EstadoVacio } from '../shared/components/EstadoVacio';
import { MainLayout } from '../shared/layout/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';

// El panel de administración se descarga recién cuando un admin entra
// (code splitting): el cliente no baja TanStack Table ni esas pantallas.
const AdminResumenPage = lazy(() =>
  import('../features/pedidos/pages/AdminResumenPage').then((m) => ({ default: m.AdminResumenPage })),
);
const AdminPedidosPage = lazy(() =>
  import('../features/pedidos/pages/AdminPedidosPage').then((m) => ({ default: m.AdminPedidosPage })),
);
const AdminCategoriasPage = lazy(() =>
  import('../features/categorias/pages/AdminCategoriasPage').then((m) => ({ default: m.AdminCategoriasPage })),
);
const AdminProductosPage = lazy(() =>
  import('../features/productos/pages/AdminProductosPage').then((m) => ({ default: m.AdminProductosPage })),
);
const AdminUsuariosPage = lazy(() =>
  import('../features/usuarios/pages/AdminUsuariosPage').then((m) => ({ default: m.AdminUsuariosPage })),
);

function Cargando({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-stone-500">Cargando…</p>}>{children}</Suspense>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Públicas */}
          <Route path="/" element={<CatalogoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/carrito" element={<CarritoPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Con sesión (user o admin) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/mis-pedidos" element={<MisPedidosPage />} />
          </Route>

          {/* Solo admin */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<Navigate to="/admin/resumen" replace />} />
            <Route path="/admin/resumen" element={<Cargando><AdminResumenPage /></Cargando>} />
            <Route path="/admin/categorias" element={<Cargando><AdminCategoriasPage /></Cargando>} />
            <Route path="/admin/productos" element={<Cargando><AdminProductosPage /></Cargando>} />
            <Route path="/admin/pedidos" element={<Cargando><AdminPedidosPage /></Cargando>} />
            <Route path="/admin/usuarios" element={<Cargando><AdminUsuariosPage /></Cargando>} />
          </Route>

          <Route
            path="*"
            element={<EstadoVacio titulo="Página no encontrada" mensaje="La dirección no existe." />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
