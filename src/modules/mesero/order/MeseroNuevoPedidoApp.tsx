import React, { useState } from 'react';
import './mesero-order.css';

interface OrderItem {
  id: string;
  name: string;
  category: 'Entrada' | 'Plato fuerte' | 'Bebida' | 'Postre';
  price: number;
  isAvailable: boolean;
  quantity: number;
}

export function MeseroNuevoPedidoApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [serviceType, setServiceType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [tableNumber, setTableNumber] = useState('Mesa 01');
  const [activeTab, setActiveTab] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  //menu
  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', name: 'Pasta al pesto', category: 'Plato fuerte', price: 12.50, isAvailable: true, quantity: 2 },
    { id: '2', name: 'Bruschettas', category: 'Entrada', price: 6.50, isAvailable: true, quantity: 1 },
    { id: '3', name: 'Tarta de limón', category: 'Postre', price: 6.00, isAvailable: true, quantity: 0 },
    { id: '4', name: 'Limonada natural', category: 'Bebida', price: 5.00, isAvailable: true, quantity: 0 },
    { id: '5', name: 'Pollo al horno', category: 'Plato fuerte', price: 13.25, isAvailable: true, quantity: 0 },
    { id: '6', name: 'Ensalada fresca', category: 'Entrada', price: 7.25, isAvailable: false, quantity: 0 },
    { id: '7', name: 'Flan casero', category: 'Postre', price: 4.50, isAvailable: true, quantity: 0 },
    { id: '8', name: 'Café de la casa', category: 'Bebida', price: 2.75, isAvailable: true, quantity: 0 },
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

  // Filtrado por nombre y pestaña de categoría 
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
  const selectedCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleConfirmOrder = () => {
    if (subtotal === 0) {
      alert('Debes seleccionar al menos un platillo disponible para el pedido.');
      return;
    }

    onNavigate('/waiter/orders/confirm');
  };

  return (
    <div className="mesero-container">
      <header className="mesero-header-bar">
        <div className="breadcrumb">
          Mesero / <strong>Registro de pedido por mesero</strong>
        </div>
        <div className="branch-badge">Centro · Vista de ejemplo</div>
      </header>

      <main className="mesero-content">
        <div className="meta-info">
          <span className="badge-h">H4 · WAITER</span>
          <span className="route-tag">/waiter/orders/new</span>
        </div>

        <h1>Registro de pedido por mesero</h1>
        <p className="subtitle-desc">Pantalla individual · Prototipo para diseñar y programar el sitio web</p>

        <div className="card-order-catalog">
          <div className="catalog-header-text">
            <span className="catalog-tag">SUCURSAL CENTRO</span>
            <h2>Tomar nuevo pedido</h2>
            <p>Puedes registrar varios pedidos para la misma mesa.</p>
          </div>

          {/* Selectores de Servicio y Mesa */}
          <div className="order-options-grid">
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

          {/* Buscador y pestañas de categorías ordenadas como en H3 */}
          <div className="menu-filter-section">
            <div className="form-group search-bar-mesero">
              <label>Buscar platillo en el menú</label>
              <input
                type="text"
                placeholder="Buscar por nombre (ej. Pasta, Limonada)..."
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

          {/* Listado ordenado de platillos con control - y + */}
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
                        {item.category} ·{' '}
                        <strong className={item.isAvailable ? 'text-avail' : 'text-unavail'}>
                          {item.isAvailable ? 'Disponible' : 'No disponible'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="dish-action-right">
                    <span className="item-unit-price">${item.price.toFixed(2)}</span>
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

          {/* Notas especiales por platillo */}
          <div className="form-group notes-group">
            <label>Notas especiales por platillo</label>
            <textarea
              rows={3}
              value={specialNotes}
              onChange={e => setSpecialNotes(e.target.value)}
              placeholder="Ej. Sin cebolla, término medio..."
            />
          </div>

          {/* Subtotal e IVA */}
          <div className="order-totals-row">
            <div>
              <span>Total antes de IVA</span>
              <span className="items-selected-pill">{selectedCount} platillo(s) seleccionados</span>
            </div>
            <span className="total-amount">${subtotal.toFixed(2)}</span>
          </div>

          {/* Botón de Confirmar pedido */}
          <div className="form-actions">
            <button type="button" className="btn-primary-green btn-full" onClick={handleConfirmOrder}>
              Confirmar pedido
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}