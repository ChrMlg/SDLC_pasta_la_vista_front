import { apiRequest, extractArray } from '../../../shared/api-client';

export interface WaiterOrderTrackingItem {
  id: string;
  orderNumber?: string | number;
  branchId?: string;
  tableNumber?: string | number | null;
  type: 'DINE_IN' | 'TAKEAWAY' | string;
  status: string;
  createdAt?: string;
  itemsSummary?: string;
}

function normalizeTrackingOrder(raw: any): WaiterOrderTrackingItem {
  const items = Array.isArray(raw?.items) ? raw.items : [];
  const summary = items
    .map((i: any) => `${i?.name || i?.menuItem?.name || 'Platillo'} ×${i?.quantity ?? 1}`)
    .join(', ');

  return {
    id: raw?.id || raw?.orderId || '',
    orderNumber: raw?.orderNumber ?? raw?.code,
    branchId: raw?.branchId,
    tableNumber: raw?.tableNumber ?? raw?.table?.number ?? null,
    type: raw?.type || raw?.serviceType || 'DINE_IN',
    status: String(raw?.status || 'PENDING').toUpperCase(),
    createdAt: raw?.createdAt,
    itemsSummary: summary,
  };
}

export async function fetchBranchOrdersForWaiter(
  branchId: string
): Promise<WaiterOrderTrackingItem[]> {
  try {
    const res = await apiRequest<any>(`/branches/${branchId}/orders`);
    return extractArray<any>(res).map(normalizeTrackingOrder);
  } catch {
    const res = await apiRequest<any>('/orders');
    return extractArray<any>(res).map(normalizeTrackingOrder);
  }
}

export async function updateWaiterOrderStatus(
  orderId: string,
  nextStatus: 'PICKED_UP' | 'DELIVERED' | string
) {
  const candidates =
    nextStatus === 'PICKED_UP'
      ? [
          { path: `/orders/${orderId}/pickup`, method: 'PATCH' },
          { path: `/orders/${orderId}/status/OUT_FOR_DELIVERY`, method: 'PATCH' },
          { path: `/orders/${orderId}/status/PICKED_UP`, method: 'PATCH' },
        ]
      : nextStatus === 'DELIVERED'
      ? [
          { path: `/orders/${orderId}/deliver`, method: 'PATCH' },
          { path: `/orders/${orderId}/status/DELIVERED`, method: 'PATCH' },
        ]
      : [{ path: `/orders/${orderId}/status/${nextStatus}`, method: 'PATCH' }];

  let lastError: any = null;

  for (const req of candidates) {
    try {
      return await apiRequest<any>(req.path, { method: req.method });
    } catch (err: any) {
      lastError = err;
      
      if (err?.status !== 404) {
        throw err;
      }
    }
  }

  throw lastError;
}