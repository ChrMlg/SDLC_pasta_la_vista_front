const API_URL = 'http://127.0.0.1:3000/api';

export async function fetchMenuByBranch(branchId: string) {
  const response = await fetch(`${API_URL}/branches/${branchId}/menu`);
  if (!response.ok) throw new Error('Error al cargar el menú');
  return response.json();
}

export async function createMenuItem(branchId: string, itemData: {
  name: string;
  description?: string;
  category: 'STARTER' | 'MAIN_COURSE' | 'DRINK' | 'DESSERT';
  price: number;
  isAvailable?: boolean;
}) {
  const response = await fetch(`${API_URL}/branches/${branchId}/menu-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al crear el platillo');
  }
  return response.json();
}

export async function updateItemAvailability(branchId: string, menuItemId: string, isAvailable: boolean) {
  const response = await fetch(`${API_URL}/branches/${branchId}/menu-items/${menuItemId}/availability`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isAvailable }),
  });
  if (!response.ok) throw new Error('Error al actualizar disponibilidad');
  return response.json();
}