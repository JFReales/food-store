import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

const CONTROL =
  'w-full rounded-lg border px-3 py-2 text-stone-900 focus:ring-2 focus:outline-none disabled:bg-stone-100';
const control = (error?: string) =>
  `${CONTROL} ${error ? 'border-red-400 focus:ring-red-200' : 'border-stone-300 focus:border-orange-500 focus:ring-orange-200'}`;

interface CampoProps {
  label: string;
  error?: string;
  children: ReactNode;
}

// Etiqueta + control + mensaje de error (reutilizado por Input, Select y TextArea).
function Campo({ label, error, children }: CampoProps) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
      {label}
      {children}
      {error && <span className="text-xs font-normal text-red-600">{error}</span>}
    </label>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, className = '', ...resto }: InputProps) {
  return (
    <Campo label={label} error={error}>
      <input className={`${control(error)} ${className}`} {...resto} />
    </Campo>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export function Select({ label, error, className = '', children, ...resto }: SelectProps) {
  return (
    <Campo label={label} error={error}>
      <select className={`${control(error)} ${className}`} {...resto}>
        {children}
      </select>
    </Campo>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function TextArea({ label, error, className = '', ...resto }: TextAreaProps) {
  return (
    <Campo label={label} error={error}>
      <textarea className={`${control(error)} ${className}`} rows={3} {...resto} />
    </Campo>
  );
}
