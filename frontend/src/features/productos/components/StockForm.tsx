import { useForm } from '@tanstack/react-form';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { errorDe } from '../../../shared/utils/formulario';
import type { Producto, StockInput } from '../types/producto';

interface StockFormProps {
  producto: Producto;
  enviando: boolean;
  error: string | null;
  onGuardar: (datos: StockInput) => Promise<void>;
  onCancelar: () => void;
}

// PATCH /productos/{id}/stock: stock y disponibilidad.
export function StockForm({ producto, enviando, error, onGuardar, onCancelar }: StockFormProps) {
  const form = useForm({
    defaultValues: { stock: producto.stock, disponible: producto.disponible },
    onSubmit: async ({ value }) => {
      await onGuardar(value);
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
      <p className="text-sm text-stone-600">
        Producto: <span className="font-semibold text-stone-900">{producto.nombre}</span>
      </p>

      <form.Field
        name="stock"
        validators={{
          onChange: ({ value }) => (Number.isInteger(value) && value >= 0 ? undefined : 'Entero mayor o igual a 0'),
        }}
      >
        {(field) => (
          <Input
            label="Stock"
            type="number"
            min={0}
            step="1"
            autoFocus
            name={field.name}
            value={Number.isNaN(field.state.value) ? '' : field.state.value}
            onChange={(e) => field.handleChange(e.target.valueAsNumber)}
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
              Guardar stock
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
