import { getBranches, request, type ApiError, type Branch } from './reviews-api';

export type RatingsDateRange = {
  dateFrom: string;
  dateTo: string;
} | null;

export type RatingsSummaryResult = {
  branchId: string;
  averageRating: number | null;
  reviewCount: number;
};

export type { ApiError, Branch };
export { getBranches };

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
    `/management/branches/${encodeURIComponent(branchId)}/ratings/summary${suffix}`,
    { signal },
  );
}
