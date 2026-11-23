import { Button } from '../ui/Button';

interface EstadoErrorProps {
  mensaje: string;
  onReintentar?: () => void;
}

export function EstadoError({ mensaje, onReintentar }: EstadoErrorProps) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
      <p className="font-semibold">Ocurrió un problema</p>
      <p className="mt-1 text-sm">{mensaje}</p>
      {onReintentar && (
        <Button variante="peligro" tamano="sm" className="mt-4" onClick={onReintentar}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
