import { useForm } from '@tanstack/react-form';
import { Button } from '../../../shared/ui/Button';
import { Input, Select, TextArea } from '../../../shared/ui/Input';
import { errorDe } from '../../../shared/utils/formulario';
import type { Categoria } from '../../categorias/types/categoria';
import type { Producto, ProductoInput } from '../types/producto';

interface ProductoFormProps {
  producto: Producto | null; // null = alta
  categorias: Categoria[];
  enviando: boolean;
  error: string | null;
  onGuardar: (datos: ProductoInput) => Promise<void>;
  onCancelar: () => void;
}

const esEnteroNoNegativo = (n: number) => Number.isInteger(n) && n >= 0;

export function ProductoForm({ producto, categorias, enviando, error, onGuardar, onCancelar }: ProductoFormProps) {
  const form = useForm({
    defaultValues: {
      nombre: producto?.nombre ?? '',
      descripcion: producto?.descripcion ?? '',
      precio_base: producto?.precio_base ?? 0,
      imagen_url: producto?.imagen_url ?? '',
      stock: producto?.stock ?? 0,
      disponible: producto?.disponible ?? true,
      categoria_id: producto?.categoria_id ?? 0,
    },
    onSubmit: async ({ value }) => {
      await onGuardar({
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim() || null,
        precio_base: value.precio_base,
        imagen_url: value.imagen_url.trim() || null,
        stock: value.stock,
        disponible: value.disponible,
        categoria_id: value.categoria_id,
      });
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
            return largo < 2 || largo > 150 ? 'Entre 2 y 150 caracteres' : undefined;
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

      <form.Field
        name="categoria_id"
        validators={{ onChange: ({ value }) => (value > 0 ? undefined : 'Elegí una categoría') }}
      >
        {(field) => (
          <Select
            label="Categoría"
            name={field.name}
            value={field.state.value}
            onChange={(e) => field.handleChange(Number(e.target.value))}
            onBlur={field.handleBlur}
            error={errorDe(field.state.meta)}
          >
            <option value={0} disabled>
              Elegí una categoría…
            </option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field
          name="precio_base"
          validators={{
            onChange: ({ value }) => (Number.isFinite(value) && value >= 0 ? undefined : 'Precio mayor o igual a 0'),
          }}
        >
          {(field) => (
            <Input
              label="Precio base"
              type="number"
              min={0}
              step="0.01"
              name={field.name}
              value={Number.isNaN(field.state.value) ? '' : field.state.value}
              onChange={(e) => field.handleChange(e.target.valueAsNumber)}
              onBlur={field.handleBlur}
              error={errorDe(field.state.meta)}
            />
          )}
        </form.Field>

        <form.Field
          name="stock"
          validators={{ onChange: ({ value }) => (esEnteroNoNegativo(value) ? undefined : 'Entero mayor o igual a 0') }}
        >
          {(field) => (
            <Input
              label="Stock"
              type="number"
              min={0}
              step="1"
              name={field.name}
              value={Number.isNaN(field.state.value) ? '' : field.state.value}
              onChange={(e) => field.handleChange(e.target.valueAsNumber)}
              onBlur={field.handleBlur}
              error={errorDe(field.state.meta)}
            />
          )}
        </form.Field>
      </div>

      <form.Field
        name="imagen_url"
        validators={{
          onChange: ({ value }) =>
            value.trim() === '' || /^https?:\/\/\S+$/.test(value.trim()) ? undefined : 'Debe empezar con http:// o https://',
        }}
      >
        {(field) => (
          <Input
            label="URL de la imagen (opcional)"
            type="url"
            name={field.name}
            placeholder="https://…"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={errorDe(field.state.meta)}
          />
        )}
      </form.Field>

      <form.Field name="disponible">
        {(field) => (
          <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
              className="size-4 accent-orange-600"
            />
            Disponible para la venta
          </label>
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
