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
  tableNumber: string | null;
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

  while (hasMore && currentPage <= 10) { // Límite de seguridad de 10 páginas (100 platillos)
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
      break; // Si una página falla o no existe, detenemos el ciclo de forma segura
    }

    const responseData = await res.json();
    const pageItems = Array.isArray(responseData) ? responseData : (responseData.data || []);

    if (pageItems.length === 0) {
      hasMore = false;
    } else {
      allItems = [...allItems, ...pageItems];
      currentPage++;
      if (pageItems.length < 10) {
        hasMore = false; // Si trae menos de 10, era la última página
      }
    }
  }

  return allItems;
}

export async function createWaiterOrder(payload: CreateOrderPayload) {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Error al registrar el pedido en el servidor');
  }

  return res.json();
}