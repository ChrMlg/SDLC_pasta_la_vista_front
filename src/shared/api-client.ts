export const API_URL = '/api';

export interface BranchInfo {
  key: string;
  label: string;
  id: string;
}

export const BRANCHES: BranchInfo[] = [
  { key: 'Centro', label: 'Centro', id: 'a1111111-1111-4111-8111-111111111111' },
  { key: 'Bambu', label: 'Bambú', id: 'a2222222-2222-4222-8222-222222222222' },
  { key: 'Ramblas', label: 'Ramblas', id: 'a3333333-3333-4333-8333-333333333333' },
];

export const BRANCH_MAP: Record<string, string> = {
  Centro: 'a1111111-1111-4111-8111-111111111111',
  Bambu: 'a2222222-2222-4222-8222-222222222222',
  Bambú: 'a2222222-2222-4222-8222-222222222222',
  Ramblas: 'a3333333-3333-4333-8333-333333333333',
};

export let DEFAULT_BRANCH_ID = 'a1111111-1111-4111-8111-111111111111';

export async function syncBranchesFromApi(): Promise<void> {
  try {
    const branches = extractArray<any>(await apiRequest('/branches'))
      .filter((branch) => branch?.id && branch?.code && branch?.name)
      .map((branch) => ({
        key: String(branch.code),
        label: String(branch.name).replace(/^Bistro\s+/i, ''),
        id: String(branch.id),
      }));

    if (branches.length === 0) return;

    BRANCHES.splice(0, BRANCHES.length, ...branches);
    for (const key of Object.keys(BRANCH_MAP)) delete BRANCH_MAP[key];
    for (const branch of branches) {
      BRANCH_MAP[branch.key] = branch.id;
      BRANCH_MAP[branch.label] = branch.id;
    }
    DEFAULT_BRANCH_ID = branches[0].id;
  } catch {
    // Keep the local branch list available if the API is temporarily unavailable.
  }
}

export type UserRole =
  | 'CUSTOMER'
  | 'WAITER'
  | 'KITCHEN'
  | 'MANAGER'
  | 'GENERAL_MANAGER';

export interface SessionProfile {
  id?: string;
  email?: string;
  name?: string;
  role: UserRole;
  branchId?: string | null;
}

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('/api') ? path : `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'no-cache');
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const rawMsg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
    throw new ApiRequestError(
      res.status,
      rawMsg || `Error HTTP ${res.status}`,
      data?.code || data?.errorCode,
      data
    );
  }

  return data as T;
}

export function extractArray<T = any>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  if (Array.isArray(payload?.branches)) return payload.branches;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}
