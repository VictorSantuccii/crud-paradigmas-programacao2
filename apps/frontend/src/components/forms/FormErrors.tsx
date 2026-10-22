import { useEffect } from 'react';
import type { FormFailure } from '@/lib/form-validation';
export function FormErrors({ failure, formId }: { failure: FormFailure | null; formId: string }) {
  useEffect(() => {
    if (!failure) return;
    const form = document.getElementById(formId) as HTMLFormElement | null;
    const first = Array.from(form?.elements || []).find(el => el instanceof HTMLElement && Object.keys(failure.fields).includes(el.dataset.field || el.getAttribute('name') || ''));
    if (first instanceof HTMLElement) first.focus();
    else document.getElementById(`${formId}-errors`)?.focus();
  }, [failure, formId]);
  if (!failure) return null;
  return <div id={`${formId}-errors`} tabIndex={-1} role="alert" className="rounded-xl bg-error-container p-4 text-sm text-on-error-container focus:outline-2 focus:outline-primary"><p className="font-semibold">{failure.message}</p>{Object.keys(failure.fields).length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">{Object.entries(failure.fields).map(([field, message]) => <li key={field}>{message}</li>)}</ul>}</div>;
}
