import { useForm } from '@tanstack/react-form';
import { Button } from '../../../shared/ui/Button';
import { Input, Select, TextArea } from '../../../shared/ui/Input';
import { errorDe } from '../../../shared/utils/formulario';
import type { FormaPago } from '../types/pedido';

export interface DatosEntrega {
  direccion_entrega: string;
  forma_pago: FormaPago;
  notas: string | null;
}

interface CheckoutFormProps {
  enviando: boolean;
  error: string | null;
  onConfirmar: (datos: DatosEntrega) => Promise<void>;
}

// Formulario de checkout con TanStack Form (mismas reglas que RN-06 del backend).
export function CheckoutForm({ enviando, error, onConfirmar }: CheckoutFormProps) {
  const form = useForm({
    defaultValues: { direccion_entrega: '', forma_pago: 'EFECTIVO' as FormaPago, notas: '' },
    onSubmit: async ({ value }) => {
      await onConfirmar({
        direccion_entrega: value.direccion_entrega.trim(),
        forma_pago: value.forma_pago,
        notas: value.notas.trim() || null,
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
        name="direccion_entrega"
        validators={{
          onChange: ({ value }) => {
            const largo = value.trim().length;
            if (largo < 5) return 'La dirección debe tener al menos 5 caracteres';
            if (largo > 200) return 'La dirección puede tener hasta 200 caracteres';
            return undefined;
          },
        }}
      >
        {(field) => (
          <Input
            label="Dirección de entrega"
            name={field.name}
            placeholder="Calle, número, piso, ciudad"
            autoComplete="street-address"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={errorDe(field.state.meta)}
          />
        )}
      </form.Field>

      <form.Field name="forma_pago">
        {(field) => (
          <Select
            label="Forma de pago"
            name={field.name}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value === 'TRANSFERENCIA' ? 'TRANSFERENCIA' : 'EFECTIVO')}
            onBlur={field.handleBlur}
          >
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </Select>
        )}
      </form.Field>

      <form.Field
        name="notas"
        validators={{
          onChange: ({ value }) => (value.length > 500 ? 'Máximo 500 caracteres' : undefined),
        }}
      >
        {(field) => (
          <TextArea
            label="Notas (opcional)"
            name={field.name}
            placeholder="Ej: tocar timbre 2B, sin cebolla"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            error={errorDe(field.state.meta)}
          />
        )}
      </form.Field>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form.Subscribe selector={(s) => s.canSubmit}>
        {(puedeEnviar) => (
          <Button type="submit" disabled={!puedeEnviar} cargando={enviando} className="mt-2 w-full">
            Confirmar pedido
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
