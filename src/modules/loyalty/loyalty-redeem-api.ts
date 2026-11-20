import { getLoyaltyBalance, type LoyaltyBalance } from './loyalty-balance-api';
import { USE_LOYALTY_MOCK } from './loyalty-config';

export type ApiError = {
  code: string;
  message: string;
  field: string | null;
  status: number;
};

// SUPUESTO: confirmar con el backend de Lealtad
export type LoyaltyRedeemRequest = {
  billId: string;
  benefitId: string;
};

// SUPUESTO: confirmar con el backend de Lealtad
export type LoyaltyRedemption = {
  id: string;
  billId: string;
  benefitId: string;
  pointsReserved: number;
  discountAmount: string;
  status: 'PENDING';
};

// SUPUESTO: confirmar con el backend de Lealtad
export type AvailableLoyaltyBenefit = {
  id: string;
  name: string;
  pointsRequired: number;
  discountAmount: string;
};

export type BenefitAvailability =
  | { available: true; data: AvailableLoyaltyBenefit[] }
  | { available: false; data: [] };

export type RedeemScreenData = {
  balance: LoyaltyBalance;
  benefits: BenefitAvailability;
};

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
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

const mockBenefits: AvailableLoyaltyBenefit[] = [
  { id: 'demo-benefit-2', name: 'Descuento $2', pointsRequired: 200, discountAmount: '2.00' },
  { id: 'demo-benefit-5', name: 'Descuento $5', pointsRequired: 450, discountAmount: '5.00' },
  { id: 'demo-benefit-15', name: 'Descuento $15', pointsRequired: 1500, discountAmount: '15.00' },
];

async function getRedeemScreenDataMock(signal?: AbortSignal): Promise<RedeemScreenData> {
  const [balance] = await Promise.all([
    getLoyaltyBalance(signal),
    mockDelay(signal),
  ]);
  return {
    balance,
    benefits: { available: true, data: mockBenefits.map(benefit => ({ ...benefit })) },
  };
}

export async function getRedeemScreenData(signal?: AbortSignal): Promise<RedeemScreenData> {
  if (USE_LOYALTY_MOCK) return getRedeemScreenDataMock(signal);
  return {
    balance: await getLoyaltyBalance(signal),
    benefits: { available: false, data: [] },
  };
}

async function redeemMock(input: LoyaltyRedeemRequest, signal?: AbortSignal): Promise<LoyaltyRedemption> {
  await mockDelay(signal);
  if (input.billId === 'demo-error') {
    throw {
      code: 'BILL_NOT_OPEN',
      message: 'Esta cuenta ya no admite beneficios.',
      field: null,
      status: 409,
    } satisfies ApiError;
  }
  const benefit = mockBenefits.find(item => item.id === input.benefitId);
  if (!benefit) {
    throw {
      code: 'NOT_FOUND',
      message: 'No se encontró el beneficio.',
      field: null,
      status: 404,
    } satisfies ApiError;
  }
  return {
    id: 'demo-redemption-1',
    billId: input.billId,
    benefitId: benefit.id,
    pointsReserved: benefit.pointsRequired,
    discountAmount: benefit.discountAmount,
    status: 'PENDING',
  };
}

export function redeemLoyaltyBenefit(
  input: LoyaltyRedeemRequest,
  signal?: AbortSignal,
): Promise<LoyaltyRedemption> {
  if (USE_LOYALTY_MOCK) return redeemMock(input, signal);
  return request<LoyaltyRedemption>('/api/loyalty/redeem', {
    method: 'POST',
    body: JSON.stringify(input),
    signal,
  });
}
