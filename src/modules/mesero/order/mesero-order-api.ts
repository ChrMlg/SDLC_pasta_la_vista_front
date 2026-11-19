const API_URL = '/api';

export interface PublicMenuItem {
  id: string;
  branchId: string;
  name: string;
  description?: string;
  category: string;
  price: number | string;
  isAvailable: boolean;
}

export interface CreateOrderPayload {
  branchId: string;
  serviceType: 'DINE_IN' | 'TAKEAWAY';
  tableId?: string | null;
  items: {
    menuItemId: string;
    quantity: number;
    notes?: string;
  }[];
}

// Descarga barriendo páginas secuenciales hasta que el servidor devuelva una lista vacía
export async function fetchAllWaiterMenuItems(branchId: string): Promise<PublicMenuItem[]> {
  let allItems: PublicMenuItem[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore && currentPage <= 10) {
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());

    const res = await fetch(`${API_URL}/branches/${branchId}/menu?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      credentials: 'include',
    });

    if (!res.ok) {
      break;
    }

    const responseData = await res.json();
    const pageItems = Array.isArray(responseData) ? responseData : (responseData.data || []);

    if (pageItems.length === 0) {
      hasMore = false;
    } else {
      allItems = [...allItems, ...pageItems];
      currentPage++;
      if (pageItems.length < 10) {
        hasMore = false;
      }
    }
  }

  return allItems;
}

export async function createWaiterOrder(payload: CreateOrderPayload) {
  const mappedItems = payload.items.map((item) => ({
    dishId: item.menuItemId,
    quantity: item.quantity,
    ...(item.notes ? { notes: item.notes } : {}),
  }));

  const apiBody: Record<string, unknown> = {
    branchId: payload.branchId,
    type: payload.serviceType,
    items: mappedItems,
  };

  if (payload.serviceType === 'DINE_IN' && payload.tableId) {
    apiBody.tableId = payload.tableId;
  }

  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(apiBody),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const msg = Array.isArray(errData.message) ? errData.message.join(', ') : errData.message;
    throw new Error(msg || 'Error al registrar el pedido en el servidor');
  }

  return res.json();
}