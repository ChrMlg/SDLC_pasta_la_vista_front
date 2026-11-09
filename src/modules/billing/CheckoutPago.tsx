import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import type { MenuSession } from '../menu/MenuApp';
import { request, type BillingRequestError } from './billing-api';

type Bill = {
  id: string;
  branchId: string;
  status: 'OPEN' | 'PAID' | 'CANCELLED';
  total: string;
};
type PaymentResult = {
  status: 'PAID' | 'FAILED';
  failureCode: string | null;
  receiptId: string | null;
};
type CheckoutPagoProps = {
  billId?: string;
  session?: MenuSession;
};
type PaymentFields = 'cardHolder' | 'cardNumber' | 'expMonth' | 'expYear' | 'cvv';
type FieldErrors = Partial<Record<PaymentFields, string>>;
type CheckoutNavigationState = { summary?: unknown; tableNumber?: number };

function isValidCardNumber(value: string) {
  if (!/^\d{16}$/.test(value)) return false;
  const checksum = [...value].reduce((sum, char, index) => {
    const digit = Number(char);
    const doubled = index % 2 === 0 ? digit * 2 : digit;
    return sum + (doubled > 9 ? doubled - 9 : doubled);
  }, 0);
  return checksum % 10 === 0;
}

function validatePayment(fields: { cardHolder: string; cardNumber: string; expMonth: string; expYear: string; cvv: string }): FieldErrors {
  const errors: FieldErrors = {};
  const holder = fields.cardHolder.trim();
  if (holder.length < 2 || holder.length > 80) errors.cardHolder = 'El nombre debe tener entre 2 y 80 caracteres.';
  if (!isValidCardNumber(fields.cardNumber)) errors.cardNumber = 'Ingresa un número de tarjeta válido.';

  const month = Number(fields.expMonth);
  const year = Number(fields.expYear);
  if (!/^\d{1,2}$/.test(fields.expMonth) || !Number.isInteger(month) || month < 1 || month > 12) {
    errors.expMonth = 'Ingresa un mes válido, del 1 al 12.';
  }
  if (!/^\d{4}$/.test(fields.expYear) || !Number.isInteger(year) || year < new Date().getUTCFullYear() || year > 9999) {
    errors.expYear = 'Ingresa un año de vencimiento válido.';
  } else if (!errors.expMonth && Date.UTC(year, month, 1) <= Date.now()) {
    errors.expMonth = 'La tarjeta está vencida.';
  }
  if (!/^\d{3}$/.test(fields.cvv)) errors.cvv = 'Ingresa un CVV de 3 dígitos.';
  return errors;
}

function paymentError(error: unknown) {
  if (error instanceof Error && 'failure' in error) {
    const failure = (error as BillingRequestError).failure;
    if (failure.status === 409 && failure.code === 'PAYMENT_IN_PROGRESS') return 'Ya hay un pago en proceso';
    if (failure.status === 409 && failure.code === 'BILL_ALREADY_PAID') return 'Esta cuenta ya fue pagada';
    if (failure.status === 401) return 'Inicia sesión para continuar';
    if (failure.status === 403) return 'No tiene permiso para cobrar en esta sucursal';
    if (failure.status === 404) return 'No se encontró la cuenta';
    return failure.message;
  }
  return error instanceof Error ? error.message : 'No se pudo completar el pago';
}

