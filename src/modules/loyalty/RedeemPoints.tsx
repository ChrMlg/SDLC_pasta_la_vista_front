import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './loyalty-redeem.css';
import {
  getRedeemScreenData,
  redeemLoyaltyBenefit,
  type ApiError,
  type AvailableLoyaltyBenefit,
  type RedeemScreenData,
} from './loyalty-redeem-api';
import { USE_LOYALTY_MOCK } from './loyalty-config';

function apiError(error: unknown): Partial<ApiError> {
  if (typeof error !== 'object' || error === null) return {};
  return error as Partial<ApiError>;
}

function loadErrorMessage(error: unknown): string {
  const status = apiError(error).status;
  if (status === 401) return 'Inicie sesión para continuar.';
  if (status === 403) return 'No tiene permiso para ver esta pantalla.';
  return 'No se pudieron cargar tus puntos. Intente de nuevo.';
}

function redeemErrorMessage(error: unknown): string {
  const { status, code } = apiError(error);
  if (status === 401) return 'Inicie sesión para continuar.';
  if (status === 403) return 'No tiene permiso para ver esta pantalla.';
  if (status === 400 && code === 'INSUFFICIENT_POINTS')
    return 'No tienes puntos suficientes para este beneficio.';
  if (code === 'REDEMPTION_ALREADY_EXISTS') return 'Esta cuenta ya tiene un beneficio canjeado.';
  if (status === 422 && code === 'REDEMPTION_TOTAL_TOO_LOW') return 'El descuento no puede superar el total de la cuenta.';
  if (status === 409 && code === 'PAYMENT_IN_PROGRESS') return 'Ya hay un pago en proceso.';
  if (status === 409 && code === 'BILL_NOT_OPEN')
    return 'Esta cuenta ya no admite beneficios.';
  if (status === 404) return 'No se encontró la cuenta.';
  return 'No se pudo aplicar el beneficio. Intente de nuevo.';
}

function formatPoints(value: number): string {
  return new Intl.NumberFormat('es-GT').format(value);
}

function formatDiscount(value: string): string {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `$${new Intl.NumberFormat('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`
    : `$${value}`;
}

function PermissionError() {
  return <main className="shell">
    <p role="alert" className="error">No tiene permiso para ver esta pantalla.</p>
  </main>;
}

