import { USE_LOYALTY_MOCK } from './loyalty-config';

export type ApiError = {
  code: string;
  message: string;
  field: string | null;
  status: number;
};

// SUPUESTO: confirmar con el backend de Lealtad
export type LoyaltyRules = {
  conversionRate: number;
};

// SUPUESTO: confirmar con el backend de Lealtad
export type LoyaltyBenefitInput = {
  name: string;
  pointsRequired: number;
  discountAmount: number;
};

// SUPUESTO: confirmar con el backend de Lealtad
export type LoyaltyBenefitResponse = {
  id: string;
};

// SUPUESTO: no hay GET de beneficios; esta forma combina el cuerpo creado y el id de respuesta
export type LoyaltyBenefit = LoyaltyBenefitInput & LoyaltyBenefitResponse;

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

function mockDelay(): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, 450));
}

let nextMockBenefitId = 1;

async function saveLoyaltyRulesMock(rules: LoyaltyRules): Promise<LoyaltyRules> {
  await mockDelay();
  return { ...rules };
}

async function createLoyaltyBenefitMock(input: LoyaltyBenefitInput): Promise<LoyaltyBenefitResponse> {
  await mockDelay();
  if (input.name.trim().toLowerCase() === 'error') {
    throw {
      code: 'VALIDATION_ERROR',
      message: 'El nombre no es válido.',
      field: 'name',
      status: 400,
    } satisfies ApiError;
  }
  return { id: `mock-benefit-${nextMockBenefitId++}` };
}

export function saveLoyaltyRules(rules: LoyaltyRules): Promise<LoyaltyRules> {
  if (USE_LOYALTY_MOCK) return saveLoyaltyRulesMock(rules);
  return request<LoyaltyRules>('/api/management/loyalty/rules', {
    method: 'PUT',
    body: JSON.stringify(rules),
  });
}

export function createLoyaltyBenefit(input: LoyaltyBenefitInput): Promise<LoyaltyBenefitResponse> {
  if (USE_LOYALTY_MOCK) return createLoyaltyBenefitMock(input);
  return request<LoyaltyBenefitResponse>('/api/management/loyalty/benefits', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
