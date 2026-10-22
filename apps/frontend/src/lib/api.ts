export type FieldErrors = Record<string, string>;
export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string, public readonly fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
  }
}
type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown };
const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
export async function api<T>(path: string, { body, headers, ...options }: ApiOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError('Não foi possível conectar com o servidor. Tente novamente.', 0);
  }
  const payload = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) throw new ApiError(payload?.message || 'Não foi possível concluir a solicitação. Tente novamente.', response.status, payload?.code, payload?.fieldErrors);
  if (payload === undefined && response.status !== 204) throw new ApiError('O servidor retornou uma resposta inválida. Tente novamente.', response.status);
  return payload as T;
}
export const mensagemErro = (error: unknown) => error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.';
