export type ApiError = {
  code: string;
  message: string;
  field: string | null;
  status: number;
};

export type Receipt = {
  id: string;
  billId: string;
  number: string;
  createdAt: string;
  branchName: string | null;
};

export type ReceiptPage = {
  data: Receipt[];
  total: number;
  page: number;
  pageSize: number;
};

export type Bill = {
  id: string;
  orderIds: string[];
};

export type ReviewEligibility = {
  orderId: string;
  branchId: string;
  status: 'PENDING' | 'IN_PREPARATION' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
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

export const reviewsApi = {
  listReceipts: (page: number, signal?: AbortSignal) =>
    request<ReceiptPage>(`/me/receipts?page=${page}`, { signal }),
  getBill: (billId: string, signal?: AbortSignal) =>
    request<Bill>(`/bills/${encodeURIComponent(billId)}`, { signal }),
  getEligibility: (orderId: string, signal?: AbortSignal) =>
    request<ReviewEligibility>(`/orders/${encodeURIComponent(orderId)}/review-eligibility`, { signal }),
  createReview: (orderId: string, rating: number, comment?: string) =>
    request<CreatedReview>(`/orders/${encodeURIComponent(orderId)}/reviews`, {
      method: 'POST',
      body: JSON.stringify(comment === undefined ? { rating } : { rating, comment }),
    }),
};
