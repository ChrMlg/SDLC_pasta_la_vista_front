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

function toNumber(val: unknown, fallback = 0): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : fallback;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]+/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function extractReportList(data: any, candidateKeys: string[]): any[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];

  for (const key of candidateKeys) {
    if (Array.isArray(data[key])) {
      return data[key];
    }
  }

  if (data.data && typeof data.data === 'object') {
    if (Array.isArray(data.data)) return data.data;
    for (const key of candidateKeys) {
      if (Array.isArray(data.data[key])) {
        return data.data[key];
      }
    }
  }

  return extractArray<any>(data);
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
    rawBranch?.branchId ||
    rawBranch?.id ||
    rawBranch?.branch?.id ||
    BRANCHES[fallbackIndex]?.id ||
    '';
  const matchedById = BRANCHES.find((b) => b.id === candidateId);

  const cleanRawName = String(
    rawBranch?.branch ||
      rawBranch?.branchName ||
      rawBranch?.name ||
      rawBranch?.branch?.name ||
      ''
  )
    .replace(/^Bistro\s+/i, '')
    .trim();

  const lowerName = cleanRawName.toLowerCase();

  const matchedByName = BRANCHES.find(
    (b) =>
      b.label.toLowerCase() === lowerName ||
      b.key.toLowerCase() === lowerName ||
      lowerName.includes(b.key.toLowerCase()) ||
      lowerName.includes(b.label.toLowerCase())
  );

  const resolved = matchedById || matchedByName;
  return {
    branchId: resolved?.id || candidateId || `branch-${fallbackIndex}`,
    branch:
      resolved?.label || cleanRawName || `Sucursal ${fallbackIndex + 1}`,
  };
}

