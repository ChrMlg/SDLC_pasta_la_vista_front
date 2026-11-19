import React, { useState, useEffect, useCallback } from 'react';
import './cocina.css';

interface DetalleComandaProps {
  onNavigate: (path: string, comandaId?: string) => void;
  comandaId?: string;
  branchId?: string;
}

export function DetalleComandaApp({
  onNavigate,
  comandaId,
  branchId = 'a1111111-1111-4111-8111-111111111111',
}: DetalleComandaProps) {
  const [status, setStatus] = useState<string>('PENDING');
  const [orderNumber, setOrderNumber] = useState<number | string | null>(null);
  const [assignedCook, setAssignedCook] = useState<string>('Sin asignar');
  const [readyCount, setReadyCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const loadComandaDetail = useCallback(async () => {
    if (!comandaId) return;
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/branches/${branchId}/kitchen/orders`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) return;

      const payload = await res.json();
      const list: any[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.orders)
        ? payload.orders
        : [];

      const found = list.find((o) => String(o?.orderId ?? o?.id ?? '') === String(comandaId));
      if (!found) return;

      setStatus(String(found.status ?? found.state ?? 'PENDING').toUpperCase());
      if (found.orderNumber !== undefined) setOrderNumber(found.orderNumber);

      if (typeof found.assignedCook === 'string') {
        setAssignedCook(found.assignedCook);
      } else if (found.assignedCook && typeof found.assignedCook === 'object') {
        setAssignedCook(found.assignedCook.name || 'Asignado');
      } else if (found.cookName) {
        setAssignedCook(found.cookName);
      } else {
        setAssignedCook('Sin asignar');
      }

      if (Array.isArray(found.items)) {
        const ready = found.items.filter((i: any) => i?.isReady || i?.status === 'READY').length;
        setReadyCount(ready);
        setPendingCount(found.items.length - ready);
      }
    } catch {
      // Mantiene los valores actuales si el endpoint no devuelve la orden
    } finally {
      setLoading(false);
    }
  }, [branchId, comandaId]);

  useEffect(() => {
    loadComandaDetail();
  }, [loadComandaDetail]);

  const handleTake = async () => {
    if (!comandaId) {
      setError('Selecciona una comanda activa para poder tomarla.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setMessage('');

      const res = await fetch(`/api/branches/${branchId}/kitchen/orders/${comandaId}/take`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 409) {
        setError('Otro cocinero ya tomó esta comanda. Actualizando lista...');
        await loadComandaDetail();
        return;
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message || `No se pudo tomar la comanda (${res.status}).`);
      }

      setStatus('IN_PREPARATION');
      setMessage('Comanda tomada correctamente. Ahora puedes marcar los platillos listos.');
      await loadComandaDetail();
    } catch (err: any) {
      setError(err?.message || 'Error al tomar la comanda.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = async () => {
    if (!comandaId) {
      setError('Selecciona una comanda activa para poder liberarla.');
      return;
    }

    if (readyCount > 0) {
      setError('No se puede liberar la comanda porque ya tiene platillos listos.');
      return;
    }

    const confirmed = window.confirm(
      '¿Seguro que deseas liberar esta comanda y devolverla a pendientes?'
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);
      setError('');
      setMessage('');

      const res = await fetch(`/api/branches/${branchId}/kitchen/orders/${comandaId}/release`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message || `No se pudo liberar la comanda (${res.status}).`);
      }

      setStatus('PENDING');
      setAssignedCook('Sin asignar');
      setMessage('Comanda liberada a pendientes.');
      onNavigate('/kitchen');
    } catch (err: any) {
      setError(err?.message || 'Error al liberar la comanda.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cocina-container">
      <main className="cocina-content">
        <div className="cocina-title-row">
          <div>
            <h1>Tomar o liberar una comanda</h1>
            <p className="subtitle-desc">H7 · Gestión de asignación de comanda en cocina.</p>
          </div>
          <button
            type="button"
            className="btn-cocina btn-primary"
            onClick={() => onNavigate('/kitchen/items', comandaId)}
          >
            Marcar platillos listos (H8) →
          </button>
        </div>

        {error && <div className="kitchen-notice-box kitchen-notice-warning">{error}</div>}
        {message && <div className="kitchen-notice-box kitchen-notice-success">{message}</div>}

        <div className="card-cocina-panel">
          <div className="live-header-row">
            <div>
              <span className="catalog-tag">PEDIDO ACTIVO</span>
              <h2 className="panel-title">Gestión de comanda</h2>
              <p className="panel-subtitle">Solo una persona puede tomar la comanda a la vez.</p>
            </div>
            <button
              type="button"
              className="btn-cocina btn-dark"
              onClick={loadComandaDetail}
              disabled={loading || submitting}
            >
              {loading ? 'Cargando...' : 'Refrescar'}
            </button>
          </div>

          <div className="detalle-box">
            <div className="detalle-header">
              <strong>
                {orderNumber
                  ? `Pedido #${orderNumber}`
                  : comandaId
                  ? `Comanda #${comandaId.slice(0, 8)}`
                  : 'Sin comanda seleccionada'}
              </strong>
              <span className="comanda-badge">{status}</span>
            </div>

            <div className="detalle-row">
              <span>Tomada por</span>
              <strong>{assignedCook}</strong>
            </div>

            <div className="detalle-row">
              <span>Platillos listos / pendientes</span>
              <strong>
                {readyCount} listos · {pendingCount} pendientes
              </strong>
            </div>
          </div>

          <div className="kitchen-notice-box kitchen-notice-warning">
            Liberar requiere confirmación y únicamente es posible si todavía no hay platillos listos.
          </div>

          <div className="kitchen-notice-box">
            Si otro cocinero ya tomó la comanda, mostrar conflicto y actualizar la lista.
          </div>

          <div className="detalle-actions">
            <div className="flex-gap-sm">
              <button
                type="button"
                className="btn-cocina btn-primary"
                disabled={submitting || status === 'IN_PREPARATION' || status === 'PREPARING'}
                onClick={handleTake}
              >
                {submitting ? 'Procesando...' : 'Preparar comanda'}
              </button>

              <button
                type="button"
                className="btn-cocina btn-secondary"
                disabled={submitting || readyCount > 0}
                onClick={handleRelease}
              >
                Liberar a pendientes
              </button>
            </div>

            <button
              type="button"
              className="btn-cocina btn-secondary"
              onClick={() => onNavigate('/kitchen')}
            >
              ← Volver a comandas
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}