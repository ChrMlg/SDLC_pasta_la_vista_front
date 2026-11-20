import { apiRequest, extractArray } from '../../../shared/api-client';

export interface KitchenOrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  isReady?: boolean;
  status?: string;
  readyAt?: string;
}

export interface KitchenOrder {
  orderId: string;
  orderNumber?: string | number;
  tableNumber?: string | number | null;
  type?: 'DINE_IN' | 'TAKEAWAY' | string;
  status: string;
  createdAt?: string;
  takenBy?: string | null;
  items: KitchenOrderItem[];
}

function normalizeKitchenOrder(raw: any): KitchenOrder {
  const rawItems = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.orderItems)
    ? raw.orderItems
    : [];

  return {
    orderId: raw?.orderId || raw?.id || '',
    orderNumber: raw?.orderNumber ?? raw?.code,
    tableNumber: raw?.tableNumber ?? raw?.table?.number ?? null,
    type: raw?.type || raw?.serviceType || 'DINE_IN',
    status: String(raw?.status || raw?.kitchenStatus || 'PENDING').toUpperCase(),
    createdAt: raw?.createdAt || raw?.submittedAt,
    takenBy: raw?.takenBy || raw?.cookId || null,
    items: rawItems.map((it: any) => ({
      id: it?.id || it?.orderItemId || '',
      name: it?.name || it?.menuItem?.name || it?.dishName || 'Platillo',
      quantity: Number(it?.quantity ?? 1),
      notes: it?.notes,
      isReady:
        Boolean(it?.isReady) ||
        String(it?.status || '').toUpperCase() === 'READY',
      status: it?.status,
      readyAt: it?.readyAt,
    })),
  };
}

export async function fetchKitchenOrders(branchId: string): Promise<KitchenOrder[]> {
  const payload = await apiRequest<any>(`/branches/${branchId}/kitchen/orders`);
  const list = extractArray<any>(payload);
  return list.map(normalizeKitchenOrder);
}

export async function takeKitchenOrder(branchId: string, orderId: string) {
  return apiRequest<any>(`/branches/${branchId}/kitchen/orders/${orderId}/take`, {
    method: 'PATCH',
  });
}

export async function releaseKitchenOrder(branchId: string, orderId: string) {
  return apiRequest<any>(`/branches/${branchId}/kitchen/orders/${orderId}/release`, {
    method: 'PATCH',
  });
}

export async function markKitchenItemReady(
  branchId: string,
  orderId: string,
  itemId: string
) {
  return apiRequest<any>(
    `/branches/${branchId}/kitchen/orders/${orderId}/items/${itemId}/ready`,
    {
      method: 'PATCH',
    }
  );
}
