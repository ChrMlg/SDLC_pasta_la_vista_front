import { apiRequest, extractArray } from '../../../shared/api-client';

export interface PublicMenuItem {
  id: string;
  branchId?: string;
  name: string;
  description?: string;
  category: string;
  price: number | string;
  isAvailable: boolean;
}

export interface BranchTableOption {
  id: string;
  number: number | string;
  label: string;
  status?: string;
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

function isInactiveTableError(error: unknown): boolean {
  const apiError = error as { code?: unknown; message?: unknown };
  const code = typeof apiError?.code === 'string' ? apiError.code.toUpperCase() : '';
  const message = typeof apiError?.message === 'string' ? apiError.message.toLowerCase() : '';
  return /TABLE.*(?:INACTIVE|NOT_ACTIVE)|(?:INACTIVE|NOT_ACTIVE).*TABLE/.test(code)
    || /(?:mesa.*(?:inactiva|no est[aá] activa)|table.*(?:inactive|not active))/.test(message);
}

export async function fetchAllWaiterMenuItems(branchId: string): Promise<PublicMenuItem[]> {
  let allItems: PublicMenuItem[] = [];
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages && currentPage <= 25) {
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());

    const responseData = await apiRequest<any>(
      `/branches/${branchId}/menu?${params.toString()}`
    );

    const pageItems = extractArray<PublicMenuItem>(responseData);
    if (pageItems.length === 0) {
      break;
    }

    const uniqueNew = pageItems.filter(
      (item) => !allItems.some((existing) => existing.id === item.id)
    );
    allItems = [...allItems, ...uniqueNew];

    if (
      !Array.isArray(responseData) &&
      typeof responseData?.total === 'number' &&
      typeof responseData?.pageSize === 'number' &&
      responseData.pageSize > 0
    ) {
      totalPages = Math.ceil(responseData.total / responseData.pageSize);
    } else if (pageItems.length < 10) {
      break;
    }

    currentPage++;
  }

  return allItems;
}

export async function fetchBranchTables(branchId: string): Promise<BranchTableOption[]> {
  const data = await apiRequest<any>(`/branches/${branchId}/tables`);
  const list = extractArray<any>(data);
  return list.map((t: any, idx: number) => {
    const num = t?.number ?? idx + 1;
    const padded = String(num).padStart(2, '0');
    return {
      id: String(t.id),
      number: num,
      label: t?.name || `Mesa ${padded}`,
      status: t?.status,
    };
  });
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

  try {
    return await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(apiBody),
    });
  } catch (error) {
    if (isInactiveTableError(error)) {
      throw new Error('Esta mesa no está activa. Elige otra o pide al cliente que se siente primero.');
    }
    throw error;
  }
}