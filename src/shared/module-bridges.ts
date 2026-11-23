import { apiRequest, extractArray } from './api-client';

/**
 * Puentes de integración con módulos  (Módulos 4, 5, 6, 7, 8):
 * - Módulo 4 / 5: Asignación de mesa vigente (/api/me/table-selection, /api/branches/:branchId/tables)
 * - Módulo 6: Facturación y cobro (/api/branches/:branchId/bills, /api/bills/:billId/payments)
 * - Módulo 7: Inventario (/api/management/branches/:branchId/inventory)
 * - Módulo 8: Reseñas (/api/orders/:orderId/reviews)
 */

export interface ActiveTableSelection {
  tableId: string;
  tableNumber?: number | string;
  branchId: string;
  status?: string;
}

export interface BranchTableInfo {
  id: string;
  number: number;
  capacity?: number;
  status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'NEEDS_CLEANING' | 'OUT_OF_SERVICE' | string;
}

export async function fetchCustomerActiveTable(): Promise<ActiveTableSelection | null> {
  try {
    const res = await apiRequest<any>('/me/table-selection');
    const data = res?.data || res;
    if (!data?.tableId) return null;
    return {
      tableId: data.tableId,
      tableNumber: data.tableNumber ?? data.number ?? data.table?.number,
      branchId: data.branchId,
      status: data.status ?? data.table?.status,
    };
  } catch {
    return null;
  }
}

export async function selectCustomerTable(branchId: string, tableId: string): Promise<void> {
  await apiRequest(`/branches/${branchId}/tables/${tableId}/select`, {
    method: 'POST',
  });
}

export async function fetchBranchTables(branchId: string): Promise<BranchTableInfo[]> {
  try {
    const res = await apiRequest<any>(`/branches/${branchId}/tables`);
    return extractArray<BranchTableInfo>(res);
  } catch {
    return [];
  }
}

export interface CompanionRoutesMap {
  seatingRoute: string;
  reservationsRoute: string;
  billingCheckoutRoute: (orderOrBillId?: string, branchId?: string) => string;
  inventoryRoute: string;
  reviewsRoute: (orderId: string) => string;
}

export const COMPANION_ROUTES: CompanionRoutesMap = {
  seatingRoute: '/seating',
  reservationsRoute: '/reservations',
  billingCheckoutRoute: (id?: string, branchId?: string) => id
    ? `/checkout?orderId=${encodeURIComponent(id)}${branchId ? `&branchId=${encodeURIComponent(branchId)}` : ''}`
    : '/checkout',
  inventoryRoute: '/management/inventory',
  reviewsRoute: (orderId: string) => `/orders/${encodeURIComponent(orderId)}/review`,
};
