import { ApiError, mensagemErro, type FieldErrors } from './api';
export type FormFailure = { message: string; fields: FieldErrors };
export const formFailure = (error: unknown): FormFailure => ({ message: mensagemErro(error), fields: error instanceof ApiError ? error.fieldErrors : {} });
export function validarFormulario(form: HTMLFormElement): FormFailure | null {
  const fields: FieldErrors = {};
  for (const element of Array.from(form.elements)) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement)) continue;
    if (!element.validity.valid || (element.required && !element.value.trim())) {
      fields[element.dataset.field || element.name] = element.validity.valueMissing || !element.value.trim() ? 'Preencha este campo.' : element.validationMessage;
    }
  }
  return Object.keys(fields).length ? { message: 'Revise os campos indicados.', fields } : null;
}
