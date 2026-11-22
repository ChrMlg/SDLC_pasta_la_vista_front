import React, { useState, useEffect } from 'react';
import { BRANCHES, DEFAULT_BRANCH_ID } from '../../../shared/api-client';
import {
  fetchAllWaiterMenuItems,
  fetchBranchTables,
  createWaiterOrder,
  BranchTableOption,
} from './mesero-order-api';
import './mesero-order.css';

// TODO: Configure only after the backend's orderable table statuses are confirmed.
const ORDERABLE_TABLE_STATUSES: readonly string[] | null = null;

interface OrderItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  quantity: number;
}

interface MeseroNuevoPedidoProps {
  onNavigate: (path: string) => void;
  defaultBranchId?: string | null;
}

export function MeseroNuevoPedidoApp({ onNavigate, defaultBranchId }: MeseroNuevoPedidoProps) {
  const [branchId, setBranchId] = useState(defaultBranchId || DEFAULT_BRANCH_ID);
  const [serviceType, setServiceType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [tables, setTables] = useState<BranchTableOption[]>([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [activeTab, setActiveTab] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const selectedBranchLabel =
    BRANCHES.find((b) => b.id === branchId)?.label.toUpperCase() || 'SUCURSAL';

  const loadWaiterBranchData = async () => {
    try {
      setLoading(true);
      setError('');
      setItems([]);
      setTables([]);
      setSelectedTableId('');

      const [allMenuItems, branchTables] = await Promise.all([
        fetchAllWaiterMenuItems(branchId),
        fetchBranchTables(branchId).catch(() => []),
      ]);

      setItems(
        allMenuItems.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: Number(item.price),
          isAvailable: item.isAvailable,
          quantity: 0,
        }))
      );

      setTables(branchTables);
      const firstOrderableTable = ORDERABLE_TABLE_STATUSES
        ? branchTables.find((table) => ORDERABLE_TABLE_STATUSES.includes(table.status ?? ''))
        : branchTables[0];
      if (firstOrderableTable) {
        setSelectedTableId(firstOrderableTable.id);
      }
    } catch (err: any) {
      setItems([]);
      setError(err.message || 'No se pudo cargar el menú de la sucursal seleccionada.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWaiterBranchData();
  }, [branchId]);

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      STARTER: 'Entrada',
      MAIN_COURSE: 'Plato fuerte',
      DRINK: 'Bebida',
      DESSERT: 'Postre',
    };
    return map[cat] || cat;
  };

  const handleQuantityChange = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id && item.isAvailable) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryLabel = getCategoryLabel(item.category);
    const matchesTab =
      activeTab === 'Todos' ||
      (activeTab === 'Entradas' && categoryLabel === 'Entrada') ||
      (activeTab === 'Platos fuertes' && categoryLabel === 'Plato fuerte') ||
      (activeTab === 'Bebidas' && categoryLabel === 'Bebida') ||
      (activeTab === 'Postres' && categoryLabel === 'Postre');
    return matchesSearch && matchesTab;
  });

  const subtotal = items.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);
  const selectedCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleConfirmOrder = async () => {
    if (subtotal === 0) {
      setError('Debes seleccionar al menos un platillo disponible para el pedido.');
      return;
    }

    if (serviceType === 'DINE_IN' && !selectedTableId) {
      setError('Selecciona una mesa válida de la sucursal para pedidos en mesa.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccessMsg('');

      const orderItems = items
        .filter((item) => item.quantity > 0)
        .map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
          ...(specialNotes.trim() ? { notes: specialNotes.trim() } : {}),
        }));

      await createWaiterOrder({
        branchId,
        serviceType,
        tableId: serviceType === 'DINE_IN' ? selectedTableId : null,
        items: orderItems,
      });

      setSuccessMsg('¡Pedido registrado y enviado a cocina con éxito!');
      setItems((prev) => prev.map((item) => ({ ...item, quantity: 0 })));
      setSpecialNotes('');
      setTimeout(() => {
        onNavigate('/waiter/orders');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mesero-container">
      <header className="mesero-header-bar">
        <div className="breadcrumb">
          Mesero / <strong>Registro de pedido por mesero</strong>
        </div>
      </header>

      <main className="mesero-content">
        <div className="meta-info">
          <span className="route-tag">/waiter/orders/new</span>
        </div>

        <h1>Registro de pedido por mesero</h1>

        <div className="card-order-catalog">
          <div className="catalog-header-text">
            <span className="catalog-tag">SUCURSAL {selectedBranchLabel}</span>
            <h2>Tomar nuevo pedido</h2>
            <p>Puedes registrar varios pedidos sincronizados en tiempo real con la disponibilidad del menú.</p>
          </div>

          {error && (
            <div
              className="alert-error"
              style={{
                background: '#ef4444',
                color: '#fff',
                padding: '0.6rem 0.9rem',
                borderRadius: '6px',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          {successMsg && (
            <div
              className="alert-success"
              style={{
                background: '#059669',
                color: '#fff',
                padding: '0.6rem 0.9rem',
                borderRadius: '6px',
                marginBottom: '1rem',
              }}
            >
              {successMsg}
            </div>
          )}

          <div className="order-options-grid">
            <div className="form-group">
              <label>Sucursal</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Servicio</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as 'DINE_IN' | 'TAKEAWAY')}
              >
                <option value="DINE_IN">En mesa · DINE_IN</option>
                <option value="TAKEAWAY">Para llevar · TAKEAWAY</option>
              </select>
            </div>
          </div>

          {serviceType === 'DINE_IN' && (
            <div className="order-options-grid">
              <div className="form-group">
                <label>Mesa</label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  disabled={tables.length === 0}
                >
                  {tables.length === 0 ? (
                    <option value="">Sin mesas disponibles</option>
                  ) : (
                    tables.map((t) => (
                      <option
                        key={t.id}
                        value={t.id}
                        disabled={ORDERABLE_TABLE_STATUSES !== null
                          && !ORDERABLE_TABLE_STATUSES.includes(t.status ?? '')}
                      >
                        {t.label} · {t.status ?? 'Estado desconocido'}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div />
            </div>
          )}

          <div className="menu-filter-section">
            <div className="form-group search-bar-mesero">
              <label>Buscar platillo en el menú</label>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="category-tabs-mesero">
              {['Todos', 'Entradas', 'Platos fuertes', 'Bebidas', 'Postres'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`tab-btn-mesero ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="order-items-list">
            {loading ? (
              <div className="empty-menu-state">Cargando menú del servidor...</div>
            ) : filteredItems.length === 0 ? (
              <div className="empty-menu-state">No se encontraron platillos con ese filtro.</div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`order-item-row ${!item.isAvailable ? 'item-unavailable' : ''} ${
                    item.quantity > 0 ? 'item-selected' : ''
                  }`}
                >
                  <div className="dish-info-left">
                    <div
                      className={`status-dot ${item.isAvailable ? 'available' : 'unavailable'}`}
                      style={{ background: item.isAvailable ? '#059669' : '#ef4444' }}
                    />
                    <div>
                      <h4 className="item-title">{item.name}</h4>
                      <span className="item-sub">
                        {getCategoryLabel(item.category)} ·{' '}
                        <strong
                          className={item.isAvailable ? 'text-avail' : 'text-unavail'}
                          style={{ color: item.isAvailable ? '#059669' : '#ef4444' }}
                        >
                          {item.isAvailable ? 'Disponible' : 'No disponible'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="dish-action-right">
                    <span className="item-unit-price">${Number(item.price).toFixed(2)}</span>
                    <div className="stepper-control">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, -1)}
                        disabled={!item.isAvailable || item.quantity === 0 || submitting}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, 1)}
                        disabled={!item.isAvailable || submitting}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="form-group notes-group">
            <label>Notas especiales por platillo</label>
            <textarea
              rows={3}
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="Ej. Sin cebolla, término medio..."
            />
          </div>

          <div className="order-totals-row">
            <div>
              <span>Total antes de IVA</span>
              <span className="items-selected-pill">{selectedCount} platillo(s) seleccionados</span>
            </div>
            <span className="total-amount">${subtotal.toFixed(2)}</span>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-primary-green btn-full"
              disabled={submitting || subtotal === 0}
              onClick={handleConfirmOrder}
              style={{
                background: '#059669',
                color: '#fff',
                padding: '0.75rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                width: '100%',
              }}
            >
              {submitting ? 'Confirmando pedido...' : 'Confirmar pedido'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}