export type ApiFailure = { code: string; message: string; field: string | null; status: number };

export class BillingRequestError extends Error {
  constructor(public failure: ApiFailure) {
    super(failure.message);
  }
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await response.json().catch(() => null) as Partial<ApiFailure> | null;
  if (!response.ok) {
    throw new BillingRequestError({
      code: data?.code ?? 'HTTP_ERROR',
      message: data?.message ?? 'No se pudo completar la operación',
      field: data?.field ?? null,
      status: response.status,
    });
  }
  return data as T;
}
