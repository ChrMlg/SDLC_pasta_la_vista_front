const API_URL = '/api';

export interface MenuItemResponse {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  isAvailable: boolean;
}

export async function fetchMenuItems(branchId: string, search?: string, category?: string) {
  let url = `${API_URL}/branches/${branchId}/menu-items`;
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category && category !== 'Todas') params.append('category', category);
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
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
  // Reemplazamos cualquier coma por punto y convertimos a número flotante de forma segura
  const cleanPrice = parseFloat(String(data.price).replace(',', '.')) || 0;

  const payload = {
    ...data,
    // Forzamos el precio a string con dos decimales exactos utilizando punto (ej. "5.00")
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