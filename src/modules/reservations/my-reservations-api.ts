export type CustomerReservation = {
  id: string;
  branchId: string;
  branchName: string;
  tableId: string;
  tableNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
};

export type CancellationResponse = Omit<CustomerReservation, 'status' | 'tableNumber'> & {
  status: 'CANCELLED';
  tableNumber?: number;
};

export type ApiError = { code: string; message: string; field: string | null; status: number };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = await response.json().catch(() => null) as Partial<ApiError> | null;
  if (!response.ok) {
    throw {
      code: body?.code ?? 'HTTP_ERROR',
      message: body?.message ?? 'No se pudo completar la operación',
      field: body?.field ?? null,
      status: response.status,
    } satisfies ApiError;
  }
  return body as T;
}

export const myReservationsApi = {
  list: (signal?: AbortSignal) =>
    request<CustomerReservation[]>('/api/me/reservations', { signal }),
  cancel: (id: string) =>
    request<CancellationResponse>(`/api/me/reservations/${encodeURIComponent(id)}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({}),
    }),
};
