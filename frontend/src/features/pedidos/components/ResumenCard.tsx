import { Card } from '../../../shared/ui/Card';

type Acento = 'ambar' | 'cielo' | 'verde' | 'gris' | 'naranja';

interface ResumenCardProps {
  titulo: string;
  valor: string;
  acento: Acento;
  detalle?: string;
}

const ACENTOS: Record<Acento, string> = {
  ambar: 'border-l-amber-400',
  cielo: 'border-l-sky-400',
  verde: 'border-l-green-500',
  gris: 'border-l-stone-400',
  naranja: 'border-l-orange-500',
};

export function ResumenCard({ titulo, valor, acento, detalle }: ResumenCardProps) {
  return (
    <Card className={`border-l-4 ${ACENTOS[acento]}`}>
      <p className="text-sm font-medium text-stone-500">{titulo}</p>
      <p className="mt-1 text-3xl font-bold text-stone-900">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-stone-500">{detalle}</p>}
    </Card>
  );
}
