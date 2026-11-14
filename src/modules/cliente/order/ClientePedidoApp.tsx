import React, { useState } from 'react';
import './cliente-order.css';

interface DishItem {
  id: string;
  name: string;
  category: 'Entrada' | 'Plato fuerte' | 'Bebida' | 'Postre';
  price: number;
  isAvailable: boolean;
  quantity: number;
}

export function ClientePedidoApp({ onNavigate }: { onNavigate: (path: string, orderData?: any) => void }) {
  const [selectedBranch, setSelectedBranch] = useState('Centro');
  const [serviceType, setServiceType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [tableNumber, setTableNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Todos');

  // Platillos del menú con cantidad inicial en 0 (nada seleccionado por defecto)
  const [items, setItems] = useState<DishItem[]>([
    { id: '1', name: 'Pasta al pesto', category: 'Plato fuerte', price: 12.50, isAvailable: true, quantity: 0 },
    { id: '2', name: 'Bruschettas', category: 'Entrada', price: 6.50, isAvailable: true, quantity: 0 },
    { id: '3', name: 'Tarta de limón', category: 'Postre', price: 6.00, isAvailable: true, quantity: 0 },
    { id: '4', name: 'Limonada natural', category: 'Bebida', price: 5.00, isAvailable: true, quantity: 0 },
    { id: '5', name: 'Pollo al horno', category: 'Plato fuerte', price: 13.25, isAvailable: true, quantity: 0 },
    { id: '6', name: 'Ensalada fresca', category: 'Entrada', price: 7.25, isAvailable: false, quantity: 0 },
  ]);

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
    const matchesTab =
      activeTab === 'Todos' ||
      (activeTab === 'Entradas' && item.category === 'Entrada') ||
      (activeTab === 'Platos fuertes' && item.category === 'Plato fuerte') ||
      (activeTab === 'Bebidas' && item.category === 'Bebida') ||
      (activeTab === 'Postres' && item.category === 'Postre');
    return matchesSearch && matchesTab;
  });

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleReviewOrder = () => {
    if (subtotal === 0) {
      alert('Pedido vacío. Añade artículos desde el menú.');
      return;
    }
    onNavigate('/orders/review', { selectedBranch, serviceType, tableNumber, items, subtotal });
  };

  return (
    <div className="cliente-container">
      <header className="cliente-header-bar">
        <div className="breadcrumb">Cliente / <strong>Pedido por autoservicio</strong></div>
        <div className="branch-badge">{selectedBranch} · Vista de ejemplo</div>
      </header>

      <main className="cliente-content">
        <div className="meta-info">
          <span className="badge-h">H5 · CUSTOMER</span>
          <span className="route-tag">/orders/new</span>
        </div>

        <h1>Pedido por autoservicio</h1>
        <p className="subtitle-desc">Pantalla individual · Prototipo para diseñar y programar el sitio web</p>

        <div className="card-order-catalog">
          <div className="catalog-header-text">
            <span className="catalog-tag">PEDIDO DIGITAL</span>
            <h2>Arma tu pedido</h2>
            <p>Los platillos deben estar disponibles en la sucursal seleccionada.</p>
          </div>

          {/* Campo selector de Sucursales */}
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

          {/* Selector de servicio: En mesa / Para llevar */}
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

          {/* Selector de mesa condicional */}
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
              <small className="info-small-text">En mesa: asignación válida de la {tableNumber}.</small>
            </div>
          ) : (
            <div className="info-banner">
              Para llevar: retiro directo en sucursal ({selectedBranch}), no requiere mesa.
            </div>
          )}

          {/* Buscador y pestañas de categorías del menú */}
          <div className="menu-filter-section">
            <div className="form-group search-bar-mesero">
              <label>Buscar platillo en el menú</label>
              <input
                type="text"
                placeholder="Buscar platillo por nombre..."
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

          {/* Listado de platillos con controles - y + */}
          <div className="order-items-list">
            {filteredItems.length === 0 ? (
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
                    <div className={`status-dot ${item.isAvailable ? 'available' : 'unavailable'}`}></div>
                    <div>
                      <h4 className="item-title">{item.name}</h4>
                      <span className="item-sub">
                        {item.category} · <strong className={item.isAvailable ? 'text-avail' : 'text-unavail'}>
                          {item.isAvailable ? `$${item.price.toFixed(2)}` : 'No disponible'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="dish-action-right">
                    <span className="item-unit-price">${(item.price * item.quantity).toFixed(2)}</span>
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

          {/* Resumen de totales */}
          <div className="order-totals-row">
            <div>
              <span className="totals-label-sub">Subtotal de ejemplo</span>
              <div className="totals-sub-desc">Platillos seleccionados: {totalQuantity}</div>
            </div>
            <span className="total-amount">${subtotal.toFixed(2)}</span>
          </div>

          {/* Botón Revisar pedido */}
          <div className="form-actions">
            <button type="button" className="btn-primary-green btn-full" onClick={handleReviewOrder}>
              Revisar pedido →
            </button>
          </div>

          <div className="footer-notice">
            Sin elementos o cantidades menores al mínimo: no se permite enviar. Un pedido requiere sucursal y asignación válida.
          </div>
        </div>
      </main>
    </div>
  );
}