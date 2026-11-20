import { useEffect, useState, type FormEvent } from 'react';
import { StarsDisplay } from './StarRating';
import { getBranches, getRatingsSummary, type ApiError, type Branch, type RatingsDateRange, type RatingsSummaryResult } from './ratings-api';
import './ratings.css';

type ManagementRole = 'MANAGER' | 'GENERAL_MANAGER';
type DateField = 'dateFrom' | 'dateTo';

function failureDetails(error: unknown): Partial<ApiError> {
  return error && typeof error === 'object' ? error as Partial<ApiError> : {};
}

function loadErrorMessage(error: unknown): string {
  const status = failureDetails(error).status;
  if (status === 401) return 'Inicie sesión para continuar.';
  if (status === 403) return 'No tiene permiso para ver esta pantalla.';
  if (status === 404) return 'No tiene acceso a esta sucursal.';
  return 'No se pudieron cargar las calificaciones. Intente de nuevo.';
}

function formatDate(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function RatingsSummary({ role, branchId: sessionBranchId }: {
  role: ManagementRole;
  branchId: string | null;
}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesReady, setBranchesReady] = useState(false);
  const [branchesError, setBranchesError] = useState(false);
  const [branchesRetry, setBranchesRetry] = useState(0);
  const [branchId, setBranchId] = useState(role === 'MANAGER' ? sessionBranchId ?? '' : '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedRange, setAppliedRange] = useState<RatingsDateRange>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<DateField, string>>>({});
  const [summary, setSummary] = useState<RatingsSummaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const branchName = branches.find(branch => branch.id === branchId)?.name ?? '';

  useEffect(() => {
    const controller = new AbortController();
    setBranchesReady(false);
    setBranchesError(false);
    setLoading(true);
    setLoadError('');
    getBranches(controller.signal)
      .then(items => {
        if (controller.signal.aborted) return;
        setBranches(items);
        if (role === 'MANAGER') {
          setBranchId(sessionBranchId ?? '');
        } else {
          setBranchId(current => items.some(branch => branch.id === current)
            ? current
            : items[0]?.id ?? '');
        }
        setBranchesReady(true);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setBranchesReady(true);
        setBranchesError(true);
        setLoading(false);
        setLoadError(loadErrorMessage(cause));
      });
    return () => controller.abort();
  }, [role, sessionBranchId, branchesRetry]);

  useEffect(() => {
    if (!branchesReady || branchesError) return;
    if (!branchId) {
      setSummary(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    setFieldErrors({});
    setSummary(null);
    getRatingsSummary(branchId, appliedRange, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) setSummary(result);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        const failure = failureDetails(cause);
        if (failure.status === 400 && failure.code === 'INVALID_FIELD'
          && (failure.field === 'dateFrom' || failure.field === 'dateTo')) {
          setFieldErrors({ [failure.field]: failure.message ?? 'Fecha inválida.' });
        } else {
          setLoadError(loadErrorMessage(cause));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [branchesReady, branchesError, branchId, appliedRange, refresh]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<DateField, string>> = {};
    if (Boolean(dateFrom) !== Boolean(dateTo)) {
      if (!dateFrom) nextErrors.dateFrom = 'Debe enviar ambas fechas';
      if (!dateTo) nextErrors.dateTo = 'Debe enviar ambas fechas';
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});
    setAppliedRange(dateFrom && dateTo ? { dateFrom, dateTo } : null);
    setRefresh(value => value + 1);
  }

  function clearFilters() {
    setDateFrom('');
    setDateTo('');
    setFieldErrors({});
    setAppliedRange(null);
    setRefresh(value => value + 1);
  }

  function retry() {
    if (branchesError) setBranchesRetry(value => value + 1);
    else setRefresh(value => value + 1);
  }

  function updateDate(field: DateField, value: string) {
    if (field === 'dateFrom') setDateFrom(value);
    else setDateTo(value);
    setFieldErrors(current => ({ ...current, [field]: undefined }));
  }

  if (role !== 'MANAGER' && role !== 'GENERAL_MANAGER') {
    return <main className="shell"><p role="alert" className="error">No tiene permiso para ver esta pantalla.</p></main>;
  }

  const period = appliedRange
    ? `${formatDate(appliedRange.dateFrom)} – ${formatDate(appliedRange.dateTo)}`
    : 'Todo el historial';
  return <main className="shell ratingsPage">
    <header className="ratingsHeader">
      <p className="eyebrow">RESEÑAS</p>
      <h1>Calificaciones por sucursal</h1>
      <p>Consulta el promedio de calificaciones de tu sucursal.</p>
    </header>
    <form className="ratingsFilters" onSubmit={applyFilters}>
      {role === 'GENERAL_MANAGER'
        ? <label className="ratingsBranchField" htmlFor="ratings-branch">Sucursal
          <select id="ratings-branch" value={branchId}
            disabled={!branchesReady || loading || branches.length === 0}
            onChange={event => {
              setBranchId(event.target.value);
              setFieldErrors({});
            }}>
            {branches.length === 0 && <option value="">No hay sucursales disponibles</option>}
            {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
        </label>
        : <div className="ratingsBranchField">
          <span>Sucursal</span>
          <strong>{branchName || (loading ? 'Cargando…' : 'No disponible')}</strong>
        </div>}
      <label className="ratingsDateField" htmlFor="ratings-date-from">Fecha inicial
        <input id="ratings-date-from" type="date" value={dateFrom}
          aria-invalid={Boolean(fieldErrors.dateFrom)}
          aria-describedby={fieldErrors.dateFrom ? 'ratings-date-from-error' : undefined}
          disabled={loading} onChange={event => updateDate('dateFrom', event.target.value)} />
        {fieldErrors.dateFrom && <small id="ratings-date-from-error">{fieldErrors.dateFrom}</small>}
      </label>
      <label className="ratingsDateField" htmlFor="ratings-date-to">Fecha final
        <input id="ratings-date-to" type="date" value={dateTo}
          aria-invalid={Boolean(fieldErrors.dateTo)}
          aria-describedby={fieldErrors.dateTo ? 'ratings-date-to-error' : undefined}
          disabled={loading} onChange={event => updateDate('dateTo', event.target.value)} />
        {fieldErrors.dateTo && <small id="ratings-date-to-error">{fieldErrors.dateTo}</small>}
      </label>
      <div className="ratingsFilterActions">
        <button type="submit" disabled={!branchesReady || loading || !branchId}>Aplicar</button>
        <button type="button" className="secondaryButton" disabled={loading} onClick={clearFilters}>Limpiar</button>
      </div>
    </form>
    {loading && <p role="status">Cargando calificaciones…</p>}
    {loadError && <div className="ratingsError">
      <p role="alert" className="error">{loadError}</p>
      {loadError !== 'Inicie sesión para continuar.' && <button type="button" onClick={retry} disabled={loading}>Reintentar</button>}
    </div>}
    {!loading && !loadError && summary && <section className="ratingsResult" aria-labelledby="ratings-result-title">
      <div className="ratingsResultHeading">
        <h2 id="ratings-result-title">{branchName || 'Calificaciones de la sucursal'}</h2>
        <p>Período: {period}</p>
      </div>
      {summary.averageRating === null
        ? <p className="ratingsEmpty">Aún no hay reseñas en este período.</p>
        : <div className="ratingsScore">
          <strong>{summary.averageRating.toFixed(1)} / 5</strong>
          <StarsDisplay rating={summary.averageRating} />
          <p>Basado en {summary.reviewCount} {summary.reviewCount === 1 ? 'reseña' : 'reseñas'}</p>
        </div>}
    </section>}
  </main>;
}
