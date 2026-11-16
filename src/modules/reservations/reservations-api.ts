export type Branch = { id: string; code: string; name: string };
export type ReservationSlot = { time: string; endTime: string; available: boolean };
export type ReservationAvailability = {
  branchId: string;
  date: string;
  partySize: number;
  timeZone: string;
  slots: ReservationSlot[];
};
export type Reservation = {
  id: string;
  branchId: string;
  tableId: string;
  customerId: string;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  status: 'CONFIRMED';
  branchName: string;
  tableNumber: number;
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

export const reservationsApi = {
  branches: (signal?: AbortSignal) => request<Branch[]>('/api/branches', { signal }),
  availability: (branchId: string, date: string, partySize: number, signal?: AbortSignal) => {
    const query = new URLSearchParams({ date, partySize: String(partySize) });
    return request<ReservationAvailability>(
      `/api/branches/${encodeURIComponent(branchId)}/reservation-availability?${query}`,
      { signal },
    );
  },
  create: (input: { branchId: string; date: string; time: string; partySize: number }) =>
    request<Reservation>('/api/reservations', { method: 'POST', body: JSON.stringify(input) }),
};
