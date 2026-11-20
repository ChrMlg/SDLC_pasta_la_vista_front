import React, { useState, useEffect } from 'react';
import './cliente-menu.css';

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  price: number | string;
  isAvailable: boolean;
}

const BRANCH_MAP: Record<string, string> = {
  Centro: 'a1111111-1111-4111-8111-111111111111',
  Bambú: 'a2222222-2222-4222-8222-222222222222',
  Ramblas: 'a3333333-3333-4333-8333-333333333333',
};

export function ClienteMenuApp({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const [selectedBranch, setSelectedBranch] = useState('Centro');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMenu();
  }, [selectedBranch]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError('');
      const branchId = BRANCH_MAP[selectedBranch] || 'a1111111-1111-4111-8111-111111111111';

      let allDishes: MenuItem[] = [];
      let currentPage = 1;
      let totalPages = 1;

      while (currentPage <= totalPages) {
        const response = await fetch(`/api/branches/${branchId}/menu?page=${currentPage}`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Error al obtener el menú del servidor');
        }

        const data = await response.json();
        const pageList: MenuItem[] = Array.isArray(data) ? data : (data.data || []);

        if (pageList.length === 0) {
          break;
        }

        const uniqueNew = pageList.filter(
          (newDish) => !allDishes.some((existing) => existing.id === newDish.id)
        );
        allDishes = [...allDishes, ...uniqueNew];

        if (!Array.isArray(data) && typeof data.total === 'number' && typeof data.pageSize === 'number' && data.pageSize > 0) {
          totalPages = Math.ceil(data.total / data.pageSize);
        } else {
          break;
        }

        currentPage++;
        if (currentPage > 25) break;
      }

      setItems(allDishes);
    } catch {
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

  const filteredDishes = items.filter((dish) => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryLabel = getCategoryLabel(dish.category);
    const matchesCategory = selectedCategory === 'Todas' || categoryLabel === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="cliente-container">
      <header className="cliente-header-bar">
        <span className="prototype-title">Menú digital por sucursal</span>
        <span className="prototype-subtitle">{selectedBranch} · Conectado al Back</span>
      </header>

      <main className="cliente-content">
        <div className="meta-info">
          <span className="badge-h">H3 · CUSTOMER</span>
          <span className="route-tag">/branches/:branchId/menu</span>
        </div>

        <div className="card-menu-catalog">
          <div className="catalog-header-text" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <span className="catalog-tag">SABORES DE LA CASA</span>
              <h2>Descubre nuestro menú</h2>
              <p>Consulta los platillos y su disponibilidad actual por sucursal.</p>
            </div>
            <button
              type="button"
              onClick={loadMenu}
              style={{
                background: '#334155',
                color: '#fff',
                border: 'none',
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              Actualizar menú
            </button>
          </div>

          {error && (
            <div
              className="alert-error"
              style={{ background: '#ef4444', color: '#fff', padding: '0.6rem', borderRadius: '6px', marginBottom: '1rem' }}
            >
              {error}
            </div>
          )}

          <div className="filters-grid">
            <div className="filter-group">
              <label>Sucursal</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="Centro">Centro</option>
                <option value="Bambú">Bambú</option>
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
            <label>Buscar por nombre ({filteredDishes.length} platillos)</label>
            <input
              type="text"
              placeholder="Buscar platillo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="dishes-list">
            {loading ? (
              <div className="empty-state">Cargando menú del servidor...</div>
            ) : filteredDishes.length === 0 ? (
              <div className="empty-state">No hay platillos para esta selección.</div>
            ) : (
              filteredDishes.map((dish) => (
                <div key={dish.id} className="dish-row-card">
                  <div className="dish-info">
                    <div
                      className="dish-indicator-dot"
                      style={{ background: dish.isAvailable ? '#059669' : '#ef4444' }}
                    />
                    <div>
                      <h4 className="dish-name">{dish.name}</h4>
                      <span className="dish-category-label">
                        {getCategoryLabel(dish.category)} ·{' '}
                        <strong style={{ color: dish.isAvailable ? '#059669' : '#ef4444' }}>
                          {dish.isAvailable ? 'Disponible' : 'No disponible'}
                        </strong>
                      </span>
                      {dish.description && (
                        <p className="dish-desc" style={{ color: '#64748b', fontSize: '0.85rem' }}>
                          {dish.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="dish-action-area">
                    <span className="dish-price">${Number(dish.price).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {onNavigate && (
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => onNavigate('/orders/new')}
              style={{
                background: '#059669',
                color: '#fff',
                padding: '0.6rem 1.1rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Ir a pedir →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}