import React, { useState, useEffect, useCallback } from 'react';
import './cocina.css';

interface KitchenOrderRaw {
  id?: string;
  orderId?: string;
  status?: string;
  state?: string;
  serviceType?: string;
  tableNumber?: string | null;
  tableName?: string | null;
  minutesWaiting?: number;
  createdAt?: string;
  assignedCook?: string | { name?: string } | null;
  items?: Array<{
    name?: string;
    dishName?: string;
    menuItem?: { name?: string };
    quantity?: number;
  }>;
}

interface ComandaCardData {
  id: string;
  status: string;
  tableOrType: string;
  itemsSummary: string[];
  minutesWaiting?: number;
  assignedCook?: string;
}

const BRANCH_MAP: Record<string, string> = {
  Centro: 'a1111111-1111-4111-8111-111111111111',
  Bambú: 'a2222222-2222-4222-8222-222222222222',
  Ramblas: 'a3333333-3333-4333-8333-333333333333',
};

function normalizeComanda(raw: KitchenOrderRaw): ComandaCardData {
  const id = String(raw.id ?? raw.orderId ?? '');
  const status = String(raw.status ?? raw.state ?? 'PENDING').toUpperCase();

  const tableLabel = raw.tableNumber || raw.tableName;
  const serviceLabel = raw.serviceType === 'TAKEAWAY' ? 'Para llevar' : 'En mesa';
  const tableOrType = tableLabel ? `${tableLabel} · ${serviceLabel}` : serviceLabel;

  const itemsSummary = Array.isArray(raw.items)
    ? raw.items.map((item) => {
        const name = item.name || item.dishName || item.menuItem?.name || 'Platillo';
        const qty = item.quantity ? `${item.quantity}x ` : '';
        return `${qty}${name}`;
      })
    : [];

  let minutesWaiting = raw.minutesWaiting;
  if (minutesWaiting === undefined && raw.createdAt) {
    const diffMs = Date.now() - new Date(raw.createdAt).getTime();
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
    status,
    tableOrType,
    itemsSummary,
    minutesWaiting,
    assignedCook,
  };
}