function CustomerRedeemPoints() {
  const [searchParams] = useSearchParams();
  const billId = searchParams.get('billId')?.trim() ?? '';
  const navigate = useNavigate();
  const [data, setData] = useState<RedeemScreenData | null>(null);
  const [loading, setLoading] = useState(Boolean(billId));
  const [retry, setRetry] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [selectedBenefit, setSelectedBenefit] = useState<AvailableLoyaltyBenefit | null>(null);
  const [redeemError, setRedeemError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const backButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!billId) {
      setData(null);
      setLoading(false);
      setLoadError('');
      return;
    }
    const controller = new AbortController();
    setData(null);
    setLoading(true);
    setLoadError('');
    getRedeemScreenData(controller.signal).then(setData).catch((cause: unknown) => {
      if (!controller.signal.aborted) setLoadError(loadErrorMessage(cause));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [billId, retry]);

  useEffect(() => {
    if (!selectedBenefit) return;
    const previous = document.activeElement;
    backButtonRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) {
        event.preventDefault();
        setSelectedBenefit(null);
        setRedeemError('');
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [selectedBenefit, submitting]);

  async function applyBenefit() {
    if (!billId || !selectedBenefit || submitting) return;
    setSubmitting(true);
    setRedeemError('');
    try {
      await redeemLoyaltyBenefit({ billId, benefitId: selectedBenefit.id });
      setSuccess(true);
      setSelectedBenefit(null);
    } catch (cause: unknown) {
      setRedeemError(redeemErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="shell loyaltyRedeemPage">
    {USE_LOYALTY_MOCK && <p className="loyaltyRedeemDemo" role="status">
      Modo demostración: datos de ejemplo, el backend de Lealtad aún no está conectado.
    </p>}
    <header className="loyaltyRedeemHeader">
      <div>
        <span className="eyebrow">LEALTAD</span>
        <h1>Canjear puntos</h1>
        <p>Aplica un beneficio como descuento en tu cuenta.</p>
      </div>
    </header>

    {!billId && <p role="alert" className="loyaltyRedeemMessage">
      Abre esta pantalla desde el pago de tu cuenta.
    </p>}
    {billId && loading && <p role="status">Cargando beneficios…</p>}
    {billId && loadError && <div className="loyaltyRedeemError">
      <p role="alert" className="error">{loadError}</p>
      <button type="button" disabled={loading} onClick={() => setRetry(value => value + 1)}>
        Reintentar
      </button>
    </div>}

    {billId && !loading && !loadError && data && <>
      <section className="loyaltyRedeemBalance" aria-label="Saldo de puntos">
        <span>Tu saldo</span>
        <p><strong>{formatPoints(data.balance.points)}</strong> puntos</p>
      </section>

      {data.benefits.available
        ? data.benefits.data.length === 0
          ? <p className="loyaltyRedeemMessage">Aún no hay beneficios disponibles.</p>
          : <section className="loyaltyRedeemBenefits" aria-labelledby="loyalty-redeem-benefits-title">
            <h2 id="loyalty-redeem-benefits-title">Beneficios disponibles</h2>
            <div className="loyaltyRedeemCards">{data.benefits.data.map(benefit => {
              const insufficient = benefit.pointsRequired > data.balance.points;
              return <article className="loyaltyRedeemCard" key={benefit.id}>
                <h3>{benefit.name}</h3>
                <p>{formatPoints(benefit.pointsRequired)} puntos requeridos</p>
                <strong>{formatDiscount(benefit.discountAmount)}</strong>
                {insufficient
                  ? <button type="button" disabled>Puntos insuficientes</button>
                  : <button type="button" disabled={submitting} onClick={() => {
                    setRedeemError('');
                    setSelectedBenefit(benefit);
                  }}>Elegir beneficio</button>}
              </article>;
            })}</div>
          </section>
        : <p role="alert" className="loyaltyRedeemMessage">
          No se pueden consultar los beneficios: falta un endpoint para listarlos.
        </p>}
    </>}

    {selectedBenefit && <div className="loyaltyRedeemBackdrop">
      <section className="loyaltyRedeemDialog" role="dialog" aria-modal="true"
        aria-labelledby="loyalty-redeem-dialog-title">
        <h2 id="loyalty-redeem-dialog-title">¿Aplicar este beneficio?</h2>
        <p className="loyaltyRedeemDetail">
          Se aplicará un descuento de {formatDiscount(selectedBenefit.discountAmount)} a tu cuenta.
          {' '}Tus puntos se descontarán cuando el pago se apruebe.
        </p>
        {redeemError && <p role="alert" className="error">{redeemError}</p>}
        <div className="loyaltyRedeemActions">
          <button ref={backButtonRef} type="button" className="secondaryButton"
            disabled={submitting} onClick={() => {
              setSelectedBenefit(null);
              setRedeemError('');
            }}>Volver</button>
          <button type="button" disabled={submitting} onClick={() => void applyBenefit()}>
            {submitting ? 'Aplicando…' : 'Aplicar beneficio'}
          </button>
        </div>
      </section>
    </div>}

    {redeemError && !selectedBenefit && <p role="alert" className="error">{redeemError}</p>}
    {success && <section className="loyaltyRedeemSuccess" role="status">
      <p>Beneficio aplicado. Se descontará de tus puntos cuando el pago se apruebe.</p>
      <Link to="/" onClick={event => {
        event.preventDefault();
        navigate(-1);
      }}>Volver al pago</Link>
    </section>}
  </main>;
}

export function RedeemPoints({ role }: { role: string }) {
  if (role !== 'CUSTOMER') return <PermissionError />;
  return <CustomerRedeemPoints />;
}