export function CheckoutPago({ billId: billIdProp, session }: CheckoutPagoProps) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const waiterNavigationState = location.state as CheckoutNavigationState | null;
  const billId = billIdProp ?? searchParams.get('billId') ?? '';
  const canPay = session?.role === 'CUSTOMER' || session?.role === 'WAITER';
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [paymentStatus, setPaymentStatus] = useState<PaymentResult['status'] | null>(null);
  const [receiptId, setReceiptId] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    setBill(null);
    setPaymentStatus(null);
    setReceiptId('');
    setFieldErrors({});
    if (!canPay) {
      setLoading(false);
      setError('');
      return () => { active = false; };
    }
    if (!billId) {
      setError('No se encontró el identificador de la cuenta.');
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError('');
    request<Bill>(`/bills/${encodeURIComponent(billId)}`)
      .then(data => { if (active) setBill(data); })
      .catch(cause => { if (active) setError(paymentError(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [billId, canPay]);

  async function pay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !billId) return;
    const validationErrors = validatePayment({ cardHolder, cardNumber, expMonth, expYear, cvv });
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    submitting.current = true;
    setSaving(true);
    setError('');
    setPaymentStatus(null);
    setReceiptId('');
    try {
      const result = await request<PaymentResult>(`/bills/${encodeURIComponent(billId)}/payments`, {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          cardHolder: cardHolder.trim(),
          cardNumber,
          expMonth: Number(expMonth),
          expYear: Number(expYear),
          cvv,
        }),
      });

      if (result.status === 'PAID') {
        setPaymentStatus('PAID');
        setReceiptId(result.receiptId ?? '');
        setBill(current => current ? { ...current, status: 'PAID' } : current);
      } else {
        setPaymentStatus('FAILED');
      }
    } catch (cause) {
      if (cause instanceof Error && 'failure' in cause) {
        const failure = (cause as BillingRequestError).failure;
        if (failure.status === 422 && failure.field && ['cardHolder', 'cardNumber', 'expMonth', 'expYear', 'cvv'].includes(failure.field)) {
          setFieldErrors(current => ({ ...current, [failure.field as PaymentFields]: failure.message }));
        } else {
          setError(paymentError(cause));
        }
      } else {
        setError(paymentError(cause));
      }
    } finally {
      submitting.current = false;
      setSaving(false);
      setCardNumber('');
      setCvv('');
    }
  }

  function clearFieldError(field: PaymentFields) {
    setFieldErrors(current => ({ ...current, [field]: undefined }));
  }

  const receiptPath = receiptId && session?.role === 'CUSTOMER'
    ? `/my-receipts/${receiptId}`
    : receiptId && bill
      ? `/branches/${bill.branchId}/receipts/${receiptId}`
      : '';
  const pdfPath = receiptId && session?.role === 'CUSTOMER'
    ? `/api/me/receipts/${encodeURIComponent(receiptId)}/pdf`
    : receiptId && bill
      ? `/api/branches/${encodeURIComponent(bill.branchId)}/receipts/${encodeURIComponent(receiptId)}/pdf`
      : '';

  if (!canPay) return <main className="shell billingPage">
    <h1>Checkout de pago</h1>
    <p role="alert" className="error">No tiene permiso para cobrar en esta sucursal</p>
  </main>;

  return <main className="shell billingPage">
    <p className="eyebrow">MÓDULO 6</p>
    <h1>Checkout de pago</h1>
    {loading && <p role="status">Cargando cuenta...</p>}
    {error && <p role="alert" className="error">{error}</p>}
    {bill && <>
      <section className="billingCard">
        <p>Total a pagar: <strong>${bill.total}</strong></p>
        {bill.status === 'OPEN' && <form className="form" onSubmit={pay} noValidate>
          <label>Nombre del titular
            <input autoComplete="cc-name" minLength={2} maxLength={80} required value={cardHolder}
              aria-invalid={Boolean(fieldErrors.cardHolder)} aria-describedby={fieldErrors.cardHolder ? 'cardHolder-error' : undefined}
              onChange={event => { setCardHolder(event.target.value); clearFieldError('cardHolder'); }} />
            {fieldErrors.cardHolder && <small id="cardHolder-error" className="fieldError">{fieldErrors.cardHolder}</small>}
          </label>
          <label>Número de tarjeta
            <input inputMode="numeric" autoComplete="cc-number" maxLength={16} required value={cardNumber}
              aria-invalid={Boolean(fieldErrors.cardNumber)} aria-describedby={fieldErrors.cardNumber ? 'cardNumber-error' : undefined}
              onChange={event => { setCardNumber(event.target.value.replace(/\D/g, '').slice(0, 16)); clearFieldError('cardNumber'); }} />
            {fieldErrors.cardNumber && <small id="cardNumber-error" className="fieldError">{fieldErrors.cardNumber}</small>}
          </label>
          <div className="billingExpiryFields">
            <label>Mes de vencimiento
              <input inputMode="numeric" autoComplete="cc-exp-month" maxLength={2} required value={expMonth}
                aria-invalid={Boolean(fieldErrors.expMonth)} aria-describedby={fieldErrors.expMonth ? 'expMonth-error' : undefined}
                onChange={event => { setExpMonth(event.target.value.replace(/\D/g, '').slice(0, 2)); clearFieldError('expMonth'); }} />
              {fieldErrors.expMonth && <small id="expMonth-error" className="fieldError">{fieldErrors.expMonth}</small>}
            </label>
            <label>Año de vencimiento
              <input inputMode="numeric" autoComplete="cc-exp-year" maxLength={4} required value={expYear}
                aria-invalid={Boolean(fieldErrors.expYear)} aria-describedby={fieldErrors.expYear ? 'expYear-error' : undefined}
                onChange={event => { setExpYear(event.target.value.replace(/\D/g, '').slice(0, 4)); clearFieldError('expYear'); }} />
              {fieldErrors.expYear && <small id="expYear-error" className="fieldError">{fieldErrors.expYear}</small>}
            </label>
          </div>
          <label>CVV
            <input inputMode="numeric" autoComplete="cc-csc" maxLength={3} required value={cvv}
              aria-invalid={Boolean(fieldErrors.cvv)} aria-describedby={fieldErrors.cvv ? 'cvv-error' : undefined}
              onChange={event => { setCvv(event.target.value.replace(/\D/g, '').slice(0, 3)); clearFieldError('cvv'); }} />
            {fieldErrors.cvv && <small id="cvv-error" className="fieldError">{fieldErrors.cvv}</small>}
          </label>
          <button type="submit" disabled={saving}>{saving ? 'Procesando pago...' : 'Pagar ahora'}</button>
        </form>}
        {bill.status === 'PAID' && !paymentStatus && <p role="status">Esta cuenta ya fue pagada</p>}
        {bill.status === 'CANCELLED' && <p role="alert" className="error">Esta cuenta no admite pagos</p>}
      </section>
      {paymentStatus === 'PAID' && <section className="billingCard">
        <p role="status" className="notice">Pago aprobado</p>
        {receiptPath && <div className="billingActions">
          <Link to={receiptPath}>Ver comprobante</Link>
          <a href={pdfPath} download>Descargar PDF</a>
        </div>}
        {session.role === 'WAITER' && <Link to={`/waiter/billing/${bill.id}`} state={{
          summary: waiterNavigationState?.summary,
          tableNumber: waiterNavigationState?.tableNumber,
          receiptId,
          paymentApproved: true,
        }}>
          Volver a la cuenta
        </Link>}
      </section>}
      {paymentStatus === 'FAILED' && <p role="alert" className="error">Pago rechazado. Revisa la tarjeta o usa otra</p>}
    </>}
  </main>;
}
