import { apiRequest, BRANCHES, extractArray } from '../../../shared/api-client';

export interface BranchSalesRow {
  branchId: string;
  branch: string;
  sales: number;
  orders: number;
}

export interface TopDishReportRow {
  rank: number;
  name: string;
  category: string;
  units: number;
  revenue?: number;
}

export interface PeakHourRow {
  hourLabel: string;
  orders: number;
}

export interface BranchPerformanceRow {
  branchId: string;
  branch: string;
  sales: number;
  orders: number;
  averageTicket: number;
  diffVsAveragePct: number;
  needsAttention: boolean;
}

function buildDateParams(startDate: string, endDate: string): URLSearchParams {
  const params = new URLSearchParams();
  if (startDate) params.append('from', startDate);
  if (endDate) params.append('to', endDate);
  return params;
}

export async function fetchSalesReport(
  startDate: string,
  endDate: string
): Promise<BranchSalesRow[]> {
  const params = buildDateParams(startDate, endDate);
  const res = await apiRequest<any>(`/analytics/sales?${params.toString()}`);
  const rows = extractArray<any>(res);

  return BRANCHES.map((b) => {
    const match = rows.find(
      (r: any) =>
        r?.branchId === b.id ||
        String(r?.branchName || r?.branch || '').toLowerCase() === b.key.toLowerCase()
    );
    return {
      branchId: b.id,
      branch: b.label,
      sales: Number(match?.totalSales ?? match?.sales ?? 0),
      orders: Number(match?.paidOrders ?? match?.ordersCount ?? match?.orders ?? 0),
    };
  });
}

export async function fetchBranchesComparison(
  startDate: string,
  endDate: string
): Promise<BranchSalesRow[]> {
  const params = buildDateParams(startDate, endDate);
  BRANCHES.forEach((b) => params.append('branchIds', b.id));
  const res = await apiRequest<any>(`/analytics/branches/compare?${params.toString()}`);
  const rows = extractArray<any>(res);

  return BRANCHES.map((b) => {
    const match = rows.find(
      (r: any) =>
        r?.branchId === b.id ||
        String(r?.branchName || r?.branch || '').toLowerCase() === b.key.toLowerCase()
    );
    return {
      branchId: b.id,
      branch: b.label,
      sales: Number(match?.totalSales ?? match?.sales ?? 0),
      orders: Number(match?.paidOrders ?? match?.ordersCount ?? match?.orders ?? 0),
    };
  });
}

export async function fetchTopDishesReport(
  branchId: string,
  startDate: string,
  endDate: string,
  limit: number
): Promise<TopDishReportRow[]> {
  const params = buildDateParams(startDate, endDate);
  params.append('limit', String(limit));
  const res = await apiRequest<any>(
    `/analytics/branches/${branchId}/top-dishes?${params.toString()}`
  );
  const rows = extractArray<any>(res);

  return rows.map((r: any, idx: number) => ({
    rank: idx + 1,
    name: r?.name || r?.dishName || r?.menuItemName || 'Platillo',
    category: r?.category || '',
    units: Number(r?.unitsSold ?? r?.units ?? r?.quantity ?? 0),
    revenue: Number(r?.revenue ?? r?.totalSales ?? 0),
  }));
}

export async function fetchPeakHoursReport(
  branchId: string,
  startDate: string,
  endDate: string
): Promise<PeakHourRow[]> {
  const params = buildDateParams(startDate, endDate);
  params.append('branchId', branchId);
  const res = await apiRequest<any>(`/analytics/branches/peak-hours?${params.toString()}`);
  const rows = extractArray<any>(res);

  return rows.map((r: any) => ({
    hourLabel: r?.interval || r?.hourLabel || r?.hour || '',
    orders: Number(r?.ordersCount ?? r?.orders ?? r?.count ?? 0),
  }));
}

export async function fetchBranchPerformanceReport(
  startDate: string,
  endDate: string
): Promise<BranchPerformanceRow[]> {
  const params = buildDateParams(startDate, endDate);
  const res = await apiRequest<any>(`/analytics/branches/performance?${params.toString()}`);
  const rows = extractArray<any>(res);

  return BRANCHES.map((b) => {
    const match = rows.find(
      (r: any) =>
        r?.branchId === b.id ||
        String(r?.branchName || r?.branch || '').toLowerCase() === b.key.toLowerCase()
    );
    const diff = Number(match?.diffVsAveragePct ?? match?.variancePct ?? 0);
    return {
      branchId: b.id,
      branch: b.label,
      sales: Number(match?.totalSales ?? match?.sales ?? 0),
      orders: Number(match?.paidOrders ?? match?.orders ?? 0),
      averageTicket: Number(match?.averageTicket ?? 0),
      diffVsAveragePct: diff,
      needsAttention: Boolean(match?.needsAttention ?? diff < -15),
    };
  });
}
