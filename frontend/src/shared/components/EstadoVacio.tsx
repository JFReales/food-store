import type { ReactNode } from 'react';

interface EstadoVacioProps {
  titulo: string;
  mensaje?: string;
  accion?: ReactNode;
}

export function EstadoVacio({ titulo, mensaje, accion }: EstadoVacioProps) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center">
      <p className="text-lg font-semibold text-stone-700">{titulo}</p>
      {mensaje && <p className="mt-1 text-sm text-stone-500">{mensaje}</p>}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );
}
