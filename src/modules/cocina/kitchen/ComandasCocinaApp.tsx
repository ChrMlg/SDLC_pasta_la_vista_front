import React, { useState, useEffect, useCallback } from 'react';
import './cocina.css';

interface KitchenOrderRaw {
  id?: string;
  orderId?: string;
  orderNumber?: number | string;
  status?: string;
  state?: string;
  type?: string;
  serviceType?: string;
  tableLabel?: string | null;
  tableNumber?: string | null;
  tableName?: string | null;
  minutesWaiting?: number;
  enteredAt?: string;
  createdAt?: string;
  assignedCook?: string | { name?: string } | null;
  items?: Array<{
    id?: string;
    name?: string;
    dishName?: string;
    menuItem?: { name?: string };
    quantity?: number;
    note?: string | null;
    isReady?: boolean;
  }>;
}

interface ComandaCardData {
  id: string;
  orderNumber?: number | string;
  status: string;
  tableOrType: string;
  itemsSummary: string[];
  minutesWaiting?: number;
  assignedCook?: string;
}

const BRANCH_MAP: Record<string, string> = {
  Centro: 'a1111111-1111-4111-8111-111111111111',
  Bambu: 'a2222222-2222-4222-8222-222222222222',
  Bambú: 'a2222222-2222-4222-8222-222222222222',
  Ramblas: 'a3333333-3333-4333-8333-333333333333',
};

function normalizeComanda(raw: KitchenOrderRaw): ComandaCardData {
  const id = String(raw.orderId ?? raw.id ?? '');
  const status = String(raw.status ?? raw.state ?? 'PENDING').toUpperCase();

  const serviceRaw = raw.type ?? raw.serviceType;
  const serviceLabel =
    serviceRaw === 'TAKEAWAY' ? 'Para llevar' : serviceRaw === 'DINE_IN' ? 'En mesa' : '';
  const tableLabel = raw.tableLabel || raw.tableNumber || raw.tableName;

  const tableOrType =
    tableLabel && serviceLabel && tableLabel.toLowerCase() !== serviceLabel.toLowerCase()
      ? `${tableLabel} · ${serviceLabel}`
      : tableLabel || serviceLabel || 'Pedido';

  const itemsSummary = Array.isArray(raw.items)
    ? raw.items.map((item) => {
        const name = item.dishName || item.name || item.menuItem?.name || 'Platillo';
        const qty = item.quantity ? `${item.quantity}× ` : '';
        return `${qty}${name}`;
      })
    : [];

  let minutesWaiting = raw.minutesWaiting;
  const timeSource = raw.enteredAt || raw.createdAt;
  if (minutesWaiting === undefined && timeSource) {
    const diffMs = Date.now() - new Date(timeSource).getTime();
    if (!Number.isNaN(diffMs) && diffMs >= 0) {
      minutesWaiting = Math.floor(diffMs / 60000);
    }
  }

  let assignedCook: string | undefined;
  if (typeof raw.assignedCook === 'string') {
    assignedCook = raw.assignedCook;
  } else if (raw.assignedCook && typeof raw.assignedCook === 'object') {
    assignedCook = raw.assignedCook.name;
  }

  return {
    id,
    orderNumber: raw.orderNumber,
    status,
    tableOrType,
    itemsSummary,
    minutesWaiting,
    assignedCook,
  };
}

