const API_BASE = '/api'; // O tu URL base de backend si manejas proxy en Vite

export interface MenuItemResponse {
  id: string;
  branchId: string;
  name: string;
  description: string | null;
  category: 'STARTER' | 'MAIN_COURSE' | 'DRINK' | 'DESSERT';
  price: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// Consultar platillos con filtros y paginación (H1 / H3)
export async function fetchMenuItems(branchId: string, search?: string, category?: string, page = 1) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category && category !== 'Todas') params.append('category', category);
  params.append('page', page.toString());

  const response = await fetch(`${API_BASE}/branches/${branchId}/menu-items?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Importante para enviar la sesión/cookies del backend
  });

  if (!response.ok) {
    throw new Error('No se pudo cargar el menú del servidor');
  }

  return response.json() as Promise<{ data: MenuItemResponse[]; total: number; page: number; pageSize: number }>;
}

// Registrar un nuevo platillo (H1)
export async function createMenuItem(branchId: string, data: {
  name: string;
  description?: string;
  category: string;
  price: string;
}) {
  const response = await fetch(`${API_BASE}/branches/${branchId}/menu-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw errorBody; // Contiene el formato uniforme de error del backend { code, message, field }
  }

  return response.json();
}