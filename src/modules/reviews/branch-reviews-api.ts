import { request } from './reviews-api';

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

export function getBranchReviews(
  branchId: string,
  page: number,
  rating?: number,
  signal?: AbortSignal,
): Promise<BranchReviewsPage> {
  const query = new URLSearchParams({ page: String(page) });
  if (rating !== undefined) query.set('rating', String(rating));
  return request<BranchReviewsPage>(
    `/branches/${encodeURIComponent(branchId)}/reviews?${query.toString()}`,
    { signal },
  );
}
