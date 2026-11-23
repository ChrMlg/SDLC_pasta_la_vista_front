import { apiRequest, extractArray } from '../../../shared/api-client';
import {
  ActiveTableSelection,
  BranchTableInfo,
  fetchBranchTables,
  fetchCustomerActiveTable,
  selectCustomerTable,
} from '../../../shared/module-bridges';

export interface CustomerMenuItem {
  id: string;
  branchId: string;
  name: string;
  description?: string;
  category: string;
  price: number | string;
  isAvailable: boolean;
}

export interface CreateCustomerOrderPayload {
  branchId: string;
  serviceType: 'DINE_IN' | 'TAKEAWAY';
  tableId?: string | null;
  items: {
    menuItemId: string;
    quantity: number;
    notes?: string;
  }[];
}

export async function fetchAllCustomerOrderMenuItems(branchId: string): Promise<CustomerMenuItem[]> {
  let allItems: CustomerMenuItem[] = [];
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages && currentPage <= 25) {
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());

    const responseData = await apiRequest<any>(
      `/branches/${branchId}/menu?${params.toString()}`
    );

    const pageItems = extractArray<CustomerMenuItem>(responseData);
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

export async function getCustomerSeatingState(branchId: string): Promise<{
  activeSelection: ActiveTableSelection | null;
  tables: BranchTableInfo[];
}> {
  const [activeSelection, tables] = await Promise.all([
    fetchCustomerActiveTable(),
    fetchBranchTables(branchId),
  ]);
  return { activeSelection, tables };
}

export async function assignCustomerTable(branchId: string, tableId: string): Promise<void> {
  await selectCustomerTable(branchId, tableId);
}

/**
 * Envía el pedido por autoservicio:
 * Intenta POST /api/orders/customer y si la instancia usa POST /api/orders, aplica fallback limpio.
 */
export async function createCustomerOrder(payload: CreateCustomerOrderPayload) {
  const mappedItems = payload.items.map((item) => ({
    dishId: item.menuItemId,
    quantity: item.quantity,
  }));

  const body: Record<string, unknown> = {
    branchId: payload.branchId,
    type: payload.serviceType,
    items: mappedItems,
  };

  if (payload.serviceType === 'DINE_IN' && payload.tableId) {
    body.tableId = payload.tableId;
  }

  try {
    return await apiRequest<any>('/orders/customer', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (err: any) {
    if (err?.status === 404 && !err?.code) {
      return apiRequest<any>('/orders', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    }
    throw err;
  }
}