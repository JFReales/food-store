import type { KeyboardEvent, ReactNode } from 'react';

interface ModalProps {
  abierto: boolean;
  titulo: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ abierto, titulo, onClose, children }: ModalProps) {
  if (!abierto) return null;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-stone-900/50 p-4"
      onKeyDown={handleKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-stone-900">{titulo}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg px-2 text-2xl leading-none text-stone-400 hover:text-stone-700"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
