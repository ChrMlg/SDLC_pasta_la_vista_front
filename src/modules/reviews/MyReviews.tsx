import { useEffect, useRef, useState } from 'react';
import { ReviewDialog } from './ReviewDialog';
import { reviewsApi, type ApiError, type Receipt, type ReceiptPage, type ReviewEligibility } from './reviews-api';
import './reviews.css';

type ReviewField = 'rating' | 'comment';
type ReviewStatus =
  | { kind: 'checking' }
  | { kind: 'eligible'; eligibility: ReviewEligibility }
  | { kind: 'unavailable'; message: string }
  | { kind: 'reviewed'; message: string };
type ReviewOrder = {
  orderId: string;
  receipt: Receipt;
  status: ReviewStatus;
};

async function mapWithLimit<T, R>(values: T[], limit: number, work: (value: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await work(values[index]);
    }
  }));
  return results;
}

function apiError(error: unknown): Partial<ApiError> {
  return error && typeof error === 'object' ? error as Partial<ApiError> : {};
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

function eligibilityErrorMessage(error: unknown): string {
  const failure = apiError(error);
  if (failure.status === 401) return 'Inicie sesión para continuar.';
  if (failure.status === 403 || failure.status === 404) return 'No se pudo calificar este pedido.';
  if (failure.code === 'ORDER_NOT_LINKED') return 'Este pedido no está vinculado a tu cuenta.';
  return failure.message ?? 'No se pudo verificar si puedes calificar este pedido.';
}

function MyReviewsPermissionError() {
  return <main className="shell"><p role="alert" className="error">No tiene permiso para ver esta pantalla.</p></main>;
}

export function MyReviews({ role = 'CUSTOMER' }: { role?: string } = {}) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ReceiptPage | null>(null);
  const [orders, setOrders] = useState<ReviewOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<ReviewOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ReviewField, string>>>({});
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setLoadError('');
    setResult(null);
    setOrders([]);
    setNotice('');

    async function load() {
      try {
        const pageResult = await reviewsApi.listReceipts(page, controller.signal);
        const receiptOrders = await mapWithLimit(pageResult.data, 3, async receipt => {
          const bill = await reviewsApi.getBill(receipt.billId, controller.signal);
          return bill.orderIds.map(orderId => ({ orderId, receipt, status: { kind: 'checking' } as const }));
        });
        const initialOrders = receiptOrders.flat();
        if (!active) return;
        setResult(pageResult);
        setOrders(initialOrders);
        setLoading(false);

        await mapWithLimit(initialOrders, 3, async order => {
          try {
            const eligibility = await reviewsApi.getEligibility(order.orderId, controller.signal);
            if (active) {
              setOrders(current => current.map(item => item.orderId === order.orderId
                ? { ...item, status: { kind: 'eligible', eligibility } }
                : item));
            }
          } catch (error) {
            if (active && !controller.signal.aborted) {
              setOrders(current => current.map(item => item.orderId === order.orderId
                ? { ...item, status: { kind: 'unavailable', message: eligibilityErrorMessage(error) } }
                : item));
            }
          }
        });
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        setLoadError(apiError(error).status === 401
          ? 'Inicie sesión para continuar.'
          : 'No se pudieron cargar tus pedidos. Intente de nuevo.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [page, refresh]);

  async function submitReview(rating: number, comment?: string) {
    if (!selected || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setDialogError('');
    setFieldErrors({});
    try {
      await reviewsApi.createReview(selected.orderId, rating, comment);
      setOrders(current => current.map(order => order.orderId === selected.orderId
        ? { ...order, status: { kind: 'reviewed', message: 'Ya calificaste este pedido.' } }
        : order));
      setNotice('Gracias por tu reseña');
      setSelected(null);
    } catch (error) {
      const failure = apiError(error);
      if (failure.code === 'REVIEW_ALREADY_EXISTS') {
        setOrders(current => current.map(order => order.orderId === selected.orderId
          ? { ...order, status: { kind: 'reviewed', message: 'Este pedido ya tiene una reseña.' } }
          : order));
        setSelected(null);
      } else if (failure.status === 400 && failure.code === 'INVALID_FIELD' && (failure.field === 'rating' || failure.field === 'comment')) {
        setFieldErrors({ [failure.field]: failure.message ?? 'Revise este campo.' });
      } else if (failure.status === 409) {
        const messages: Record<string, string> = {
          ORDER_NOT_DELIVERED: 'El pedido aún no está entregado.',
          REVIEW_WINDOW_EXPIRED: 'El plazo para reseñar este pedido venció.',
          INVALID_DELIVERY_DATE: failure.message ?? 'La fecha de entrega no es válida.',
          ORDER_NOT_LINKED: 'Este pedido no está vinculado a tu cuenta.',
        };
        setDialogError(messages[failure.code ?? ''] ?? failure.message ?? 'No se pudo calificar este pedido.');
      } else if (failure.status === 401) {
        setDialogError('Inicie sesión para continuar.');
      } else if (failure.status === 403 || failure.status === 404) {
        setDialogError('No se pudo calificar este pedido.');
      } else {
        setDialogError('No se pudo enviar la reseña. Intente de nuevo.');
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function openDialog(order: ReviewOrder, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setDialogError('');
    setFieldErrors({});
    setSelected(order);
  }

  if (role !== 'CUSTOMER') return <MyReviewsPermissionError />;

  const pageCount = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;
  return <main className="shell reviewsPage">
    <header className="reviewsHeader">
      <div>
        <p className="eyebrow">RESEÑAS</p>
        <h1>Calificar mis pedidos</h1>
        <p>Cuéntanos cómo fue tu experiencia en los pedidos que ya recibiste.</p>
      </div>
    </header>
    {notice && <p role="status" className="reviewsNotice">{notice}</p>}
    {loading && <p role="status">Cargando tus pedidos…</p>}
    {loadError && <div className="reviewsError"><p role="alert">{loadError}</p><button type="button" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Reintentar</button></div>}
    {!loading && !loadError && result?.data.length === 0 && <p className="reviewsEmpty">Aún no tienes pedidos pagados para calificar.</p>}
    {!loading && !loadError && result && result.data.length > 0 && orders.length === 0 && <p className="reviewsEmpty">Aún no tienes pedidos pagados para calificar.</p>}
    {!loading && !loadError && orders.length > 0 && <>
      <ul className="reviewOrderList">
        {orders.map(order => <li className="reviewOrderCard" key={order.orderId}>
          <div className="reviewOrderDetails">
            <h2>Comprobante {order.receipt.number}</h2>
            <p>{order.receipt.branchName ?? 'Sucursal'}</p>
            <time dateTime={order.receipt.createdAt}>{formatDate(order.receipt.createdAt)}</time>
          </div>
          <div className="reviewOrderAction">
            {order.status.kind === 'checking' && <p role="status">Verificando…</p>}
            {order.status.kind === 'unavailable' && <p role="alert">{order.status.message}</p>}
            {order.status.kind === 'reviewed' && <p className="reviewOrderState">{order.status.message}</p>}
            {order.status.kind === 'eligible' && (order.status.eligibility.canReview
              ? <><p className="reviewOrderState">Puedes calificarlo</p><button type="button" onClick={event => openDialog(order, event.currentTarget)}>Calificar pedido</button></>
              : <p className="reviewOrderReason">{order.status.eligibility.reason ?? 'No se puede calificar este pedido.'}</p>)}
          </div>
        </li>)}
      </ul>
      <nav className="reviewsPagination" aria-label="Paginación de pedidos">
        <button type="button" className="secondaryButton" disabled={loading || page <= 1} onClick={() => setPage(current => current - 1)}>Anterior</button>
        <span>Página {result?.page ?? page} de {pageCount}</span>
        <button type="button" className="secondaryButton" disabled={loading || page >= pageCount} onClick={() => setPage(current => current + 1)}>Siguiente</button>
      </nav>
    </>}
    {selected && <ReviewDialog
      orderNumber={selected.receipt.number}
      submitting={submitting}
      error={dialogError}
      fieldErrors={fieldErrors}
      triggerRef={triggerRef}
      onClose={() => { if (!submittingRef.current) setSelected(null); }}
      onSubmit={submitReview}
      onClearFieldError={field => setFieldErrors(current => ({ ...current, [field]: undefined }))}
    />}
  </main>;
}
