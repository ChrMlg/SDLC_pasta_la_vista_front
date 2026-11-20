export type Category = 'STARTER' | 'MAIN_COURSE' | 'DRINK' | 'DESSERT';
export type MenuItem = { id: string; branchId?: string; name: string; description: string | null; category: Category; price: string; isAvailable: boolean; updatedAt?: string };
export type Page = { data: MenuItem[]; total: number; page: number; pageSize: 10 };
export type Values = { name: string; description: string; category: Category | ''; price: string };
export type ApiError = { code: string; message: string; field: string | null; status: number };
export const labels: Record<Category, string> = { STARTER: 'Entrada', MAIN_COURSE: 'Plato fuerte', DRINK: 'Bebida', DESSERT: 'Postre' };
export const categories = Object.keys(labels) as Category[];

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as Partial<ApiError>;
    throw { code: body.code ?? 'HTTP_ERROR', message: body.message ?? 'Error del servidor', field: body.field ?? null, status: response.status } satisfies ApiError;
  }
  return response.json() as Promise<T>;
}
const base = (branchId: string) => `/api/branches/${encodeURIComponent(branchId)}`;
export const api = {
  list: (branchId: string, query: URLSearchParams, admin: boolean) => request<Page>(`${base(branchId)}/${admin ? 'menu-items' : 'menu'}?${query}`, { signal: AbortSignal.timeout(15000) }),
  get: (branchId: string, id: string) => request<MenuItem>(`${base(branchId)}/menu-items/${encodeURIComponent(id)}`),
  create: (branchId: string, values: Values) => request<MenuItem>(`${base(branchId)}/menu-items`, { method: 'POST', body: JSON.stringify(values) }),
  update: (branchId: string, id: string, values: Values) => request<MenuItem>(`${base(branchId)}/menu-items/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(values) }),
  availability: (branchId: string, id: string, isAvailable: boolean) => request<MenuItem>(`${base(branchId)}/menu-items/${encodeURIComponent(id)}/availability`, { method: 'PATCH', body: JSON.stringify({ isAvailable }) }),
};
