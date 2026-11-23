import type { ColumnDef } from '@tanstack/react-table';
import { handleApiError } from '../../../shared/api/handleApiError';
import { EstadoError } from '../../../shared/components/EstadoError';
import { Skeleton } from '../../../shared/components/Skeleton';
import { TablaDatos } from '../../../shared/components/TablaDatos';
import { Button } from '../../../shared/ui/Button';
import { useAuthStore } from '../../../store/authStore';
import { useActivarUsuario, useDesactivarUsuario, useUsuarios } from '../hooks/useUsuarios';
import type { Usuario } from '../types/usuario';

export function AdminUsuariosPage() {
  const sesion = useAuthStore((s) => s.usuario);
  const { data, isPending, isError, error, refetch } = useUsuarios();
  const activar = useActivarUsuario();
  const desactivar = useDesactivarUsuario();
  const errorAccion = activar.error ?? desactivar.error;

  const columnas: ColumnDef<Usuario>[] = [
    { accessorKey: 'username', header: 'Usuario' },
    { accessorKey: 'full_name', header: 'Nombre' },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'role',
      header: 'Rol',
      cell: ({ getValue }) => (
        <span
          className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${
            getValue<string>() === 'admin' ? 'bg-orange-100 text-orange-800' : 'bg-stone-100 text-stone-700'
          }`}
        >
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'disabled',
      header: 'Estado',
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Desactivado</span>
        ) : (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">Activo</span>
        ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      enableSorting: false,
      cell: ({ row }) => {
        const usuario = row.original;
        if (usuario.disabled) {
          return (
            <Button tamano="sm" disabled={activar.isPending} onClick={() => activar.mutate(usuario.id)}>
              Activar
            </Button>
          );
        }
        // El admin no puede desactivarse a sí mismo: el botón no se muestra en su fila.
        if (usuario.id === sesion?.id) {
          return <span className="text-xs text-stone-400">(tu usuario)</span>;
        }
        return (
          <Button
            variante="peligro"
            tamano="sm"
            disabled={desactivar.isPending}
            onClick={() => {
              if (window.confirm(`¿Desactivar a ${usuario.username}? No podrá iniciar sesión.`)) {
                desactivar.mutate(usuario.id);
              }
            }}
          >
            Desactivar
          </Button>
        );
      },
    },
  ];

  return (
    <section>
      <h1 className="mb-6 text-3xl font-bold text-stone-900">Usuarios</h1>

      {errorAccion && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {handleApiError(errorAccion)}
        </p>
      )}

      {isPending ? (
        <Skeleton className="h-64" />
      ) : isError ? (
        <EstadoError mensaje={handleApiError(error)} onReintentar={() => void refetch()} />
      ) : (
        <TablaDatos datos={data} columnas={columnas} mensajeVacio="No hay usuarios." />
      )}
    </section>
  );
}