export function ComandasCocinaApp({ onNavigate }: { onNavigate: (path: string, comandaId?: string) => void }) {
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
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.orders)
        ? payload.orders
        : [];

      const normalized = rawList.map(normalizeComanda);

      const pendingList = normalized.filter(
        (c) => c.status === 'PENDING' || c.status === 'PENDIENTE' || c.status === 'RECEIVED' || c.status === 'CREATED'
      );
      const preparingList = normalized.filter(
        (c) =>
          c.status === 'IN_PREPARATION' ||
          c.status === 'PREPARING' ||
          c.status === 'EN_PREPARACION' ||
          c.status === 'TAKEN'
      );

      const knownIds = new Set([...pendingList.map((p) => p.id), ...preparingList.map((p) => p.id)]);
      const remaining = normalized.filter((c) => !knownIds.has(c.id));

      setPendientes([...pendingList, ...remaining]);
      setEnPreparacion(preparingList);
      setConnected(true);
      setLastSyncLabel(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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

  const handleOpenDetail = (comandaId?: string) => {
    const targetId = comandaId || pendientes[0]?.id || enPreparacion[0]?.id || 'preview-order-001';
    onNavigate('/kitchen/detail', targetId);
  };

  return (
    <div className="cocina-container">
      <header className="cocina-header-bar">
        <div className="breadcrumb">
          Cocina / <strong>Comandas de cocina</strong>
        </div>
        <div className="header-controls">
          <select
            className="branch-select"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="Centro">Centro</option>
            <option value="Bambú">Bambú</option>
            <option value="Ramblas">Ramblas</option>
          </select>
          <span className="branch-badge">{selectedBranch} · Cocina</span>
        </div>
      </header>

      <main className="cocina-content">
        <div className="cocina-title-row">
          <div>
            <h1>Comandas de cocina</h1>
            <p className="subtitle-desc">H6 · Cola de órdenes activas por sucursal en tiempo real.</p>
          </div>
          <button
            type="button"
            className="btn-cocina-primary"
            onClick={() => handleOpenDetail()}
          >
            Abrir H7 · Tomar / Liberar comanda
          </button>
        </div>

        {error && <div className="kitchen-notice-box kitchen-notice-warning">{error}</div>}

        <div className="card-cocina-panel">
          <div className="live-header-row">
            <div>
              <span className="catalog-tag">OPERACIÓN EN VIVO</span>
              <h2 className="live-panel-title">Comandas de {selectedBranch}</h2>
              <p className="live-panel-subtitle">
                Cola de ingreso por antigüedad, actualizada cada 5 segundos.
              </p>
            </div>
            <div className="live-actions-group">
              <div className="live-buttons-row">
                <button
                  type="button"
                  className="btn-cocina-primary"
                  onClick={() => handleOpenDetail()}
                >
                  Ver detalle (H7)
                </button>
                <button
                  type="button"
                  className="btn-cocina-dark"
                  onClick={fetchComandas}
                >
                  Actualizar
                </button>
                <div className={`connection-pill ${!connected ? 'disconnected' : ''}`}>
                  <span className="connection-dot"></span>
                  {connected ? 'Conectado' : 'Sin conexión'}
                </div>
              </div>
              <span className="sync-time">Última sync: {lastSyncLabel}</span>
            </div>
          </div>

          <div className="kitchen-columns-grid">
            {/* Columna de Pendientes */}
            <div className="kitchen-column">
              <div className="column-title">
                <span>Pendientes</span>
                <span className="pill-count">{pendientes.length}</span>
              </div>

              {loading && pendientes.length === 0 ? (
                <div className="empty-column-state">Cargando comandas pendientes...</div>
              ) : pendientes.length === 0 ? (
                <div className="empty-column-state">
                  No hay comandas pendientes. Las órdenes nuevas aparecerán aquí en tiempo real.
                </div>
              ) : (
                pendientes.map((c) => {
                  const isOverdue = typeof c.minutesWaiting === 'number' && c.minutesWaiting > 15;
                  return (
                    <div
                      key={c.id}
                      className={`comanda-card ${isOverdue ? 'overdue' : ''}`}
                      onClick={() => handleOpenDetail(c.id)}
                    >
                      <div className="comanda-card-top">
                        <span className="comanda-origin">{c.tableOrType}</span>
                        <span className="comanda-badge">
                          {isOverdue ? `+15 min (${c.minutesWaiting}m)` : 'Pendiente'}
                        </span>
                      </div>

                      {c.itemsSummary.length > 0 && (
                        <ul className="comanda-items-list">
                          {c.itemsSummary.map((line, idx) => (
                            <li key={`${c.id}-${idx}`}>{line}</li>
                          ))}
                        </ul>
                      )}

                      <div className="comanda-card-footer">
                        <span>#{c.id.slice(0, 8)}</span>
                        <button
                          type="button"
                          className="btn-cocina-mini"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(c.id);
                          }}
                        >
                          Gestionar (H7)
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Columna En preparación */}
            <div className="kitchen-column">
              <div className="column-title">
                <span>En preparación</span>
                <span className="pill-count">{enPreparacion.length}</span>
              </div>

              {loading && enPreparacion.length === 0 ? (
                <div className="empty-column-state">Cargando comandas en preparación...</div>
              ) : enPreparacion.length === 0 ? (
                <div className="empty-column-state">No hay comandas en preparación actualmente.</div>
              ) : (
                enPreparacion.map((c) => (
                  <div
                    key={c.id}
                    className="comanda-card"
                    onClick={() => handleOpenDetail(c.id)}
                  >
                    <div className="comanda-card-top">
                      <span className="comanda-origin">{c.tableOrType}</span>
                      <span className="comanda-badge">En preparación</span>
                    </div>

                    {c.itemsSummary.length > 0 && (
                      <ul className="comanda-items-list">
                        {c.itemsSummary.map((line, idx) => (
                          <li key={`${c.id}-${idx}`}>{line}</li>
                        ))}
                      </ul>
                    )}

                    <div className="comanda-card-footer">
                      <span>{c.assignedCook ? `Cocina: ${c.assignedCook}` : `#${c.id.slice(0, 8)}`}</span>
                      <button
                        type="button"
                        className="btn-cocina-mini"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(c.id);
                        }}
                      >
                        Gestionar (H7)
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="kitchen-notice-box">
            Las pendientes de más de 15 min se resaltan. Los pedidos para llevar entran solo tras pago PAID.
          </div>
        </div>
      </main>
    </div>
  );
}