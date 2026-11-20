import { apiRequest, extractArray } from '../../../shared/api-client';

export interface ClientMenuItem {
  id: string;
  branchId: string;
  name: string;
  description?: string;
  category: string;
  price: number | string;
  isAvailable: boolean;
}

export async function fetchAllClientMenuItems(branchId: string): Promise<ClientMenuItem[]> {
  let allItems: ClientMenuItem[] = [];
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages && currentPage <= 25) {
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());

    const responseData = await apiRequest<any>(
      `/branches/${branchId}/menu?${params.toString()}`
    );

    const pageItems = extractArray<ClientMenuItem>(responseData);
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
