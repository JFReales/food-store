import { useForm } from '@tanstack/react-form';
import { Button } from '../../../shared/ui/Button';
import { Input, TextArea } from '../../../shared/ui/Input';
import { errorDe } from '../../../shared/utils/formulario';
import type { Categoria, CategoriaInput } from '../types/categoria';

interface CategoriaFormProps {
  categoria: Categoria | null; // null = alta
  enviando: boolean;
  error: string | null;
  onGuardar: (datos: CategoriaInput) => Promise<void>;
  onCancelar: () => void;
}

export function CategoriaForm({ categoria, enviando, error, onGuardar, onCancelar }: CategoriaFormProps) {
  const form = useForm({
    defaultValues: { nombre: categoria?.nombre ?? '', descripcion: categoria?.descripcion ?? '' },
    onSubmit: async ({ value }) => {
      await onGuardar({ nombre: value.nombre.trim(), descripcion: value.descripcion.trim() || null });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
      className="flex flex-col gap-4"
      noValidate
    >
      <form.Field
        name="nombre"
        validators={{
          onChange: ({ value }) => {
            const largo = value.trim().length;
            return largo < 2 || largo > 100 ? 'Entre 2 y 100 caracteres' : undefined;
          },
        }}
      >
        {(field) => (
          <Input
            label="Nombre"
            name={field.name}
            autoFocus
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={errorDe(field.state.meta)}
          />
        )}
      </form.Field>

      <form.Field name="descripcion">
        {(field) => (
          <TextArea
            label="Descripción (opcional)"
            name={field.name}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button variante="secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
        <form.Subscribe selector={(s) => s.canSubmit}>
          {(puedeEnviar) => (
            <Button type="submit" disabled={!puedeEnviar} cargando={enviando}>
              Guardar
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
