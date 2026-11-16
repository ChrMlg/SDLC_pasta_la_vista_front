import { useEffect, useState } from 'react';
import { StarsDisplay } from './StarRating';
import { getBranchReviews, type BranchReviewsPage } from './branch-reviews-api';
import { getBranches, getRatingsSummary, type ApiError, type Branch, type RatingsSummaryResult } from './ratings-api';
import './branch-reviews.css';

type ReviewRole = 'CUSTOMER' | 'WAITER' | 'MANAGER' | 'GENERAL_MANAGER' | 'KITCHEN';

function failureDetails(error: unknown): Partial<ApiError> {
  return error && typeof error === 'object' ? error as Partial<ApiError> : {};
}

function errorMessage(error: unknown): string {
  const failure = failureDetails(error);
  if (failure.status === 401) return 'Inicie sesión para continuar.';
  if (failure.status === 403) return 'No tiene permiso para ver esta pantalla.';
  if (failure.status === 404) return 'No tiene acceso a esta sucursal.';
  if (failure.status === 400 && failure.code === 'INVALID_FIELD' && failure.message) return failure.message;
  return 'No se pudieron cargar las reseñas. Intente de nuevo.';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function PermissionError() {
  return <main className="shell"><p role="alert" className="error">No tiene permiso para ver esta pantalla.</p></main>;
}

export function BranchReviews({ role, branchId: sessionBranchId }: {
  role: ReviewRole;
  branchId: string | null;
}) {
  const isAllowed = role !== 'KITCHEN';
  const isFixedBranch = role === 'WAITER' || role === 'MANAGER';
  const canSeeAverage = role === 'MANAGER' || role === 'GENERAL_MANAGER';
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesReady, setBranchesReady] = useState(false);
  const [branchesError, setBranchesError] = useState(false);
  const [branchesRetry, setBranchesRetry] = useState(0);
  const [branchId, setBranchId] = useState(isFixedBranch ? sessionBranchId ?? '' : '');
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<BranchReviewsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [average, setAverage] = useState<RatingsSummaryResult | null>(null);
  const [averageLoading, setAverageLoading] = useState(false);
  const [averageError, setAverageError] = useState(false);
  const branchName = branches.find(branch => branch.id === branchId)?.name ?? '';

  useEffect(() => {
    if (!isAllowed) return;
    const controller = new AbortController();
    setBranchesReady(false);
    setBranchesError(false);
    setLoading(true);
    setLoadError('');
    getBranches(controller.signal)
      .then(items => {
        if (controller.signal.aborted) return;
        setBranches(items);
        if (isFixedBranch) {
          setBranchId(sessionBranchId ?? '');
        } else {
          setBranchId(current => items.some(branch => branch.id === current) ? current : items[0]?.id ?? '');
        }
        setBranchesReady(true);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setBranchesReady(true);
        setBranchesError(true);
        setLoading(false);
        setLoadError(errorMessage(cause));
      });
    return () => controller.abort();
  }, [isAllowed, isFixedBranch, sessionBranchId, branchesRetry]);

  useEffect(() => {
    if (!branchesReady || branchesError) return;
    if (!branchId) {
      setResult(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    setResult(null);
    getBranchReviews(branchId, page, rating ? Number(rating) : undefined, controller.signal)
      .then(reviews => {
        if (!controller.signal.aborted) setResult(reviews);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setLoadError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [branchesReady, branchesError, branchId, page, rating, refresh]);

  useEffect(() => {
    if (!canSeeAverage || !branchesReady || branchesError || !branchId) {
      setAverage(null);
      setAverageLoading(false);
      setAverageError(false);
      return;
    }
    const controller = new AbortController();
    setAverage(null);
    setAverageError(false);
    setAverageLoading(true);
    getRatingsSummary(branchId, null, controller.signal)
      .then(summary => {
        if (!controller.signal.aborted) setAverage(summary);
      })
      .catch(() => {
        if (!controller.signal.aborted) setAverageError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setAverageLoading(false);
      });
    return () => controller.abort();
  }, [canSeeAverage, branchesReady, branchesError, branchId, refresh]);

  function retry() {
    if (branchesError) setBranchesRetry(value => value + 1);
    else setRefresh(value => value + 1);
  }

  if (!isAllowed) return <PermissionError />;

  const pageCount = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;
  return <main className="shell branchReviewsPage">
    <header className="branchReviewsHeader">
      <p className="eyebrow">RESEÑAS</p>
      <h1>Reseñas de la sucursal</h1>
      <p>Lo que opinan nuestros clientes.</p>
    </header>

    <section className="branchReviewsFilters" aria-label="Filtros de reseñas">
      {isFixedBranch
        ? <div className="branchReviewsField">
          <span>Sucursal</span>
          <strong>{branchName || (loading ? 'Cargando…' : 'No disponible')}</strong>
        </div>
        : <label className="branchReviewsField" htmlFor="branch-reviews-branch">Sucursal
          <select
            id="branch-reviews-branch"
            value={branchId}
            disabled={!branchesReady || loading || branches.length === 0}
            onChange={event => {
              setBranchId(event.target.value);
              setPage(1);
            }}
          >
            {branches.length === 0 && <option value="">No hay sucursales disponibles</option>}
            {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
        </label>}
      <label className="branchReviewsField" htmlFor="branch-reviews-rating">Calificación
        <select
          id="branch-reviews-rating"
          value={rating}
          disabled={!branchesReady || loading || !branchId}
          onChange={event => {
            setRating(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Todas</option>
          {[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} estrellas</option>)}
        </select>
      </label>
    </section>

    {canSeeAverage && averageLoading && <p role="status" className="branchReviewsAverage">Cargando promedio…</p>}
    {canSeeAverage && averageError && <div className="branchReviewsAverageError">
      <p role="alert">No se pudo cargar el promedio de la sucursal; la lista sigue disponible.</p>
      <button type="button" disabled={averageLoading} onClick={() => setRefresh(value => value + 1)}>Reintentar promedio</button>
    </div>}
    {canSeeAverage && average && <p className="branchReviewsAverage">
      Promedio de la sucursal: {average.averageRating === null ? 'Sin reseñas' : `${average.averageRating.toFixed(1)} / 5`}
    </p>}

    {loading && <p role="status">Cargando reseñas…</p>}
    {loadError && <div className="branchReviewsError">
      <p role="alert" className="error">{loadError}</p>
      <button type="button" disabled={loading} onClick={retry}>Reintentar</button>
    </div>}
    {!loading && !loadError && result && result.data.length === 0
      && <p className="branchReviewsEmpty">{rating ? 'No hay reseñas con esa calificación.' : 'Aún no hay reseñas para esta sucursal.'}</p>}
    {!loading && !loadError && result && result.data.length > 0 && <>
      <ul className="branchReviewsList">
        {result.data.map(review => <li className="branchReviewCard" key={review.id}>
          <div className="branchReviewMeta">
            <StarsDisplay rating={review.rating} />
            <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
          </div>
          <p className={review.comment ? 'branchReviewComment' : 'branchReviewNoComment'}>
            {review.comment || 'Sin comentario'}
          </p>
        </li>)}
      </ul>
      <nav className="branchReviewsPagination" aria-label="Paginación de reseñas">
        <button type="button" className="secondaryButton" disabled={loading || page <= 1} onClick={() => setPage(current => current - 1)}>Anterior</button>
        <span>Página {result.page} de {pageCount} · {result.total} reseñas</span>
        <button type="button" className="secondaryButton" disabled={loading || page >= pageCount} onClick={() => setPage(current => current + 1)}>Siguiente</button>
      </nav>
    </>}
  </main>;
}