export function ComandasCocinaApp({
  onNavigate,
}: {
  onNavigate: (path: string, comandaId?: string) => void;
}) {
  const [selectedBranch, setSelectedBranch] = useState('Centro');
  const [pendientes, setPendientes] = useState<ComandaCardData[]>([]);
  const [enPreparacion, setEnPreparacion] = useState<ComandaCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [error, setError] = useState('');
  const [lastSyncLabel, setLastSyncLabel] = useState('Sincronizando...');

  const fetchComandas = useCallback(async () => {
    try {
      setError('');
      const branchId = BRANCH_MAP[selectedBranch] || 'a1111111-1111-4111-8111-111111111111';

      const res = await fetch(`/api/branches/${branchId}/kitchen/orders`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status} al consultar comandas de cocina`);
      }

      const payload = await res.json();
      const rawList: KitchenOrderRaw[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.orders)
        ? payload.orders
        : [];

      const normalized = rawList.map(normalizeComanda).filter((c) => Boolean(c.id));

      const pendingList = normalized.filter(
        (c) =>
          c.status === 'PENDING' ||
          c.status === 'PENDIENTE' ||
          c.status === 'RECEIVED' ||
          c.status === 'CREATED'
      );
      const preparingList = normalized.filter(
        (c) =>
          c.status === 'IN_PREPARATION' ||
          c.status === 'PREPARING' ||
          c.status === 'EN_PREPARACION' ||
          c.status === 'TAKEN'
      );

      const knownIds = new Set([
        ...pendingList.map((p) => p.id),
        ...preparingList.map((p) => p.id),
      ]);
      const remaining = normalized.filter((c) => !knownIds.has(c.id));

      setPendientes([...pendingList, ...remaining]);
      setEnPreparacion(preparingList);
      setConnected(true);
      setLastSyncLabel(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    } catch (err: any) {
      setConnected(false);
      setError(err?.message || 'No se pudieron cargar las comandas de cocina.');
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    setLoading(true);
    fetchComandas();

    const interval = setInterval(() => {
      fetchComandas();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchComandas]);

  const handleOpenPreviewDetail = () => {
    const firstOrderId = pendientes[0]?.id || enPreparacion[0]?.id || 'preview-order-001';
    onNavigate('/kitchen/detail', firstOrderId);
  };

  return (
    <div className="cocina-container">
      <header className="cocina-header-bar">
        <div className="breadcrumb">
          Cocina / <strong>Comandas de cocina</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
            }}
          >
            <option value="Centro">Centro</option>
            <option value="Bambú">Bambú</option>
            <option value="Ramblas">Ramblas</option>
          </select>
          <span className="branch-badge">{selectedBranch} · Cocina</span>
        </div>
      </header>

      <main className="cocina-content">
        <div className="meta-info">
          <span className="badge-h">H6 + H30 · KITCHEN</span>
          <span className="route-tag">/kitchen</span>
        </div>

        <div className="cocina-title-row">
          <div>
            <h1>Comandas de cocina</h1>
            <p className="subtitle-desc">
              Cola en vivo de órdenes pendientes y en preparación para la sucursal
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span
              className={`status-badge ${connected ? 'available' : 'unavailable'}`}
              style={{ fontSize: '0.78rem' }}
            >
              {connected ? `Conectado · ${lastSyncLabel}` : 'Desconectado'}
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setLoading(true);
                fetchComandas();
              }}
            >
              Actualizar
            </button>
            <button type="button" className="btn-secondary" onClick={handleOpenPreviewDetail}>
              Ver detalle (H7)
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: '#ef4444',
              color: '#fff',
              padding: '0.65rem 0.9rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        {loading && pendientes.length === 0 && enPreparacion.length === 0 ? (
          <p style={{ color: '#64748b' }}>Cargando comandas...</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.25rem',
              marginTop: '1rem',
            }}
          >
            <section className="card-order-catalog">
              <div className="catalog-header-text">
                <span className="catalog-tag">PENDIENTES ({pendientes.length})</span>
                <h2>Por tomar</h2>
              </div>

              {pendientes.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  No hay comandas pendientes en este momento.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {pendientes.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onNavigate('/kitchen/detail', c.id)}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '0.85rem',
                        cursor: 'pointer',
                        background: '#f8fafc',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.35rem',
                        }}
                      >
                        <strong>
                          Pedido {c.orderNumber ? `#${c.orderNumber}` : `#${c.id.slice(0, 6)}`}
                        </strong>
                        <span className="status-badge available">{c.status}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.4rem' }}>
                        {c.tableOrType}
                        {typeof c.minutesWaiting === 'number' ? ` · ${c.minutesWaiting} min` : ''}
                      </div>
                      {c.itemsSummary.length > 0 && (
                        <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.88rem' }}>
                          {c.itemsSummary.map((line, idx) => (
                            <li key={idx}>{line}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card-order-catalog">
              <div className="catalog-header-text">
                <span className="catalog-tag">EN PREPARACIÓN ({enPreparacion.length})</span>
                <h2>En cocina</h2>
              </div>

              {enPreparacion.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  No hay comandas en preparación en este momento.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {enPreparacion.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onNavigate('/kitchen/detail', c.id)}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '0.85rem',
                        cursor: 'pointer',
                        background: '#f8fafc',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.35rem',
                        }}
                      >
                        <strong>
                          Pedido {c.orderNumber ? `#${c.orderNumber}` : `#${c.id.slice(0, 6)}`}
                        </strong>
                        <span className="status-badge available">{c.status}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.4rem' }}>
                        {c.tableOrType}
                        {c.assignedCook ? ` · Cocinero: ${c.assignedCook}` : ''}
                      </div>
                      {c.itemsSummary.length > 0 && (
                        <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.88rem' }}>
                          {c.itemsSummary.map((line, idx) => (
                            <li key={idx}>{line}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}