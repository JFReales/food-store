import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { handleApiError } from '../../../shared/api/handleApiError';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { Input } from '../../../shared/ui/Input';
import { errorDe } from '../../../shared/utils/formulario';
import { useAuthStore } from '../../../store/authStore';

const requerido = (etiqueta: string) => ({ value }: { value: string }) =>
  value.trim() === '' ? `${etiqueta} es obligatorio` : undefined;

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const desde = (location.state as { desde?: string } | null)?.desde;
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { username: '', password: '' },
    onSubmit: async ({ value }) => {
      setErrorServidor(null);
      try {
        const usuario = await login(value.username.trim(), value.password);
        navigate(desde ?? (usuario.role === 'admin' ? '/admin/resumen' : '/'), { replace: true });
      } catch (error) {
        setErrorServidor(handleApiError(error)); // 401 credenciales, 400 cuenta desactivada
      }
    },
  });

  return (
    <div className="mx-auto max-w-md">
      <Card className="p-8">
        <h1 className="mb-1 text-2xl font-bold text-stone-900">Ingresar</h1>
        <p className="mb-6 text-sm text-stone-500">Accedé con tu usuario para hacer pedidos.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="flex flex-col gap-4"
          noValidate
        >
          <form.Field name="username" validators={{ onChange: requerido('El usuario') }}>
            {(field) => (
              <Input
                label="Usuario"
                name={field.name}
                autoComplete="username"
                autoFocus
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={errorDe(field.state.meta)}
              />
            )}
          </form.Field>

          <form.Field name="password" validators={{ onChange: requerido('La contraseña') }}>
            {(field) => (
              <Input
                label="Contraseña"
                type="password"
                name={field.name}
                autoComplete="current-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={errorDe(field.state.meta)}
              />
            )}
          </form.Field>

          {errorServidor && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorServidor}
            </p>
          )}

          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([puedeEnviar, enviando]) => (
              <Button type="submit" disabled={!puedeEnviar} cargando={enviando} className="mt-2 w-full">
                Ingresar
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="font-semibold text-orange-700 hover:underline">
            Registrate
          </Link>
        </p>
      </Card>
    </div>
  );
}
