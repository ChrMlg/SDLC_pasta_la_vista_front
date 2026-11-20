export type InventoryMovementType = 'IN' | 'OUT';

export type CreateInventoryMovement = {
  branchId: string;
  itemId: string;
  quantity: number;
  type: InventoryMovementType;
  reason: string;
};

export type InventoryMovement = {
  id: string;
  itemId: string;
  quantity: number;
  type: InventoryMovementType;
  reason: string;
  createdById: string;
  createdAt: string;
};

export type InventoryMovementApiError = {
  code: string;
  message: string;
  field: string | null;
  status: number;
};

export async function createMovement(input: CreateInventoryMovement): Promise<InventoryMovement> {
  const response = await fetch('/api/management/inventory/movements', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => null) as Partial<InventoryMovementApiError> | InventoryMovement | null;
  if (!response.ok) {
    const error = body as Partial<InventoryMovementApiError> | null;
    throw {
      code: error?.code ?? 'HTTP_ERROR',
      message: error?.message ?? 'No se pudo completar la operación',
      field: error?.field ?? null,
      status: response.status,
    } satisfies InventoryMovementApiError;
  }
  return body as InventoryMovement;
}
