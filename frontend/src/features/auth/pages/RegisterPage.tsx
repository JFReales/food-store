import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { handleApiError } from '../../../shared/api/handleApiError';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';
import { Input } from '../../../shared/ui/Input';
import { errorDe } from '../../../shared/utils/formulario';
import { useAuthStore } from '../../../store/authStore';
import { registrar } from '../api/auth';

export function RegisterPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { username: '', full_name: '', email: '', password: '', confirmacion: '' },
    onSubmit: async ({ value }) => {
      setErrorServidor(null);
      try {
        await registrar({
          username: value.username.trim(),
          full_name: value.full_name.trim(),
          email: value.email.trim(),
          password: value.password,
        });
        // Registro exitoso: se inicia sesión directamente.
        await login(value.username.trim(), value.password);
        navigate('/', { replace: true });
      } catch (error) {
        setErrorServidor(handleApiError(error)); // 409 usuario o email repetido
      }
    },
  });

  return (
    <div className="mx-auto max-w-md">
      <Card className="p-8">
        <h1 className="mb-1 text-2xl font-bold text-stone-900">Crear cuenta</h1>
        <p className="mb-6 text-sm text-stone-500">Registrate para comprar en Food Store.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="flex flex-col gap-4"
          noValidate
        >
          <form.Field
            name="username"
            validators={{
              onChange: ({ value }) =>
                value.trim().length < 3
                  ? 'Mínimo 3 caracteres'
                  : !/^[A-Za-z0-9_.-]+$/.test(value.trim())
                    ? 'Solo letras, números, punto, guion y guion bajo'
                    : undefined,
            }}
          >
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

          <form.Field
            name="full_name"
            validators={{
              onChange: ({ value }) => (value.trim().length < 2 ? 'Ingresá tu nombre completo' : undefined),
            }}
          >
            {(field) => (
              <Input
                label="Nombre completo"
                name={field.name}
                autoComplete="name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={errorDe(field.state.meta)}
              />
            )}
          </form.Field>

          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : 'Email inválido',
            }}
          >
            {(field) => (
              <Input
                label="Email"
                type="email"
                name={field.name}
                autoComplete="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={errorDe(field.state.meta)}
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => (value.length < 8 ? 'Mínimo 8 caracteres' : undefined),
            }}
          >
            {(field) => (
              <Input
                label="Contraseña"
                type="password"
                name={field.name}
                autoComplete="new-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={errorDe(field.state.meta)}
              />
            )}
          </form.Field>

          <form.Field
            name="confirmacion"
            validators={{
              onChangeListenTo: ['password'],
              onChange: ({ value, fieldApi }) =>
                value !== fieldApi.form.getFieldValue('password') ? 'Las contraseñas no coinciden' : undefined,
            }}
          >
            {(field) => (
              <Input
                label="Repetir contraseña"
                type="password"
                name={field.name}
                autoComplete="new-password"
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
                Crear cuenta
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-semibold text-orange-700 hover:underline">
            Ingresá
          </Link>
        </p>
      </Card>
    </div>
  );
}
