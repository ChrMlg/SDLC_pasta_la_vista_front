import { apiRequest, extractArray } from '../../../shared/api-client';

export interface MenuItemResponse {
  id: string;
  branchId?: string;
  name: string;
  description?: string;
  category: string;
  price: number | string;
  isAvailable: boolean;
}

export async function fetchAllManagerMenuItems(
  branchId: string,
  search?: string,
  category?: string
): Promise<MenuItemResponse[]> {
  let allItems: MenuItemResponse[] = [];
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages && currentPage <= 25) {
    const params = new URLSearchParams();
    params.append('page', currentPage.toString());
    if (search?.trim()) params.append('search', search.trim());
    if (category && category !== 'Todas') params.append('category', category);

    const responseData = await apiRequest<any>(
      `/branches/${branchId}/menu-items?${params.toString()}`
    );

    const pageItems = extractArray<MenuItemResponse>(responseData);
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

export async function createMenuItem(
  branchId: string,
  data: {
    name: string;
    description?: string;
    category: string;
    price: string | number;
  }
) {
  const cleanPrice = parseFloat(String(data.price).replace(',', '.')) || 0;
  return apiRequest<MenuItemResponse>(`/branches/${branchId}/menu-items`, {
    method: 'POST',
    body: JSON.stringify({
      name: data.name.trim(),
      ...(data.description?.trim() ? { description: data.description.trim() } : {}),
      category: data.category,
      price: cleanPrice.toFixed(2),
    }),
  });
}

export async function updateItemAvailability(
  branchId: string,
  itemId: string,
  isAvailable: boolean
) {
  return apiRequest<MenuItemResponse>(
    `/branches/${branchId}/menu-items/${itemId}/availability`,
    {
      method: 'PATCH',
      body: JSON.stringify({ isAvailable }),
    }
  );
}