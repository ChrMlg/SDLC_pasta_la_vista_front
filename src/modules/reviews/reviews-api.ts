import { getBranches, type Branch } from '../inventory/inventory-api';

export type ApiError = {
  code: string;
  message: string;
  field: string | null;
  status: number;
};

export type ReceiptListItem = {
  id: string;
  billId?: string;
  number: string;
  createdAt?: string;
  issuedAt: string;
  branchName: string | null;
  total: string;
};

export type ReceiptPage = {
  data: ReceiptListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type ReceiptDetail = {
  id: string;
  billId: string;
  branchId: string;
  number: string;
  issuedAt: string;
  createdAt: string;
};

export type BillReviewInfo = {
  id: string;
  orderIds: string[];
};

export type ReviewEligibility = {
  orderId: string;
  branchId: string;
  status: string;
  deliveredAt: string | null;
  canReview: boolean;
  reason: string | null;
};

export type CreatedReview = {
  id: string;
  orderId: string;
  clientId: string;
  branchId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
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

export { getBranches };
export type { Branch };

export function getMyReceipts(page: number, signal?: AbortSignal): Promise<ReceiptPage> {
  return request<ReceiptPage>(`/me/receipts?page=${page}`, { signal });
}

export function getMyReceipt(receiptId: string, signal?: AbortSignal): Promise<ReceiptDetail> {
  return request<ReceiptDetail>(`/me/receipts/${encodeURIComponent(receiptId)}`, { signal });
}

export function getBillReviewInfo(billId: string, signal?: AbortSignal): Promise<BillReviewInfo> {
  return request<BillReviewInfo>(`/bills/${encodeURIComponent(billId)}`, { signal });
}

export function getReviewEligibility(orderId: string, signal?: AbortSignal): Promise<ReviewEligibility> {
  return request<ReviewEligibility>(
    `/orders/${encodeURIComponent(orderId)}/review-eligibility`,
    { signal },
  );
}

export function createReview(
  orderId: string,
  input: { rating: number; comment?: string },
): Promise<CreatedReview> {
  return request<CreatedReview>(`/orders/${encodeURIComponent(orderId)}/reviews`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
