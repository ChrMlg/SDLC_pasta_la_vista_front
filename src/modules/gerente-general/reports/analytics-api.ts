import { apiRequest, BRANCHES, extractArray } from '../../../shared/api-client';

export interface BranchSalesRow {
  branchId: string;
  branch: string;
  sales: number;
  orders: number;
}

export interface TopDishReportRow {
  rank: number;
  itemId: string;
  name: string;
  category: string;
  units: number;
  revenue: number;
}

export interface PeakHourRow {
  hourLabel: string;
  orders: number;
  sales: number;
  branchId?: string;
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

export function toIsoWithTimezone(
  dateInput: unknown,
  endOfDay = false
): string {
  if (!dateInput) return '';

  if (dateInput instanceof Date) {
    return Number.isNaN(dateInput.getTime()) ? '' : dateInput.toISOString();
  }

  const raw = String(dateInput).trim();
  if (!raw) return '';

  if (
    raw.includes('T') &&
    (raw.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(raw))
  ) {
    const valid = new Date(raw);
    return Number.isNaN(valid.getTime()) ? '' : valid.toISOString();
  }

  const dateOnlyMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  const baseDate = dateOnlyMatch ? dateOnlyMatch[1] : raw;
  const timePart = endOfDay ? '23:59:59.999' : '00:00:00.000';
  const parsed = new Date(`${baseDate}T${timePart}`);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString();
}

function buildDateQuery(
  fromDate: unknown,
  toDate: unknown,
  extraParams?: Record<string, unknown>
): string {
  const params = new URLSearchParams();
  const fallbackToday = new Date().toISOString().split('T')[0];
  const effectiveFrom = fromDate || toDate || fallbackToday;
  const effectiveTo = toDate || fromDate || fallbackToday;

  const isoFrom = toIsoWithTimezone(effectiveFrom, false);
  const isoTo = toIsoWithTimezone(effectiveTo, true);

  if (isoFrom) params.append('from', isoFrom);
  if (isoTo) params.append('to', isoTo);

  if (extraParams) {
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        params.append(key, String(value).trim());
      }
    });
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

function resolveBranchLabel(
  rawBranch: any,
  fallbackIndex: number
): { branchId: string; branch: string } {
  const candidateId =
    rawBranch?.branchId || rawBranch?.id || BRANCHES[fallbackIndex]?.id || '';
  const matchedById = BRANCHES.find((b) => b.id === candidateId);

  const rawName = String(
    rawBranch?.branch || rawBranch?.branchName || rawBranch?.name || ''
  ).toLowerCase();

  const matchedByName = BRANCHES.find(
    (b) =>
      b.label.toLowerCase() === rawName ||
      b.key.toLowerCase() === rawName ||
      rawName.includes(b.key.toLowerCase())
  );

  const resolved = matchedById || matchedByName;
  return {
    branchId: resolved?.id || candidateId || `branch-${fallbackIndex}`,
    branch:
      resolved?.label ||
      rawBranch?.branch ||
      rawBranch?.branchName ||
      rawBranch?.name ||
      `Sucursal ${fallbackIndex + 1}`,
  };
}

function mapBranchSalesList(data: any): BranchSalesRow[] {
  const list = extractArray<any>(data);
  if (list.length === 0) {
    return BRANCHES.map((b) => ({
      branchId: b.id,
      branch: b.label,
      sales: 0,
      orders: 0,
    }));
  }

  return list.map((item, idx) => {
    const info = resolveBranchLabel(item, idx);
    return {
      branchId: info.branchId,
      branch: info.branch,
      sales: Number(item?.sales ?? item?.totalSales ?? item?.revenue ?? 0) || 0,
      orders:
        Number(item?.orders ?? item?.paidOrders ?? item?.ordersCount ?? 0) || 0,
    };
  });
}

export async function fetchSalesReport(
  fromDate: string,
  toDate: string
): Promise<BranchSalesRow[]> {
  const query = buildDateQuery(fromDate, toDate);
  const data = await apiRequest<any>(`/analytics/sales${query}`);
  return mapBranchSalesList(data);
}

