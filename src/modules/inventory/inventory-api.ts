export type Branch = {
  id: string;
  code: string;
  name: string;
};

export type InventoryItem = {
  id: string;
  branchId: string;
  name: string;
  unit: string;
  minStock: number;
  currentStock: number;
};

export type ApiError = {
  code: string;
  message: string;
  field: string | null;
  status: number;
};

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    signal,
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

export function getBranches(signal?: AbortSignal): Promise<Branch[]> {
  return request<Branch[]>('/api/branches', signal);
}

export function getInventory(branchId: string, signal?: AbortSignal): Promise<InventoryItem[]> {
  return request<InventoryItem[]>(
    `/api/management/branches/${encodeURIComponent(branchId)}/inventory`,
    signal,
  );
}
