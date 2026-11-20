import { useCallback, useEffect, useRef, useState } from 'react';
import { createReview, getBillReviewInfo, getMyReceipt, getMyReceipts, getReviewEligibility, type ApiError, type ReceiptListItem } from './reviews-api';
import { ReviewDialog } from './ReviewDialog';
import './reviews.css';

type ReviewOrder = {
  id: string;
  receipt: ReceiptListItem;
  canReview: boolean | null;
  reason: string | null;
  verifying: boolean;
  error?: string;
};

type SelectedOrder = Pick<ReviewOrder, 'id' | 'receipt'>;

function failureDetails(error: unknown): Partial<ApiError> {
  return error && typeof error === 'object' ? error as Partial<ApiError> : {};
}

function loadErrorMessage(error: unknown): string {
  return failureDetails(error).status === 401
    ? 'Inicie sesión para continuar.'
    : 'No se pudieron cargar tus pedidos. Intente de nuevo.';
}

function reviewReason(code: string | undefined, message: string | undefined): string {
  switch (code) {
    case 'REVIEW_ALREADY_EXISTS': return 'Este pedido ya tiene una reseña.';
    case 'ORDER_NOT_DELIVERED': return 'El pedido aún no está entregado.';
    case 'REVIEW_WINDOW_EXPIRED': return 'El plazo para reseñar este pedido venció.';
    case 'INVALID_DELIVERY_DATE': return 'El pedido no tiene una fecha de entrega válida.';
    case 'ORDER_NOT_LINKED': return 'Este pedido no está vinculado a tu cuenta.';
    default: return message ?? 'No se pudo verificar este pedido.';
  }
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

async function mapConcurrent<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index]);
    }
  }));
  return results;
}

function markReviewed(order: ReviewOrder): ReviewOrder {
  return { ...order, canReview: false, reason: 'Este pedido ya tiene una reseña.', verifying: false };
}

