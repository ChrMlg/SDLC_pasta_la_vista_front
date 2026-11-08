/** The order entry point reloads the same filtered page before selecting dishId. */
export function orderHandoff(branchId: string, dishId: string, page: number, search = '', category = '', tableId?: string): string {
  const query = new URLSearchParams({ branchId, dishId, page: String(page) });
  if (tableId) query.set('tableId', tableId);
  if (search) query.set('search', search);
  if (category) query.set('category', category);
  return `/orders/new?${query}`;
}
