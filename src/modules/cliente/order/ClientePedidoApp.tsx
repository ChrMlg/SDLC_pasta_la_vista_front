import React, { useState, useEffect } from 'react';
import './cliente-order.css';

interface DishItem {
  id: string;
  name: string;
  category: string;
  price: number;
  isAvailable: boolean;
  quantity: number;
}

const BRANCH_MAP: Record<string, string> = {
  Centro: 'a1111111-1111-4111-8111-111111111111',
  Bambú: 'a2222222-2222-4222-8222-222222222222',
  Ramblas: 'a3333333-3333-4333-8333-333333333333',
};

export function ClientePedidoApp({ onNavigate }: { onNavigate: (path: string, orderData?: any) => void }) {
  const [selectedBranch, setSelectedBranch] = useState('Centro');
  const [serviceType, setServiceType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [tableNumber, setTableNumber] = useState('Mesa 01');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Todos');

  const [items, setItems] = useState<DishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClientMenu();
  }, [selectedBranch]);

  const loadClientMenu = async () => {
    try {
      setLoading(true);
      setError('');
      const branchId = BRANCH_MAP[selectedBranch] || 'a1111111-1111-4111-8111-111111111111';
      
      const response = await fetch(`/api/branches/${branchId}/menu`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Error al obtener el menú del servidor');
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.data || []);
      
      setItems(list.map((item: any) => ({ ...item, quantity: 0 })));
    } catch (err) {
      setError('No se pudo conectar con el servidor para cargar el menú.');
    } finally {
      setLoading(false);
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
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleReviewOrder = () => {
    if (subtotal === 0) {
      alert('Pedido vacío. Añade artículos desde el menú.');
      return;
    }
    const branchId = BRANCH_MAP[selectedBranch];
    onNavigate('/orders/review', { branchId, selectedBranch, serviceType, tableNumber, items, subtotal });
  };

  return (
    <div className="cliente-container">
      <header className="cliente-header-bar">
        <div className="breadcrumb">Cliente / <strong>Pedido por autoservicio</strong></div>
        <div className="branch-badge">{selectedBranch} · Conectado al Back</div>
      </header>

      <main className="cliente-content">
        <div className="meta-info">
          <span className="badge-h">H5 · CUSTOMER</span>
          <span className="route-tag">/orders/new</span>
        </div>

        <h1>Pedido por autoservicio</h1>
        <p className="subtitle-desc">Selecciona tus platillos disponibles en tiempo real.</p>

        {error && <div className="alert-error" style={{ background: '#ef4444', color: '#fff', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

        <div className="card-order-catalog">
          <div className="catalog-header-text">
            <span className="catalog-tag">PEDIDO DIGITAL</span>
            <h2>Arma tu pedido</h2>
            <p>Los platillos se sincronizan con la disponibilidad del gerente.</p>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label>Sucursal</label>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="form-select-custom"
            >
              <option value="Centro">Centro</option>
              <option value="Bambú">Bambú</option>
              <option value="Ramblas">Ramblas</option>
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
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>Seleccionar Mesa</label>
              <select
                value={tableNumber}
                onChange={e => setTableNumber(e.target.value)}
                className="form-select-custom"
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const num = String(i + 1).padStart(2, '0');
                  return <option key={num} value={`Mesa ${num}`}>Mesa {num}</option>;
                })}
              </select>
            </div>
          ) : (
            <div className="info-banner" style={{ marginBottom: '1.25rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', fontSize: '0.85rem', color: '#64748b' }}>
              Para llevar: retiro directo en sucursal ({selectedBranch}), no requiere mesa.
            </div>
          )}

          <div className="menu-filter-section">
            <div className="form-group search-bar-mesero">
              <label>Buscar platillo en el menú</label>
              <input
                type="text"
                placeholder="Buscar platillo..."
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
              <div className="empty-menu-state">Cargando menú del servidor...</div>
            ) : filteredItems.length === 0 ? (
              <div className="empty-menu-state">No hay platillos disponibles para esta selección.</div>
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
                        {getCategoryLabel(item.category)} · <strong className={item.isAvailable ? 'text-avail' : 'text-unavail'} style={{ color: item.isAvailable ? '#059669' : '#ef4444' }}>
                          {item.isAvailable ? `$${Number(item.price).toFixed(2)}` : 'No disponible'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="dish-action-right">
                    <span className="item-unit-price">${(Number(item.price) * item.quantity).toFixed(2)}</span>
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

          <div className="order-totals-row">
            <div>
              <span className="totals-label-sub">Subtotal</span>
              <div className="totals-sub-desc">Platillos seleccionados: {totalQuantity}</div>
            </div>
            <span className="total-amount">${subtotal.toFixed(2)}</span>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-primary-green btn-full" onClick={handleReviewOrder} style={{ background: '#059669', color: '#fff', padding: '0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
              Revisar pedido →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}