export function MyReviews({ role = 'CUSTOMER' }: { role?: string }) {
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalReceipts, setTotalReceipts] = useState(0);
  const [orders, setOrders] = useState<ReviewOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState<SelectedOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [fieldError, setFieldError] = useState<Partial<Record<'rating' | 'comment', string>>>({});
  const [notice, setNotice] = useState('');
  const busyRef = useRef(false);
  const closeDialog = useCallback(() => {
    if (!busyRef.current) {
      setSelected(null);
      setDialogError('');
      setFieldError({});
    }
  }, []);

  useEffect(() => {
    if (role !== 'CUSTOMER') {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setLoadError('');
    setOrders([]);
    getMyReceipts(page, controller.signal)
      .then(async receiptPage => {
        if (!active) return;
        setTotalReceipts(receiptPage.total);
        setPageCount(Math.max(1, Math.ceil(receiptPage.total / receiptPage.pageSize)));
        const billIds = await mapConcurrent(receiptPage.data, 3, async receipt =>
          receipt.billId ?? (await getMyReceipt(receipt.id, controller.signal)).billId);
        const bills = await mapConcurrent(billIds, 3, billId =>
          getBillReviewInfo(billId, controller.signal));
        const initialOrders: ReviewOrder[] = bills.flatMap((bill, index) =>
          bill.orderIds.map(orderId => ({
            id: orderId,
            receipt: receiptPage.data[index],
            canReview: null,
            reason: null,
            verifying: true,
          })));
        if (!active) return;
        setOrders(initialOrders);
        await mapConcurrent(initialOrders, 3, async order => {
          try {
            const eligibility = await getReviewEligibility(order.id, controller.signal);
            if (!active) return;
            setOrders(current => current.map(item => item.id === order.id
              ? { ...item, canReview: eligibility.canReview, reason: eligibility.reason, verifying: false }
              : item));
          } catch (cause) {
            if (!active) return;
            const failure = failureDetails(cause);
            const reason = reviewReason(failure.code, failure.message);
            setOrders(current => current.map(item => item.id === order.id
              ? { ...item, canReview: false, reason, verifying: false }
              : item));
          }
        });
      })
      .catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return;
        setLoadError(loadErrorMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [page, refresh, role]);

  async function submitReview(rating: number, comment: string) {
    if (!selected || busyRef.current) return;
    const errors: Partial<Record<'rating' | 'comment', string>> = {};
    if (!rating) errors.rating = 'Seleccione una calificación de 1 a 5.';
    if (comment.length > 500) errors.comment = 'El comentario no puede superar 500 caracteres.';
    setFieldError(errors);
    setDialogError('');
    setNotice('');
    if (Object.keys(errors).length) return;
    busyRef.current = true;
    setSubmitting(true);
    try {
      await createReview(selected.id, {
        rating,
        ...(comment ? { comment } : {}),
      });
      setOrders(current => current.map(order => order.id === selected.id ? markReviewed(order) : order));
      setNotice('Gracias por tu reseña');
      setSelected(null);
    } catch (cause) {
      const failure = failureDetails(cause);
      if (failure.status === 409 && failure.code === 'REVIEW_ALREADY_EXISTS') {
        setOrders(current => current.map(order => order.id === selected.id ? markReviewed(order) : order));
        setNotice('Este pedido ya tiene una reseña.');
        setSelected(null);
      } else if (failure.status === 409) {
        setDialogError(reviewReason(failure.code, failure.message));
        if (['ORDER_NOT_DELIVERED', 'REVIEW_WINDOW_EXPIRED', 'INVALID_DELIVERY_DATE'].includes(failure.code ?? '')) {
          setOrders(current => current.map(order => order.id === selected.id
            ? { ...order, canReview: false, reason: reviewReason(failure.code, failure.message), verifying: false }
            : order));
        }
      } else if (failure.status === 400 && failure.code === 'INVALID_FIELD'
        && (failure.field === 'rating' || failure.field === 'comment')) {
        setFieldError({ [failure.field]: failure.message ?? 'Revise este campo.' });
      } else if (failure.status === 403 || failure.status === 404) {
        setDialogError('No se pudo calificar este pedido.');
      } else if (failure.status === 401) {
        setDialogError('Inicie sesión para continuar.');
      } else {
        setDialogError('No se pudo enviar la reseña. Intente de nuevo.');
      }
    } finally {
      busyRef.current = false;
      setSubmitting(false);
    }
  }

  if (role !== 'CUSTOMER') return <main className="shell"><p role="alert" className="error">No tiene permiso para ver esta pantalla.</p></main>;

  return <main className="shell myReviewsPage">
    <header className="myReviewsHeader">
      <div>
        <p className="eyebrow">RESEÑAS</p>
        <h1>Calificar mis pedidos</h1>
        <p>Cuéntanos cómo fue tu experiencia en los pedidos que ya recibiste.</p>
      </div>
    </header>
    {notice && <p role="status" className="notice">{notice}</p>}
    {loading && <p role="status">Cargando tus pedidos…</p>}
    {!loading && loadError && <div className="myReviewsError">
      <p role="alert" className="error">{loadError}</p>
      {loadError !== 'Inicie sesión para continuar.' && <button type="button" onClick={() => setRefresh(value => value + 1)}>Reintentar</button>}
    </div>}
    {!loading && !loadError && totalReceipts === 0 && <p className="myReviewsEmpty">Aún no tienes pedidos pagados para calificar.</p>}
    {!loading && !loadError && totalReceipts > 0 && orders.length === 0
      && <p className="myReviewsEmpty">No hay pedidos asociados a los comprobantes de esta página.</p>}
    {!loadError && orders.length > 0 && <>
      <section className="myReviewOrders" aria-label="Pedidos de tus comprobantes">
        {orders.map(order => <article className="myReviewOrderCard" key={order.id}>
          <div className="myReviewOrderHeading">
            <div>
              <h2>Comprobante {order.receipt.number}</h2>
              <p>{order.receipt.branchName ?? 'Sucursal'}</p>
            </div>
            <time dateTime={order.receipt.createdAt ?? order.receipt.issuedAt}>
              {formatDate(order.receipt.createdAt ?? order.receipt.issuedAt)}
            </time>
          </div>
          <div className="myReviewOrderStatus">
            {order.verifying && <p role="status">Verificando…</p>}
            {!order.verifying && order.error && <p role="alert">{order.error}</p>}
            {!order.verifying && !order.error && order.canReview && <>
              <p>Puedes calificarlo</p>
              <button type="button" disabled={submitting} onClick={() => {
                setSelected({ id: order.id, receipt: order.receipt });
                setDialogError('');
                setFieldError({});
              }}>Calificar pedido</button>
            </>}
            {!order.verifying && !order.error && !order.canReview && <p>{order.reason}</p>}
          </div>
        </article>)}
      </section>
      <nav className="myReviewsPagination" aria-label="Paginación de comprobantes">
        <button type="button" className="secondaryButton" disabled={loading || page <= 1}
          onClick={() => setPage(current => current - 1)}>Anterior</button>
        <span>Página {page} de {pageCount} · {totalReceipts} comprobantes</span>
        <button type="button" className="secondaryButton" disabled={loading || page >= pageCount}
          onClick={() => setPage(current => current + 1)}>Siguiente</button>
      </nav>
    </>}
    {selected && <ReviewDialog
      target={{ orderId: selected.id, receiptNumber: selected.receipt.number, branchName: selected.receipt.branchName }}
      submitting={submitting}
      error={dialogError}
      fieldError={fieldError}
      onClose={closeDialog}
      onSubmit={submitReview}
    />}
  </main>;
}
