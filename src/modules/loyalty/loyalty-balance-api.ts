import { USE_LOYALTY_MOCK } from './loyalty-config';

export type ApiError = {
  code: string;
  message: string;
  field: string | null;
  status: number;
};

// SUPUESTO: confirmar con el backend de Lealtad
export type LoyaltyBalance = {
  points: number;
  reservedPoints?: number;
  availableBalance?: number;
};

// SUPUESTO: confirmar con el backend de Lealtad
export type LoyaltyTransactionType = 'EARNED' | 'REDEEMED';

// SUPUESTO: confirmar con el backend de Lealtad
export type LoyaltyTransaction = {
  id: string;
  type: LoyaltyTransactionType;
  points: number;
  description: string;
  createdAt: string;
};

// SUPUESTO: confirmar con el backend de Lealtad
export type LoyaltyHistory = {
  data: LoyaltyTransaction[];
  total: number;
  page: number;
  pageSize: number;
};

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { credentials: 'include', signal });
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

const mockTransactions: LoyaltyTransaction[] = [
  { id: 'tx-14', type: 'EARNED', points: 120, description: 'Pedido #1048', createdAt: '2026-11-19T18:35:00Z' },
  { id: 'tx-13', type: 'REDEEMED', points: 300, description: 'Canje de postre', createdAt: '2026-11-18T20:10:00Z' },
  { id: 'tx-12', type: 'EARNED', points: 85, description: 'Pedido #1032', createdAt: '2026-11-17T13:22:00Z' },
  { id: 'tx-11', type: 'EARNED', points: 160, description: 'Pedido #1019', createdAt: '2026-11-15T19:45:00Z' },
  { id: 'tx-10', type: 'REDEEMED', points: 200, description: 'Canje de bebida', createdAt: '2026-11-14T17:05:00Z' },
  { id: 'tx-9', type: 'EARNED', points: 95, description: 'Pedido #998', createdAt: '2026-11-12T21:15:00Z' },
  { id: 'tx-8', type: 'EARNED', points: 110, description: 'Pedido #976', createdAt: '2026-11-10T12:40:00Z' },
  { id: 'tx-7', type: 'REDEEMED', points: 150, description: 'Canje de entrada', createdAt: '2026-11-08T19:30:00Z' },
  { id: 'tx-6', type: 'EARNED', points: 130, description: 'Pedido #951', createdAt: '2026-11-06T14:12:00Z' },
  { id: 'tx-5', type: 'EARNED', points: 75, description: 'Pedido #930', createdAt: '2026-11-04T20:55:00Z' },
  { id: 'tx-4', type: 'REDEEMED', points: 250, description: 'Canje de platillo', createdAt: '2026-11-02T18:20:00Z' },
  { id: 'tx-3', type: 'EARNED', points: 180, description: 'Pedido #904', createdAt: '2026-10-30T13:05:00Z' },
  { id: 'tx-2', type: 'EARNED', points: 90, description: 'Pedido #887', createdAt: '2026-10-27T19:50:00Z' },
  { id: 'tx-1', type: 'REDEEMED', points: 100, description: 'Canje de café', createdAt: '2026-10-24T16:25:00Z' },
];

function mockDelay(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, 450);
    const abort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Request aborted', 'AbortError'));
    };
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
  });
}

async function getBalanceMock(signal?: AbortSignal): Promise<LoyaltyBalance> {
  await mockDelay(signal);
  return { points: 1250 };
}

async function getHistoryMock(page: number, signal?: AbortSignal): Promise<LoyaltyHistory> {
  await mockDelay(signal);
  const pageSize = 10;
  const start = (page - 1) * pageSize;
  return {
    data: mockTransactions.slice(start, start + pageSize),
    total: mockTransactions.length,
    page,
    pageSize,
  };
}

export function getLoyaltyBalance(signal?: AbortSignal): Promise<LoyaltyBalance> {
  if (USE_LOYALTY_MOCK) return getBalanceMock(signal);
  return request<{ balance: number; reservedPoints: number; availableBalance: number }>(
    '/api/me/loyalty/balance',
    signal,
  ).then(data => ({
    points: data.balance,
    reservedPoints: data.reservedPoints,
    availableBalance: data.availableBalance,
  }));
}

export function getLoyaltyHistory(page: number, signal?: AbortSignal): Promise<LoyaltyHistory> {
  if (USE_LOYALTY_MOCK) return getHistoryMock(page, signal);
  const query = new URLSearchParams({ page: String(page) });
  return request<{
    data: Array<{
      id: string;
      type: 'EARN' | 'REDEEM';
      points: number;
      createdAt: string;
      orderId: string | null;
      paymentId: string | null;
      redemptionId: string | null;
      benefitName?: string;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }>(`/api/me/loyalty/history?${query}`, signal).then(result => ({
    data: result.data.map(row => ({
      id: row.id,
      type: row.type === 'EARN' ? 'EARNED' : 'REDEEMED',
      points: row.type === 'REDEEM' ? -Math.abs(row.points) : Math.abs(row.points),
      description: row.type === 'REDEEM'
        ? `Canje: ${row.benefitName ?? 'beneficio'}`
        : 'Puntos por compra',
      createdAt: row.createdAt,
    })),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  }));
}
