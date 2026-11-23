import type { ButtonHTMLAttributes } from 'react';

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma';
type Tamano = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
}

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-orange-600 text-white hover:bg-orange-700',
  secundario: 'bg-stone-100 text-stone-800 hover:bg-stone-200',
  peligro: 'bg-red-600 text-white hover:bg-red-700',
  fantasma: 'bg-transparent text-stone-700 hover:bg-stone-100',
};

const TAMANOS: Record<Tamano, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
};

export function Button({
  variante = 'primario',
  tamano = 'md',
  cargando = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...resto
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`}
      {...resto}
    >
      {cargando && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
