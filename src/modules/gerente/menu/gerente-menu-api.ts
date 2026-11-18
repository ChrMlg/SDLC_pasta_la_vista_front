const API_URL = '/api';

export interface MenuItemResponse {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  isAvailable: boolean;
}

export async function fetchMenuItems(branchId: string, search?: string, category?: string, page: number = 1) {
  let url = `${API_URL}/branches/${branchId}/menu-items`;
  const params = new URLSearchParams();
  
  if (search) params.append('search', search);
  if (category && category !== 'Todas') params.append('category', category);
  
  // Enviamos la página actual para que el backend nos devuelva el bloque correcto
  params.append('page', page.toString());

  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    credentials: 'include',
  });
  
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    console.error("Detalle del error del backend (fetchMenuItems):", errorBody);
    throw new Error(errorBody.message || 'Error al obtener platillos');
  }
  return res.json();
}

export async function createMenuItem(branchId: string, data: {
  name: string;
  description?: string;
  category: string;
  price: string | number;
}) {
  const cleanPrice = parseFloat(String(data.price ?? '').trim().replace(',', '.')) || 0;

  const payload = {
    ...data,
    price: cleanPrice.toFixed(2),
  };

  console.log("📤 PAYLOAD ENVIADO AL BACKEND:", JSON.stringify(payload, null, 2));

  const res = await fetch(`${API_URL}/branches/${branchId}/menu-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    console.error("❌ ERROR COMPLETO DEL BACKEND (createMenuItem):", errData);
    throw new Error(errData.message || 'Error al registrar el platillo');
  }
  return res.json();
}

export async function updateItemAvailability(branchId: string, itemId: string, isAvailable: boolean) {
  const res = await fetch(`${API_URL}/branches/${branchId}/menu-items/${itemId}/availability`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ isAvailable }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    console.error("❌ ERROR AL CAMBIAR DISPONIBILIDAD:", errData);
    throw new Error(errData.message || 'No se pudo actualizar la disponibilidad');
  }
  return res.json();
}