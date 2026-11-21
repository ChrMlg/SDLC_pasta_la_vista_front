import { useEffect, useState } from 'react';
import './loyalty.css';
import {
  getLoyaltyBalance,
  getLoyaltyHistory,
  type ApiError,
  type LoyaltyBalance,
  type LoyaltyHistory,
  type LoyaltyTransaction,
} from './loyalty-balance-api';
import { USE_LOYALTY_MOCK } from './loyalty-config';

function errorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error
    && typeof error.status === 'number') return error.status;
  return undefined;
}

function errorMessage(error: unknown): string {
  const status = errorStatus(error);
  if (status === 401) return 'Inicie sesión para continuar.';
  if (status === 403) return 'No tiene permiso para ver esta pantalla.';
  return 'No se pudieron cargar tus puntos. Intente de nuevo.';
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-GT').format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(valuePart => valuePart.type === type)?.value ?? '';
  return `${part('day')}/${part('month')}/${part('year')} ${part('hour')}:${part('minute')}`;
}

function TransactionRow({ transaction }: { transaction: LoyaltyTransaction }) {
  const earned = transaction.type === 'EARNED';
  const points = `${earned ? '+' : '−'}${formatNumber(Math.abs(transaction.points))}`;
  return <tr>
    <td data-label="Fecha">{formatDate(transaction.createdAt)}</td>
    <td data-label="Descripción">{transaction.description}</td>
    <td data-label="Tipo"><span className={`loyaltyType ${earned ? 'earned' : 'redeemed'}`}>
      {earned ? 'Ganados' : 'Canjeados'}
    </span></td>
    <td data-label="Puntos" className="loyaltyPoints">{points}</td>
  </tr>;
}

function CustomerLoyalty() {
  const [balance, setBalance] = useState<LoyaltyBalance | null>(null);
  const [history, setHistory] = useState<LoyaltyHistory | null>(null);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    Promise.all([
      getLoyaltyBalance(controller.signal),
      getLoyaltyHistory(page, controller.signal),
    ]).then(([nextBalance, nextHistory]) => {
      setBalance(nextBalance);
      setHistory(nextHistory);
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      setBalance(null);
      setHistory(null);
      setError(errorMessage(cause));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [page, retry]);

  const transactions = history
    ? [...history.data].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    : [];
  const totalPages = history ? Math.max(1, Math.ceil(history.total / history.pageSize)) : 1;

  return <main className="shell loyaltyPage">
    {USE_LOYALTY_MOCK && <p className="loyaltyDemoBanner" role="status">
      Modo demostración: datos de ejemplo, el backend de Lealtad aún no está conectado.
    </p>}
    <header className="loyaltyHeader">
      <div>
        <span className="eyebrow">LEALTAD</span>
        <h1>Mis puntos</h1>
        <p>Consulta tu saldo y el historial de tus puntos.</p>
      </div>
    </header>

    {loading && <p role="status" className="loyaltyLoading">Cargando tus puntos…</p>}
    {error && <div className="loyaltyError">
      <p role="alert" className="error">{error}</p>
      <button type="button" onClick={() => setRetry(value => value + 1)} disabled={loading}>
        Reintentar
      </button>
    </div>}

    {!error && balance && <section className="loyaltyBalance" aria-labelledby="loyalty-balance-title">
      <span id="loyalty-balance-title">Saldo disponible</span>
      <p><strong>{formatNumber(balance.points)}</strong> puntos</p>
      {(balance.reservedPoints ?? 0) > 0 && <p>
        Reservados: <strong>{formatNumber(balance.reservedPoints ?? 0)}</strong>
        {' · '}Disponibles: <strong>{formatNumber(balance.availableBalance ?? balance.points)}</strong>
      </p>}
    </section>}

    {!error && !loading && history && <>
      <section className="loyaltyHistory" aria-labelledby="loyalty-history-title">
        <h2 id="loyalty-history-title">Historial de puntos</h2>
        {history.total === 0
          ? <p className="loyaltyEmpty">Aún no tienes movimientos de puntos.</p>
          : <div className="loyaltyTableWrap">
            <table className="loyaltyTable">
              <thead><tr><th scope="col">Fecha</th><th scope="col">Descripción</th>
                <th scope="col">Tipo</th><th scope="col">Puntos</th></tr></thead>
              <tbody>{transactions.map(transaction =>
                <TransactionRow key={transaction.id} transaction={transaction} />)}</tbody>
            </table>
          </div>}
      </section>
      <nav className="loyaltyPagination" aria-label="Paginación del historial de puntos">
        <button type="button" onClick={() => setPage(current => current - 1)}
          disabled={loading || history.page <= 1}>Anterior</button>
        <span>Página {history.page} de {totalPages}</span>
        <button type="button" onClick={() => setPage(current => current + 1)}
          disabled={loading || history.page >= totalPages}>Siguiente</button>
      </nav>
    </>}
  </main>;
}

export function MyLoyalty({ role }: { role: string }) {
  if (role !== 'CUSTOMER') {
    return <main className="shell">
      <p role="alert" className="error">No tiene permiso para ver esta pantalla.</p>
    </main>;
  }
  return <CustomerLoyalty />;
}
