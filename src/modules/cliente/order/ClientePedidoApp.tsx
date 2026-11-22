import React, { useState, useEffect } from 'react';
import { BRANCHES, DEFAULT_BRANCH_ID } from '../../../shared/api-client';
import {
  ActiveTableSelection,
  BranchTableInfo,
  COMPANION_ROUTES,
} from '../../../shared/module-bridges';
import {
  assignCustomerTable,
  fetchAllCustomerOrderMenuItems,
  getCustomerSeatingState,
} from './cliente-order-api';
import './cliente-order.css';

const TABLE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  OCCUPIED: 'Ocupada',
  NEEDS_CLEANING: 'Por limpiar',
  RESERVED: 'Reservada',
  OUT_OF_SERVICE: 'Fuera de servicio',
};

interface DishItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  quantity: number;
}

export function ClientePedidoApp({
  onNavigate,
}: {
  onNavigate: (path: string, orderData?: any) => void;
}) {
  const [branchId, setBranchId] = useState(DEFAULT_BRANCH_ID);
  const [serviceType, setServiceType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [activeTable, setActiveTable] = useState<ActiveTableSelection | null>(null);
  const [tables, setTables] = useState<BranchTableInfo[]>([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [assigningTable, setAssigningTable] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Todos');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<DishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadClientContext = async () => {
    try {
      setLoading(true);
      setError('');

      const [allDishes, seating] = await Promise.all([
        fetchAllCustomerOrderMenuItems(branchId),
        getCustomerSeatingState(branchId),
      ]);

      setActiveTable(seating.activeSelection);
      setTables(seating.tables);

      if (seating.activeSelection && seating.activeSelection.branchId === branchId) {
        setSelectedTableId(seating.activeSelection.tableId);
      } else if (seating.tables.length > 0) {
        const firstAvailable =
          seating.tables.find((t) => t.status === 'AVAILABLE') || seating.tables[0];
        setSelectedTableId(firstAvailable.id);
      } else {
        setSelectedTableId('');
      }

      setItems((prev) => {
        const qtyMap = new Map(prev.map((i) => [i.id, i.quantity]));
        return allDishes.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: Number(item.price),
          isAvailable: item.isAvailable,
          quantity: qtyMap.get(item.id) || 0,
        }));
      });
    } catch (err: any) {
      setError(err.message || 'No se pudo conectar con el servidor para cargar el menú.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientContext();
  }, [branchId]);

  const handleAssignTable = async () => {
    if (!selectedTableId) return;
    try {
      setAssigningTable(true);
      setError('');
      await assignCustomerTable(branchId, selectedTableId);
      await loadClientContext();
    } catch (err: any) {
      setError(
        err.message ||
          'No se pudo asignar la mesa. Selecciona una mesa disponible e inténtalo de nuevo.'
      );
    } finally {
      setAssigningTable(false);
    }
  };

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
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  const selectedBranchLabel = BRANCHES.find((b) => b.id === branchId)?.label || 'Centro';
  const hasValidTableForBranch =
    Boolean(activeTable?.tableId) && activeTable?.branchId === branchId;
  const resolvedTableId = hasValidTableForBranch
    ? activeTable!.tableId
    : selectedTableId || null;

  const handleReviewOrder = () => {
    if (subtotal === 0) {
      setError('Pedido vacío. Añade al menos un platillo disponible desde el menú.');
      return;
    }

    onNavigate('/orders/review', {
      branchId,
      selectedBranch: selectedBranchLabel,
      serviceType,
      tableId: serviceType === 'DINE_IN' ? resolvedTableId : null,
      tableNumber:
        serviceType === 'DINE_IN'
          ? activeTable?.tableNumber
            ? `Mesa ${String(activeTable.tableNumber).padStart(2, '0')}`
            : tables.find((t) => t.id === resolvedTableId)
            ? `Mesa ${String(tables.find((t) => t.id === resolvedTableId)!.number).padStart(2, '0')}`
            : 'Sin mesa asignada'
          : undefined,
      notes,
      items,
      subtotal,
    });
  };

  return (
    <div className="cliente-container">
      <header className="cliente-header-bar">
        <div className="breadcrumb">
          Cliente / <strong>Pedido por autoservicio</strong>
        </div>
      </header>

      <main className="cliente-content">
        <div className="meta-info">

        </div>

        <h1>Pedido por autoservicio</h1>
        <p className="subtitle-desc">
          Selecciona tus platillos disponibles en tiempo real.
        </p>

        {error && <div className="alert-error-box">{error}</div>}

        <div className="card-order-catalog">
          <div style={{ marginBottom: '1.25rem' }}>
            <span className="catalog-tag">PEDIDO DIGITAL</span>
            <h2 style={{ margin: '0.2rem 0' }}>Arma tu pedido</h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
              Los platillos se sincronizan con la disponibilidad configurada por el gerente.
            </p>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label>Sucursal</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <div className="service-toggle-tabs">
            <button
              type="button"
              className={`toggle-btn ${serviceType === 'DINE_IN' ? 'active' : ''}`}
              onClick={() => setServiceType('DINE_IN')}
            >
              En mesa
            </button>
            <button
              type="button"
              className={`toggle-btn ${serviceType === 'TAKEAWAY' ? 'active' : ''}`}
              onClick={() => setServiceType('TAKEAWAY')}
            >
              Para llevar
            </button>
          </div>

          {serviceType === 'DINE_IN' ? (
            <div className="info-banner">
              {hasValidTableForBranch ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span>
                    Mesa vigente asignada en {selectedBranchLabel}:{' '}
                    <strong>
                      Mesa {String(activeTable?.tableNumber ?? '').padStart(2, '0')}
                    </strong>{' '}
                    ({activeTable?.tableId.slice(0, 8)}…)
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onNavigate(COMPANION_ROUTES.seatingRoute)}
                  >
                    Cambiar mesa
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                      value={selectedTableId}
                      onChange={(e) => setSelectedTableId(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      {tables.length === 0 ? (
                        <option value="">Sin mesas disponibles</option>
                      ) : (
                        tables.map((t) => (
                          <option key={t.id} value={t.id} disabled={t.status !== 'AVAILABLE'}>
                            Mesa {String(t.number).padStart(2, '0')} · {TABLE_STATUS_LABELS[t.status] ?? t.status}
                          </option>
                        ))
                      )}
                    </select>
                    <button
                      type="button"
                      className="btn-primary-green"
                      disabled={!selectedTableId || assigningTable}
                      onClick={handleAssignTable}
                    >
                      {assigningTable ? 'Asignando...' : 'Asignar mesa ahora'}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => onNavigate(COMPANION_ROUTES.seatingRoute)}
                    >
                      Ir a selección de mesa
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="info-banner">
              Para llevar: retiro en sucursal ({selectedBranchLabel}), no
              requiere mesa y entra a cocina tras confirmar el pago
            </div>
          )}

          <div className="menu-filter-section">
            <div className="form-group">
              <label>Buscar platillo en el menú</label>
              <input
                type="text"
                placeholder="Buscar platillo..."
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
              <div className="empty-menu-state">
                No hay platillos disponibles para esta selección.
              </div>
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
                      className="status-dot"
                      style={{ background: item.isAvailable ? '#059669' : '#ef4444' }}
                    />
                    <div>
                      <h4 className="item-title">{item.name}</h4>
                      <span className="item-sub">
                        {getCategoryLabel(item.category)} ·{' '}
                        <strong style={{ color: item.isAvailable ? '#059669' : '#ef4444' }}>
                          {item.isAvailable ? `$${Number(item.price).toFixed(2)}` : 'No disponible'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="dish-action-right">
                    <span className="item-unit-price">
                      ${(Number(item.price) * item.quantity).toFixed(2)}
                    </span>
                    <div className="stepper-control">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, -1)}
                        disabled={!item.isAvailable || item.quantity === 0}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, 1)}
                        disabled={!item.isAvailable}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="form-group">
            <label>Notas del pedido (opcional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Sin picante, cubiertos extra..."
            />
          </div>

          <div className="order-totals-row">
            <div>
              <span>Subtotal</span>
              <span className="items-selected-pill">
                Platillos seleccionados: {totalQuantity}
              </span>
            </div>
            <span className="total-amount">${subtotal.toFixed(2)}</span>
          </div>

          <button
            type="button"
            className="btn-primary-green"
            style={{ width: '100%', padding: '0.85rem' }}
            onClick={handleReviewOrder}
          >
            Revisar pedido →
          </button>
        </div>
      </main>
    </div>
  );
}
