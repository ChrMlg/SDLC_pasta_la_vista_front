export type Branch = { id: string; code: string; name: string };
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export type OccupancySlot = {
  startTime: string;
  endTime: string;
  reservedTables: number;
  availableTables: number;
  occupancyPercentage: number;
};

export type ManagedReservation = {
  id: string;
  tableId: string;
  tableNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  status: ReservationStatus;
};

export type Occupancy = {
  branchId: string;
  date: string;
  timeZone: string;
  totalTables: number;
  slots: OccupancySlot[];
  reservations: ManagedReservation[];
};

export type CancellationResponse = {
  id: string;
  branchId: string;
  tableId: string;
  customerId: string;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  status: 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  branchName: string;
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

export const managementReservationsApi = {
  branches: (signal?: AbortSignal) =>
    request<Branch[]>('/api/branches', { signal }),
  occupancy: (branchId: string, date: string, signal?: AbortSignal) => {
    const query = new URLSearchParams({ date });
    return request<Occupancy>(
      `/api/management/branches/${encodeURIComponent(branchId)}/occupancy?${query}`,
      { signal },
    );
  },
  cancel: (id: string) =>
    request<CancellationResponse>(`/api/reservations/${encodeURIComponent(id)}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({}),
    }),
};
