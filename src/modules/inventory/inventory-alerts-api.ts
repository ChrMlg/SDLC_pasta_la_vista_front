export type InventoryAlertStatus = 'ACTIVE' | 'RESOLVED';

export type InventoryAlert = {
  id: string;
  branchId: string;
  itemId: string;
  currentStock: number;
  minStock: number;
  status: InventoryAlertStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolvedByUserId: string | null;
  item: {
    name: string;
    unit: string;
    currentStock: number;
    minStock: number;
  };
  branch: {
    name: string;
  };
};

export type InventoryAlertsApiError = {
  code: string;
  message: string;
  field: string | null;
  status: number;
};

export async function getAlerts(branchId: string, signal?: AbortSignal): Promise<InventoryAlert[]> {
  const response = await fetch(
    `/api/management/branches/${encodeURIComponent(branchId)}/inventory/alerts`,
    { credentials: 'include', signal },
  );
  const body = await response.json().catch(() => null) as Partial<InventoryAlertsApiError> | InventoryAlert[] | null;
  if (!response.ok) {
    const error = body as Partial<InventoryAlertsApiError> | null;
    throw {
      code: error?.code ?? 'HTTP_ERROR',
      message: error?.message ?? 'No se pudo completar la operación',
      field: error?.field ?? null,
      status: response.status,
    } satisfies InventoryAlertsApiError;
  }
  return body as InventoryAlert[];
}