function mapBranchSalesList(data: any): BranchSalesRow[] {
  const list = extractReportList(data, [
    'metrics',
    'branches',
    'comparison',
    'items',
    'results',
    'rows',
  ]);

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
    const src = item?.metrics || item?.summary || item;
    const sales = toNumber(
      src?.sales ??
        src?.totalSales ??
        src?.revenue ??
        src?.totalRevenue ??
        src?.amount ??
        item?.sales ??
        item?.totalSales ??
        item?.revenue,
      0
    );
    const orders = toNumber(
      src?.orders ??
        src?.paidOrders ??
        src?.ordersCount ??
        src?.orderCount ??
        src?.paidCount ??
        src?.count ??
        item?.orders ??
        item?.paidOrders ??
        item?.ordersCount,
      0
    );

    return {
      branchId: info.branchId,
      branch: info.branch,
      sales,
      orders,
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
  const list = extractReportList(data, [
    'dishes',
    'topDishes',
    'items',
    'results',
    'rows',
  ]);

  return list.slice(0, numericLimit).map((item, idx) => ({
    rank: toNumber(item?.rank ?? item?.position, idx + 1) || idx + 1,
    itemId: String(
      item?.itemId ?? item?.menuItemId ?? item?.dishId ?? item?.id ?? idx
    ),
    name: String(
      item?.name ?? item?.dishName ?? item?.menuItemName ?? 'Platillo'
    ),
    category: String(item?.category ?? item?.categoryName ?? ''),
    units: toNumber(
      item?.units ??
        item?.unitsSold ??
        item?.quantity ??
        item?.totalQuantity ??
        item?.totalUnits ??
        item?.soldCount ??
        item?.ordersCount ??
        item?.count,
      0
    ),
    revenue: toNumber(
      item?.revenue ??
        item?.sales ??
        item?.totalSales ??
        item?.totalRevenue ??
        item?.amount,
      0
    ),
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
        : Array.isArray(data?.intervals)
          ? data.intervals
          : Array.isArray(data?.buckets)
            ? data.buckets
            : Array.isArray(data?.branches)
              ? data.branches.flatMap((b: any) =>
                  (
                    Array.isArray(b?.slots)
                      ? b.slots
                      : Array.isArray(b?.peakHours)
                        ? b.peakHours
                        : Array.isArray(b?.intervals)
                          ? b.intervals
                          : extractArray<any>(b)
                  ).map((slot: any) => ({
                    ...slot,
                    branchId: slot?.branchId ?? b?.branchId ?? b?.id,
                  }))
                )
              : extractReportList(data, ['items', 'results', 'rows']);

  const filteredSlots = branchId
    ? rawSlots.filter(
        (slot: any) => !slot?.branchId || slot.branchId === branchId
      )
    : rawSlots;

  return filteredSlots.map((item: any, idx: number) => {
    const label =
      item?.hourLabel ??
      item?.interval ??
      item?.timeRange ??
      item?.range ??
      item?.label ??
      item?.slot ??
      (item?.hour !== undefined && item?.hour !== null
        ? `${String(item.hour).padStart(2, '0')}:00`
        : undefined) ??
      `Franja ${idx + 1}`;

    return {
      branchId: item?.branchId,
      hourLabel: String(label),
      orders: toNumber(
        item?.orders ??
          item?.paidOrders ??
          item?.ordersCount ??
          item?.orderCount ??
          item?.count ??
          item?.totalOrders,
        0
      ),
      sales: toNumber(
        item?.sales ??
          item?.totalSales ??
          item?.revenue ??
          item?.totalRevenue ??
          item?.amount,
        0
      ),
    };
  });
}

export async function fetchBranchPerformanceReport(
  fromDate: string,
  toDate: string
): Promise<BranchPerformanceRow[]> {
  const query = buildDateQuery(fromDate, toDate);
  const data = await apiRequest<any>(`/analytics/branches/performance${query}`);
  const list = extractReportList(data, [
    'branches',
    'performance',
    'metrics',
    'items',
    'results',
    'rows',
  ]);

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

  const mapped = list.map((item, idx) => {
    const info = resolveBranchLabel(item, idx);
    const sales = toNumber(
      item?.sales ??
        item?.totalSales ??
        item?.revenue ??
        item?.totalRevenue ??
        item?.amount,
      0
    );
    const orders = toNumber(
      item?.orders ??
        item?.paidOrders ??
        item?.ordersCount ??
        item?.orderCount ??
        item?.paidCount ??
        item?.count,
      0
    );
    const averageTicket = toNumber(
      item?.averageTicket ?? item?.avgTicket ?? item?.ticketPromedio,
      orders > 0 ? sales / orders : 0
    );
    const rawDiff =
      item?.diffVsAveragePct ??
      item?.differencePct ??
      item?.variationPct ??
      item?.variancePct ??
      item?.deviationPct ??
      item?.diffPct;

    return {
      branchId: info.branchId,
      branch: info.branch,
      sales,
      orders,
      averageTicket,
      hasExplicitDiff: rawDiff !== undefined && rawDiff !== null,
      diffVsAveragePct: toNumber(rawDiff, 0),
      needsAttention: Boolean(
        item?.needsAttention ?? item?.requiresAttention ?? false
      ),
    };
  });

  const explicitAvg =
    data?.averageSales ?? data?.avgSales ?? data?.chainAverage ?? null;
  const computedAvg =
    explicitAvg !== null && explicitAvg !== undefined
      ? toNumber(explicitAvg, 0)
      : mapped.length > 0
        ? mapped.reduce((acc, r) => acc + r.sales, 0) / mapped.length
        : 0;

  return mapped.map((row) => {
    const diff = row.hasExplicitDiff
      ? row.diffVsAveragePct
      : computedAvg > 0
        ? ((row.sales - computedAvg) / computedAvg) * 100
        : 0;

    return {
      branchId: row.branchId,
      branch: row.branch,
      sales: row.sales,
      orders: row.orders,
      averageTicket: row.averageTicket,
      diffVsAveragePct: diff,
      needsAttention: row.needsAttention || diff < -20,
    };
  });
}