export async function fetchBranchesComparison(
  fromDate: string,
  toDate: string,
  branchIds: string[] = BRANCHES.map((b) => b.id)
): Promise<BranchSalesRow[]> {
  const params = new URLSearchParams();
  const fallbackToday = new Date().toISOString().split('T')[0];
  const effectiveFrom = fromDate || toDate || fallbackToday;
  const effectiveTo = toDate || fromDate || fallbackToday;

  const isoFrom = toIsoWithTimezone(effectiveFrom, false);
  const isoTo = toIsoWithTimezone(effectiveTo, true);

  if (isoFrom) params.append('from', isoFrom);
  if (isoTo) params.append('to', isoTo);

  const ids = branchIds.length > 0 ? branchIds : BRANCHES.map((b) => b.id);
  if (ids.length > 0) {
    params.set('branchIds', ids.join(','));
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await apiRequest<any>(`/analytics/branches/compare${query}`);
  return mapBranchSalesList(data);
}

export async function fetchTopDishesReport(
  branchId: string,
  fromDate: string,
  toDate: string,
  limit: number | string = 5
): Promise<TopDishReportRow[]> {
  const rawNum = Number(String(limit ?? '').replace(/\D+/g, ''));
  const numericLimit =
    Number.isFinite(rawNum) && rawNum > 0 && rawNum <= 100 ? rawNum : 5;

  const query = buildDateQuery(fromDate, toDate, { limit: numericLimit });
  const data = await apiRequest<any>(
    `/analytics/branches/${branchId}/top-dishes${query}`
  );
  const list = extractArray<any>(data);

  return list.slice(0, numericLimit).map((item, idx) => ({
    rank: Number(item?.rank ?? idx + 1) || idx + 1,
    itemId: String(item?.itemId ?? item?.menuItemId ?? item?.id ?? idx),
    name: String(item?.name ?? item?.dishName ?? 'Platillo'),
    category: String(item?.category ?? ''),
    units: Number(item?.units ?? item?.quantity ?? item?.totalUnits ?? 0) || 0,
    revenue: Number(item?.revenue ?? item?.sales ?? item?.totalSales ?? 0) || 0,
  }));
}

export async function fetchPeakHoursReport(
  branchId: string,
  fromDate: string,
  toDate: string
): Promise<PeakHourRow[]> {
  const params = new URLSearchParams();
  const fallbackToday = new Date().toISOString().split('T')[0];
  const effectiveFrom = fromDate || toDate || fallbackToday;
  const effectiveTo = toDate || fromDate || fallbackToday;

  const isoFrom = toIsoWithTimezone(effectiveFrom, false);
  const isoTo = toIsoWithTimezone(effectiveTo, true);

  if (isoFrom) params.append('from', isoFrom);
  if (isoTo) params.append('to', isoTo);

  const ids = branchId ? [branchId] : BRANCHES.map((b) => b.id);
  ids.forEach((id) => {
    if (id) params.append('branchIds', id);
  });

  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await apiRequest<any>(`/analytics/branches/peak-hours${query}`);

  const rawSlots = Array.isArray(data)
    ? data
    : Array.isArray(data?.slots)
      ? data.slots
      : Array.isArray(data?.peakHours)
        ? data.peakHours
        : Array.isArray(data?.branches)
          ? data.branches.flatMap((b: any) =>
              (Array.isArray(b?.slots) ? b.slots : extractArray<any>(b)).map(
                (slot: any) => ({
                  ...slot,
                  branchId: slot?.branchId ?? b?.branchId ?? b?.id,
                })
              )
            )
          : extractArray<any>(data);

  const filteredSlots = branchId
    ? rawSlots.filter(
        (slot: any) => !slot?.branchId || slot.branchId === branchId
      )
    : rawSlots;

  return filteredSlots.map((item: any, idx: number) => ({
    branchId: item?.branchId,
    hourLabel: String(
      item?.hourLabel ??
        item?.interval ??
        item?.hour ??
        item?.slot ??
        `Franja ${idx + 1}`
    ),
    orders:
      Number(item?.orders ?? item?.paidOrders ?? item?.ordersCount ?? 0) || 0,
    sales: Number(item?.sales ?? item?.totalSales ?? item?.revenue ?? 0) || 0,
  }));
}

export async function fetchBranchPerformanceReport(
  fromDate: string,
  toDate: string
): Promise<BranchPerformanceRow[]> {
  const query = buildDateQuery(fromDate, toDate);
  const data = await apiRequest<any>(`/analytics/branches/performance${query}`);
  const list = extractArray<any>(data);

  if (list.length === 0) {
    return BRANCHES.map((b) => ({
      branchId: b.id,
      branch: b.label,
      sales: 0,
      orders: 0,
      averageTicket: 0,
      diffVsAveragePct: 0,
      needsAttention: false,
    }));
  }

  return list.map((item, idx) => {
    const info = resolveBranchLabel(item, idx);
    return {
      branchId: info.branchId,
      branch: info.branch,
      sales: Number(item?.sales ?? item?.totalSales ?? item?.revenue ?? 0) || 0,
      orders:
        Number(item?.orders ?? item?.paidOrders ?? item?.ordersCount ?? 0) || 0,
      averageTicket:
        Number(item?.averageTicket ?? item?.avgTicket ?? 0) || 0,
      diffVsAveragePct:
        Number(
          item?.diffVsAveragePct ??
            item?.differencePct ??
            item?.variationPct ??
            0
        ) || 0,
      needsAttention: Boolean(
        item?.needsAttention ?? item?.requiresAttention ?? false
      ),
    };
  });
}