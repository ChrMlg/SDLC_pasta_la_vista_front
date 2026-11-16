import { getBranches, type ApiError, type Branch } from '../inventory/inventory-api';

export type { ApiError, Branch };

export type RatingsSummaryResult = {
  branchId: string;
  averageRating: number | null;
  reviewCount: number;
};

export type RatingsDateRange = {
  dateFrom: string;
  dateTo: string;
} | null;

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    signal,
  });
  const body = await response.json().catch(() => null) as Partial<ApiError> | null;
  if (!response.ok) {
    throw {
      code: body?.code ?? 'HTTP_ERROR',
      message: body?.message ?? 'No se pudo completar la operación',
      field: body?.field ?? null,
      status: response.status,
    } satisfies ApiError;
  }
  return body as T;
}

export function getRatingsSummary(
  branchId: string,
  dateRange: RatingsDateRange,
  signal?: AbortSignal,
): Promise<RatingsSummaryResult> {
  const query = new URLSearchParams();
  if (dateRange) {
    query.set('dateFrom', dateRange.dateFrom);
    query.set('dateTo', dateRange.dateTo);
  }
  const suffix = query.size ? `?${query.toString()}` : '';
  return request<RatingsSummaryResult>(
    `/api/management/branches/${encodeURIComponent(branchId)}/ratings/summary${suffix}`,
    signal,
  );
}

export { getBranches };
