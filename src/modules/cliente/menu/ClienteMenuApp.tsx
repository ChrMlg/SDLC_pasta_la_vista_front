import React, { useState } from 'react';
import './cliente-menu.css';

interface DishItem {
  id: string;
  name: string;
  category: string;
  price: string;
  isAvailable: boolean;
}

export function ClienteMenuApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [selectedBranch, setSelectedBranch] = useState('Centro');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [activeTab, setActiveTab] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartCount, setCartCount] = useState(1);
  const [cartTotal, setCartTotal] = useState(6.50);

  const dishes: DishItem[] = [
    { id: '1', name: 'Pasta al pesto', category: 'Plato fuerte', price: '12.50', isAvailable: true },
    { id: '2', name: 'Bruschettas', category: 'Entrada', price: '6.50', isAvailable: true },
    { id: '3', name: 'Tarta de limón', category: 'Postre', price: '6.00', isAvailable: true },
    { id: '4', name: 'Limonada natural', category: 'Bebida', price: '5.00', isAvailable: true },
    { id: '5', name: 'Pollo al horno', category: 'Plato fuerte', price: '13.25', isAvailable: true },
    { id: '6', name: 'Ensalada fresca', category: 'Entrada', price: '7.25', isAvailable: true },
    { id: '7', name: 'Flan casero', category: 'Postre', price: '4.50', isAvailable: true },
    { id: '8', name: 'Café de la casa', category: 'Bebida', price: '2.75', isAvailable: true },
  ];

  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCatDropdown = selectedCategory === 'Todas' || dish.category === selectedCategory;
    const matchesTab = activeTab === 'Todos' || dish.category.toLowerCase() === activeTab.toLowerCase() || (activeTab === 'Platos fuertes' && dish.category === 'Plato fuerte');
    return matchesSearch && matchesCatDropdown && matchesTab;
  });

  const handleAddToCart = (dish: DishItem) => {
    setCartCount(prev => prev + 1);
    setCartTotal(prev => prev + parseFloat(dish.price));
  };

  return (
    <div className="cliente-container">
      <header className="cliente-header-bar">
        <span className="prototype-title">Menú digital por sucursal</span>
        <span className="prototype-subtitle">Pantalla individual · Prototipo para diseñar y programar el sitio web</span>
      </header>

      <main className="cliente-content">
        <div className="meta-info">
          <span className="badge-h">H3 · CUSTOMER / WAITER</span>
          <span className="route-tag">/branches/:branchId/menu</span>
        </div>

        <div className="card-menu-catalog">
          <div className="catalog-header-text">
            <span className="catalog-tag">SABORES DE LA CASA</span>
            <h2>Descubre nuestro menú</h2>
            <p>Selecciona sucursal, busca platillos y consulta sus reseñas.</p>
          </div>

          {/* Filtros superiores: Sucursal y Categoría */}
          <div className="filters-grid">
            <div className="filter-group">
              <label>Sucursal</label>
              <select 
                value={selectedBranch} 
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="Centro">Centro</option>
                <option value="Bambu">Bambu</option>
                <option value="Ramblas">Ramblas</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Categoría</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="Todas">Todas</option>
                <option value="Entrada">Entrada</option>
                <option value="Plato fuerte">Plato fuerte</option>
                <option value="Bebida">Bebida</option>
                <option value="Postre">Postre</option>
              </select>
            </div>
          </div>

          <div className="filter-group search-group">
            <label>Buscar por nombre</label>
            <input 
              type="text" 
              placeholder="Buscar platillo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Pestañas de categorías */}
          <div className="category-tabs">
            {['Todos', 'Entradas', 'Platos fuertes', 'Postres'].map(tab => (
              <button 
                key={tab} 
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Listado de platillos */}
          <div className="dishes-list">
            {filteredDishes.length === 0 ? (
              <div className="empty-state">No hay platillos para esta búsqueda.</div>
            ) : (
              filteredDishes.map(dish => (
                <div key={dish.id} className="dish-row-card">
                  <div className="dish-info">
                    <div className="dish-indicator-dot"></div>
                    <div>
                      <h4 className="dish-name">{dish.name}</h4>
                      <span className="dish-category-label">{dish.category}</span>
                    </div>
                  </div>
                  <div className="dish-action-area">
                    <span className="dish-price">${dish.price}</span>
                    <button 
                      className={`btn-add ${!dish.isAvailable ? 'disabled' : ''}`}
                      onClick={() => dish.isAvailable && handleAddToCart(dish)}
                      disabled={!dish.isAvailable}
                    >
                      {dish.isAvailable ? '+ Añadir' : 'No disponible'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer de la tarjeta con contador y enlace a reseñas */}
          <div className="catalog-footer-actions">
            <span className="counter-badge">{filteredDishes.length} platillo(s) · muestra</span>
            <button 
              className="btn-link-reviews"
              onClick={() => alert('Navegando a reseñas de la sucursal')}
            >
              Ver reseñas de la sucursal
            </button>
          </div>
        </div>

        {/* Barra flotante inferior de carrito */}
        <div className="cart-bottom-bar">
          <div className="cart-summary-text">
            <strong>Carrito</strong> · {cartCount} artículos · ${cartTotal.toFixed(2)}
          </div>
          <button 
            className="btn-primary-green"
            onClick={() => onNavigate('/checkout')}
          >
            Ver pedido →
          </button>
        </div>
      </main>
    </div>
  );
}