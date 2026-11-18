import React, { useState, useEffect } from 'react';
import { fetchAllWaiterMenuItems, createWaiterOrder } from './mesero-order-api';
import './mesero-order.css';

interface OrderItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  quantity: number;
}

const BRANCH_MAP: Record<string, string> = {
  Centro: 'a1111111-1111-4111-8111-111111111111',
  Bambu: 'a2222222-2222-4222-8222-222222222222',
  Ramblas: 'a3333333-3333-4333-8333-333333333333',
};

export function MeseroNuevoPedidoApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [selectedBranch, setSelectedBranch] = useState('Centro');
  const [serviceType, setServiceType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [tableNumber, setTableNumber] = useState('Mesa 01');
  const [activeTab, setActiveTab] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadWaiterMenu = async () => {
    try {
      setLoading(true);
      setError('');
      const branchId = BRANCH_MAP[selectedBranch] || 'a1111111-1111-4111-8111-111111111111';
      
      const allMenuItems = await fetchAllWaiterMenuItems(branchId);

      setItems(prevItems => {
        const qtyMap = new Map(prevItems.map(i => [i.id, i.quantity]));
        return allMenuItems.map(item => ({
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
    loadWaiterMenu();
  }, [selectedBranch]);

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
    setItems(prev =>
      prev.map(item => {
        if (item.id === id && item.isAvailable) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const filteredItems = items.filter(item => {
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
      alert('Debes seleccionar al menos un platillo disponible para el pedido.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const branchId = BRANCH_MAP[selectedBranch] || 'a1111111-1111-4111-8111-111111111111';

      const orderItems = items
        .filter(item => item.quantity > 0)
        .map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
          notes: specialNotes || undefined,
        }));

      await createWaiterOrder({
        branchId,
        serviceType,
        tableNumber: serviceType === 'DINE_IN' ? tableNumber : null,
        items: orderItems,
      });

      alert('¡Pedido registrado y enviado a cocina con éxito!');
      onNavigate('/waiter/orders/confirm');
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
          <div className="catalog-header-text" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="catalog-tag">GESTIÓN DE PEDIDOS</span>
              <h2>Tomar nuevo pedido</h2>
              <p>Registra el pedido para enviar directamente a cocina respetando la disponibilidad.</p>
            </div>
            <button 
              type="button"
              onClick={loadWaiterMenu}
              style={{ background: '#334155', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              🔄 Actualizar menú
            </button>
          </div>

          {error && <div className="alert-error" style={{ background: '#ef4444', color: '#fff', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

          <div className="order-options-grid">
            <div className="form-group">
              <label>Sucursal</label>
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
              >
                <option value="Centro">Centro</option>
                <option value="Bambu">Bambu</option>
                <option value="Ramblas">Ramblas</option>
              </select>
            </div>

            <div className="form-group">
              <label>Servicio</label>
              <select
                value={serviceType}
                onChange={e => setServiceType(e.target.value as 'DINE_IN' | 'TAKEAWAY')}
              >
                <option value="DINE_IN">En mesa · DINE_IN</option>
                <option value="TAKEAWAY">Para llevar · TAKEAWAY</option>
              </select>
            </div>

            <div className="form-group">
              <label>Mesa</label>
              <select
                value={tableNumber}
                onChange={e => setTableNumber(e.target.value)}
                disabled={serviceType === 'TAKEAWAY'}
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const num = String(i + 1).padStart(2, '0');
                  return (
                    <option key={num} value={`Mesa ${num}`}>
                      Mesa {num}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="menu-filter-section">
            <div className="form-group search-bar-mesero">
              <label>Buscar platillo en el menú ({filteredItems.length} disponibles en vista)</label>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="category-tabs-mesero">
              {['Todos', 'Entradas', 'Platos fuertes', 'Bebidas', 'Postres'].map(tab => (
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
              <div className="empty-menu-state">Cargando catálogo completo del servidor...</div>
            ) : filteredItems.length === 0 ? (
              <div className="empty-menu-state">No se encontraron platillos con ese filtro.</div>
            ) : (
              filteredItems.map(item => (
                <div
                  key={item.id}
                  className={`order-item-row ${!item.isAvailable ? 'item-unavailable' : ''} ${
                    item.quantity > 0 ? 'item-selected' : ''
                  }`}
                >
                  <div className="dish-info-left">
                    <div className={`status-dot ${item.isAvailable ? 'available' : 'unavailable'}`} style={{ background: item.isAvailable ? '#059669' : '#ef4444' }}></div>
                    <div>
                      <h4 className="item-title">{item.name}</h4>
                      <span className="item-sub">
                        {getCategoryLabel(item.category)} ·{' '}
                        <strong className={item.isAvailable ? 'text-avail' : 'text-unavail'} style={{ color: item.isAvailable ? '#059669' : '#ef4444' }}>
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

          <div className="form-group notes-group">
            <label>Notas especiales por pedido</label>
            <textarea
              rows={3}
              value={specialNotes}
              onChange={e => setSpecialNotes(e.target.value)}
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
              onClick={handleConfirmOrder} 
              disabled={submitting}
              style={{ background: '#059669', color: '#fff', padding: '0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
            >
              {submitting ? 'Enviando a cocina...' : 'Confirmar y enviar a cocina'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}