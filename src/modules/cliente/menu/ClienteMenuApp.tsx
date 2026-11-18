import React, { useState, useEffect } from 'react';
import './cliente-menu.css';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  isAvailable: boolean;
}

const BRANCH_MAP: Record<string, string> = {
  Centro: 'a1111111-1111-4111-8111-111111111111',
  Bambu: 'a2222222-2222-4222-8222-222222222222',
  Ramblas: 'a3333333-3333-4333-8333-333333333333',
};

export function ClienteMenuApp({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [selectedBranch, setSelectedBranch] = useState('Centro');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  useEffect(() => {
    loadClientMenu();
  }, [selectedBranch]);

  const loadClientMenu = async () => {
    try {
      setLoading(true);
      setError('');
      const branchId = BRANCH_MAP[selectedBranch] || 'a1111111-1111-4111-8111-111111111111';
      
      // 👈 Apuntamos al endpoint público de menú por sucursal
      const response = await fetch(`/api/branches/${branchId}/menu`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Error al obtener el menú del servidor');
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.data || []);
      setItems(list);
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

  const filteredDishes = items.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryLabel = getCategoryLabel(dish.category);
    const matchesCatDropdown = selectedCategory === 'Todas' || categoryLabel === selectedCategory;
    return matchesSearch && matchesCatDropdown;
  });

  const handleAddToCart = (dish: MenuItem) => {
    setCartCount(prev => prev + 1);
    setCartTotal(prev => prev + Number(dish.price));
  };

  return (
    <div className="cliente-container">
      <header className="cliente-header-bar">
        <span className="prototype-title">Menú digital por sucursal</span>
        <span className="prototype-subtitle">Conectado al Backend en Docker vía Proxy</span>
      </header>

      <main className="cliente-content">
        <div className="meta-info">
          <span className="badge-h">H3 · CUSTOMER</span>
          <span className="route-tag">/branches/:branchId/menu</span>
        </div>

        <div className="card-menu-catalog">
          <div className="catalog-header-text">
            <span className="catalog-tag">SABORES DE LA CASA</span>
            <h2>Descubre nuestro menú</h2>
            <p>Selecciona sucursal y descubre los platillos disponibles en tiempo real.</p>
          </div>

          {error && <div className="alert-error" style={{ background: '#ef4444', color: '#fff', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}

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

          <div className="dishes-list">
            {loading ? (
              <div className="empty-state">Cargando menú desde el servidor...</div>
            ) : filteredDishes.length === 0 ? (
              <div className="empty-state">No hay platillos disponibles para esta selección.</div>
            ) : (
              filteredDishes.map(dish => (
                <div key={dish.id} className="dish-row-card">
                  <div className="dish-info">
                    <div className="dish-indicator-dot" style={{ background: dish.isAvailable ? '#059669' : '#ef4444' }}></div>
                    <div>
                      <h4 className="dish-name">{dish.name}</h4>
                      <span className="dish-category-label">{getCategoryLabel(dish.category)}</span>
                      {dish.description && <p className="dish-desc" style={{ color: '#64748b', fontSize: '0.85rem' }}>{dish.description}</p>}
                    </div>
                  </div>
                  <div className="dish-action-area">
                    <span className="dish-price">${Number(dish.price).toFixed(2)}</span>
                    <button 
                      className={`btn-add ${!dish.isAvailable ? 'disabled' : ''}`}
                      onClick={() => dish.isAvailable && handleAddToCart(dish)}
                      disabled={!dish.isAvailable}
                      style={{
                        background: dish.isAvailable ? '#064e3b' : '#cbd5e1',
                        cursor: dish.isAvailable ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {dish.isAvailable ? '+ Añadir' : 'No disponible'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="cart-bottom-bar">
          <div className="cart-summary-text">
            <strong>Carrito</strong> · {cartCount} artículos · ${cartTotal.toFixed(2)}
          </div>
          <button 
            className="btn-primary-green"
            onClick={() => onNavigate('/checkout')}
            style={{ background: '#059669', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Ver pedido →
          </button>
        </div>
      </main>
    </div>
  );
}