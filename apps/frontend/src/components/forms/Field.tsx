import { useId, type InputHTMLAttributes } from 'react';
import type { FieldErrors } from '@/lib/api';
export const inputClass = 'w-full min-w-0 rounded-lg bg-surface-container-lowest px-3.5 py-3 text-on-surface shadow-sm ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary disabled:opacity-60';
export type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; field?: string; errors?: FieldErrors };
export function Field({ label, field, errors = {}, id, name, ...props }: FieldProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const key = field || name;
  return <div className="min-w-0"><label htmlFor={inputId} className="mb-1.5 block font-label-md text-on-surface">{label}</label><input {...props} name={name} id={inputId} data-field={key} className={inputClass} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${inputId}-error` : props['aria-describedby']} />{errors[key] && <p id={`${inputId}-error`} className="mt-1.5 text-sm text-error">{errors[key]}</p>}</div>;
}
