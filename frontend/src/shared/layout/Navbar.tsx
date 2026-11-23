import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

interface NavbarProps {
  nombreApp: string;
}

const claseEnlace = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
    isActive ? 'bg-white/15 text-white' : 'text-orange-100 hover:bg-white/10 hover:text-white'
  }`;

const ENLACES_ADMIN = [
  { a: '/admin/resumen', texto: 'Resumen' },
  { a: '/admin/pedidos', texto: 'Pedidos' },
  { a: '/admin/productos', texto: 'Productos' },
  { a: '/admin/categorias', texto: 'Categorías' },
  { a: '/admin/usuarios', texto: 'Usuarios' },
];

export function Navbar({ nombreApp }: NavbarProps) {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);
  const cantidad = useCartStore((s) => s.items.reduce((suma, i) => suma + i.cantidad, 0));
  const navigate = useNavigate();

  const cerrarSesion = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-orange-600 text-white shadow">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <NavLink to="/" className="text-xl font-extrabold tracking-tight">
          {nombreApp}
        </NavLink>

        <nav className="flex flex-wrap items-center gap-1">
          <NavLink to="/" end className={claseEnlace}>
            Catálogo
          </NavLink>
          <NavLink to="/carrito" className={claseEnlace}>
            Carrito{cantidad > 0 && <span className="ml-1 rounded-full bg-white px-1.5 text-xs font-bold text-orange-700">{cantidad}</span>}
          </NavLink>
          {usuario && (
            <NavLink to="/mis-pedidos" className={claseEnlace}>
              Mis pedidos
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          {usuario ? (
            <>
              <span className="hidden sm:inline">
                {usuario.full_name}{' '}
                <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs uppercase">{usuario.role}</span>
              </span>
              <button
                type="button"
                onClick={cerrarSesion}
                className="rounded-lg border border-white/40 px-3 py-1.5 font-semibold hover:bg-white/10"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={claseEnlace}>
                Ingresar
              </NavLink>
              <NavLink to="/register" className="rounded-lg bg-white px-3 py-1.5 font-semibold text-orange-700 hover:bg-orange-50">
                Registrarse
              </NavLink>
            </>
          )}
        </div>
      </div>

      {/* El panel solo se muestra al admin; la protección real está en el backend (require_role). */}
      {usuario?.role === 'admin' && (
        <div className="bg-orange-700">
          <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4 py-2">
            <span className="mr-2 text-xs font-bold tracking-wide text-orange-200 uppercase">Panel</span>
            {ENLACES_ADMIN.map(({ a, texto }) => (
              <NavLink key={a} to={a} className={claseEnlace}>
                {texto}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
