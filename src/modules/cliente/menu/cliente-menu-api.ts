const API_URL = '/api';

export interface ClientMenuItem {
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

export async function fetchAllClientOrderMenuItems(branchId: string): Promise<ClientMenuItem[]> {
  let allItems: ClientMenuItem[] = [];
  let currentPage = 1;
  let totalPages = 1;

  console.log('=== INICIANDO BARRIDO DE PÁGINAS ===');

  while (currentPage <= totalPages) {
    // Forzamos el parámetro de página explícitamente en la URL como string plano
    const endpoint = `${API_URL}/branches/${branchId}/menu?page=${currentPage}`;
    console.log(`-> Solicitando: ${endpoint}`);

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      credentials: 'include',
    });

    if (!res.ok) {
      console.error(`Error HTTP ${res.status} en página ${currentPage}`);
      break;
    }

    const responseData = await res.json();
    console.log(`<- Respuesta página ${currentPage}:`, responseData);

    const pageItems: ClientMenuItem[] = Array.isArray(responseData) ? responseData : (responseData.data || []);
    
    if (pageItems.length === 0) {
      console.log('Página vacía, terminando barrido.');
      break;
    }

    // Añadimos solo elementos únicos para evitar duplicados
    const newItems = pageItems.filter((newItem: ClientMenuItem) => !allItems.some(existing => existing.id === newItem.id));
    allItems = [...allItems, ...newItems];

    // Calculamos el total de páginas real usando total y pageSize del JSON
    if (!Array.isArray(responseData) && typeof responseData.total === 'number' && typeof responseData.pageSize === 'number') {
      totalPages = Math.ceil(responseData.total / responseData.pageSize);
      console.log(`-> Total platillos: ${responseData.total} | PageSize: ${responseData.pageSize} | Total Páginas calculadas: ${totalPages}`);
    } else {
      break;
    }

    currentPage++;
    if (currentPage > 10) break; // Límite de seguridad
  }

  console.log('=== BARRIDO FINALIZADO. Total acumulado:', allItems.length);
  return allItems;
}

export async function createClientOrder(payload: CreateOrderPayload) {
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