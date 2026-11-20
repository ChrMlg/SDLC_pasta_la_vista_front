import { useState, type FormEvent } from 'react';
import './loyalty-rules.css';
import {
  createLoyaltyBenefit,
  saveLoyaltyRules,
  type ApiError,
  type LoyaltyBenefit,
  type LoyaltyBenefitInput,
} from './loyalty-rules-api';
import { USE_LOYALTY_MOCK } from './loyalty-config';

type SavingAction = 'rules' | 'benefit' | null;

function positiveDecimal(value: string): boolean {
  const normalized = value.trim();
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(normalized)) return false;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0;
}

function positiveInteger(value: string): boolean {
  return /^\d+$/.test(value.trim()) && Number(value) > 0;
}

function getApiError(error: unknown): Partial<ApiError> {
  if (typeof error !== 'object' || error === null) return {};
  const value = error as Partial<ApiError>;
  return value;
}

function requestErrorMessage(status: number | undefined): string {
  if (status === 401) return 'Inicie sesión para continuar.';
  if (status === 403) return 'No tiene permiso para configurar el programa de lealtad.';
  return 'No se pudo guardar. Intente de nuevo.';
}

function formatDiscount(value: number): string {
  return `$${new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export function LoyaltyRules({ role }: { role: string }) {
  const [conversionRate, setConversionRate] = useState(USE_LOYALTY_MOCK ? '1' : '');
  const [conversionRateError, setConversionRateError] = useState('');
  const [rulesError, setRulesError] = useState('');
  const [rulesSuccess, setRulesSuccess] = useState('');
  const [name, setName] = useState('');
  const [pointsRequired, setPointsRequired] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [benefitErrors, setBenefitErrors] = useState({
    name: '',
    pointsRequired: '',
    discountAmount: '',
  });
  const [benefitError, setBenefitError] = useState('');
  const [benefitSuccess, setBenefitSuccess] = useState('');
  const [benefits, setBenefits] = useState<LoyaltyBenefit[]>([]);
  const [saving, setSaving] = useState<SavingAction>(null);

  if (role !== 'GENERAL_MANAGER') {
    return <main className="shell">
      <p role="alert" className="error">No tiene permiso para ver esta pantalla.</p>
    </main>;
  }

  async function submitRules(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRulesError('');
    setRulesSuccess('');
    if (!positiveDecimal(conversionRate)) {
      setConversionRateError('La tasa debe ser mayor a 0.');
      return;
    }

    setConversionRateError('');
    setSaving('rules');
    try {
      await saveLoyaltyRules({ conversionRate: Number(conversionRate) });
      setRulesSuccess('Tasa guardada');
    } catch (cause: unknown) {
      const apiError = getApiError(cause);
      if ((apiError.status === 400 || apiError.status === 422)
        && apiError.field === 'conversionRate' && apiError.message) {
        setConversionRateError(apiError.message);
      } else {
        setRulesError(requestErrorMessage(apiError.status));
      }
    } finally {
      setSaving(null);
    }
  }

  async function submitBenefit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBenefitError('');
    setBenefitSuccess('');
    const errors = {
      name: name.trim().length < 1 || name.trim().length > 80
        ? 'Ingrese un nombre de 1 a 80 caracteres.' : '',
      pointsRequired: positiveInteger(pointsRequired)
        ? '' : 'Los puntos requeridos deben ser un entero mayor a 0.',
      discountAmount: positiveDecimal(discountAmount)
        ? '' : 'El descuento debe ser mayor a 0.',
    };
    setBenefitErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    const input: LoyaltyBenefitInput = {
      name: name.trim(),
      pointsRequired: Number(pointsRequired),
      discountAmount: Number(discountAmount),
    };
    setSaving('benefit');
    try {
      const response = await createLoyaltyBenefit(input);
      setBenefits(current => [...current, { ...input, id: response.id }]);
      setName('');
      setPointsRequired('');
      setDiscountAmount('');
      setBenefitErrors({ name: '', pointsRequired: '', discountAmount: '' });
      setBenefitSuccess('Beneficio agregado');
    } catch (cause: unknown) {
      const apiError = getApiError(cause);
      if ((apiError.status === 400 || apiError.status === 422)
        && apiError.message && ['name', 'pointsRequired', 'discountAmount'].includes(apiError.field ?? '')) {
        setBenefitErrors(current => ({
          ...current,
          [apiError.field as 'name' | 'pointsRequired' | 'discountAmount']: apiError.message!,
        }));
      } else {
        setBenefitError(requestErrorMessage(apiError.status));
      }
    } finally {
      setSaving(null);
    }
  }

  return <main className="shell loyaltyRulesPage">
    {USE_LOYALTY_MOCK && <p className="loyaltyRulesDemo" role="status">
      Modo demostración: datos de ejemplo, el backend de Lealtad aún no está conectado.
    </p>}
    <header className="loyaltyRulesHeader">
      <div>
        <span className="eyebrow">LEALTAD</span>
        <h1>Programa de lealtad</h1>
        <p>Define cuántos puntos ganan tus clientes y qué beneficios pueden canjear.</p>
      </div>
    </header>

    <section className="loyaltyRulesCard" aria-labelledby="loyalty-rate-title">
      <h2 id="loyalty-rate-title">Tasa de conversión</h2>
      <form className="loyaltyRulesForm" noValidate onSubmit={submitRules}>
        <label htmlFor="loyalty-conversion-rate">Puntos por cada $1 pagado</label>
        <input id="loyalty-conversion-rate" type="number" min="0" step="0.01"
          value={conversionRate} aria-invalid={Boolean(conversionRateError)}
          aria-describedby={conversionRateError ? 'loyalty-rate-error' : undefined}
          onChange={event => {
            setConversionRate(event.target.value);
            setConversionRateError('');
            setRulesError('');
            setRulesSuccess('');
          }} />
        {conversionRateError && <small id="loyalty-rate-error" className="loyaltyRulesFieldError" role="alert">
          {conversionRateError}
        </small>}
        {rulesError && <p role="alert" className="error">{rulesError}</p>}
        {rulesSuccess && <p role="status" className="loyaltyRulesSuccess">{rulesSuccess}</p>}
        <button type="submit" disabled={saving !== null}>
          {saving === 'rules' ? 'Guardando…' : 'Guardar tasa'}
        </button>
      </form>
    </section>

    <section className="loyaltyRulesCard" aria-labelledby="loyalty-benefits-title">
      <h2 id="loyalty-benefits-title">Beneficios</h2>
      <form className="loyaltyRulesForm" noValidate onSubmit={submitBenefit}>
        <label htmlFor="loyalty-benefit-name">Nombre</label>
        <input id="loyalty-benefit-name" type="text" minLength={1} maxLength={80}
          value={name} aria-invalid={Boolean(benefitErrors.name)}
          aria-describedby={benefitErrors.name ? 'loyalty-name-error' : undefined}
          onChange={event => {
            setName(event.target.value);
            setBenefitErrors(current => ({ ...current, name: '' }));
            setBenefitError('');
            setBenefitSuccess('');
          }} />
        {benefitErrors.name && <small id="loyalty-name-error" className="loyaltyRulesFieldError" role="alert">
          {benefitErrors.name}
        </small>}

        <label htmlFor="loyalty-benefit-points">Puntos requeridos</label>
        <input id="loyalty-benefit-points" type="number" min="1" step="1"
          value={pointsRequired} aria-invalid={Boolean(benefitErrors.pointsRequired)}
          aria-describedby={benefitErrors.pointsRequired ? 'loyalty-points-error' : undefined}
          onChange={event => {
            setPointsRequired(event.target.value);
            setBenefitErrors(current => ({ ...current, pointsRequired: '' }));
            setBenefitError('');
            setBenefitSuccess('');
          }} />
        {benefitErrors.pointsRequired && <small id="loyalty-points-error" className="loyaltyRulesFieldError" role="alert">
          {benefitErrors.pointsRequired}
        </small>}

        <label htmlFor="loyalty-benefit-discount">Descuento en dólares</label>
        <input id="loyalty-benefit-discount" type="number" min="0" step="0.01"
          value={discountAmount} aria-invalid={Boolean(benefitErrors.discountAmount)}
          aria-describedby={benefitErrors.discountAmount ? 'loyalty-discount-error' : undefined}
          onChange={event => {
            setDiscountAmount(event.target.value);
            setBenefitErrors(current => ({ ...current, discountAmount: '' }));
            setBenefitError('');
            setBenefitSuccess('');
          }} />
        {benefitErrors.discountAmount && <small id="loyalty-discount-error" className="loyaltyRulesFieldError" role="alert">
          {benefitErrors.discountAmount}
        </small>}
        {benefitError && <p role="alert" className="error">{benefitError}</p>}
        {benefitSuccess && <p role="status" className="loyaltyRulesSuccess">{benefitSuccess}</p>}
        <button type="submit" disabled={saving !== null}>
          {saving === 'benefit' ? 'Guardando…' : 'Agregar beneficio'}
        </button>
      </form>

      <div className="loyaltyBenefitsList">
        <h3>Beneficios agregados en esta sesión</h3>
        {benefits.length === 0
          ? <p className="loyaltyBenefitsEmpty">Aún no has agregado beneficios.</p>
          : <ul>{benefits.map(benefit => <li key={benefit.id}>
            <strong>{benefit.name}</strong>
            <span>{benefit.pointsRequired} puntos</span>
            <span>{formatDiscount(benefit.discountAmount)}</span>
          </li>)}</ul>}
      </div>
    </section>
  </main>;
}
