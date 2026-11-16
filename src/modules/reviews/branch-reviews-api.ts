import type { ApiError } from './ratings-api';

export type BranchReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type BranchReviewsPage = {
  data: BranchReview[];
  total: number;
  page: number;
  pageSize: number;
};

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

export function getBranchReviews(
  branchId: string,
  page: number,
  rating?: number,
  signal?: AbortSignal,
): Promise<BranchReviewsPage> {
  const query = new URLSearchParams({ page: String(page) });
  if (rating !== undefined) query.set('rating', String(rating));
  return request<BranchReviewsPage>(
    `/api/branches/${encodeURIComponent(branchId)}/reviews?${query.toString()}`,
    signal,
  );
}
