import { useEffect, useState } from 'react';
import {
  getAlerts,
  type InventoryAlert,
  type InventoryAlertStatus,
} from './inventory-alerts-api';
import './inventory-alerts.css';

function statusMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return 'No se pudieron cargar las alertas. Intente de nuevo.';
  }
  const status = typeof error.status === 'number' ? error.status : undefined;
  if (status === 401) return 'Inicie sesión para continuar.';
  if (status === 403) return 'No tiene permiso para ver las alertas.';
  if (status === 404) return 'No tiene acceso a esta sucursal.';
  return 'No se pudieron cargar las alertas. Intente de nuevo.';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const parts = new Intl.DateTimeFormat('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: string) => parts.find(value => value.type === type)?.value ?? '';
  return `${part('day')}/${part('month')}/${part('year')} ${part('hour')}:${part('minute')}`;
}

function newestFirst(left: InventoryAlert, right: InventoryAlert): number {
  return Date.parse(right.createdAt) - Date.parse(left.createdAt) || right.id.localeCompare(left.id);
}

function alertLabel(status: InventoryAlertStatus): string {
  return status === 'ACTIVE' ? 'Activa' : 'Resuelta';
}

function AlertCard({ alert }: { alert: InventoryAlert }) {
  return <article className={`inventoryAlertCard${alert.status === 'ACTIVE' ? ' inventoryAlertCardActive' : ''}`}>
    <header className="inventoryAlertCardHeader">
      <h4>{alert.item.name}</h4>
      <span className={`inventoryAlertStatus inventoryAlertStatus${alert.status}`}>{alertLabel(alert.status)}</span>
    </header>
    <dl className="inventoryAlertDetails">
      <div><dt>Existencia actual</dt><dd>{alert.item.currentStock} {alert.item.unit}</dd></div>
      <div><dt>Stock mínimo</dt><dd>{alert.item.minStock} {alert.item.unit}</dd></div>
      <div><dt>Creada el</dt><dd>{formatDate(alert.createdAt)}</dd></div>
      <div><dt>Al generarse</dt><dd>{alert.currentStock} {alert.item.unit} / mínimo {alert.minStock} {alert.item.unit}</dd></div>
      {alert.status === 'RESOLVED'
        && <div><dt>Resuelta el</dt><dd>{alert.resolvedAt ? formatDate(alert.resolvedAt) : '—'}</dd></div>}
    </dl>
  </article>;
}

export function AlertsPanel({ branchId, refreshKey }: {
  branchId: string;
  refreshKey: number;
}) {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!branchId) {
      setAlerts([]);
      setLoading(false);
      setError('');
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getAlerts(branchId, controller.signal).then(result => {
      if (!controller.signal.aborted) setAlerts(result);
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      setAlerts([]);
      setError(statusMessage(cause));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [branchId, refreshKey, retryKey]);

  const activeAlerts = alerts.filter(alert => alert.status === 'ACTIVE').sort(newestFirst);
  const resolvedAlerts = alerts.filter(alert => alert.status === 'RESOLVED').sort(newestFirst);

  return <section className="inventoryAlerts" aria-labelledby="inventory-alerts-title">
    <header className="inventoryAlertsHeader">
      <h2 id="inventory-alerts-title">Alertas de reabastecimiento</h2>
      <span className="inventoryActiveCount" aria-label={`${activeAlerts.length} alertas activas`}>
        {activeAlerts.length} {activeAlerts.length === 1 ? 'activa' : 'activas'}
      </span>
    </header>

    {loading && <p role="status">Cargando alertas…</p>}
    {error && <div className="inventoryAlertsError">
      <p role="alert">{error}</p>
      <button type="button" onClick={() => setRetryKey(value => value + 1)} disabled={loading}>Reintentar</button>
    </div>}
    {!loading && !error && <>
      {alerts.length === 0 && <p className="inventoryAlertsEmpty">No hay alertas de reabastecimiento.</p>}
      {activeAlerts.length === 0 && <p className="inventoryAlertsPositive" role="status">
        Todos los insumos están por encima de su stock mínimo.
      </p>}
      {activeAlerts.length > 0 && <div className="inventoryAlertGroup">
        <h3>Activas</h3>
        <div className="inventoryAlertList">{activeAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)}</div>
      </div>}
      {resolvedAlerts.length > 0 && <div className="inventoryAlertGroup">
        <h3>Resueltas</h3>
        <div className="inventoryAlertList">{resolvedAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)}</div>
      </div>}
    </>}
  </section>;
}
