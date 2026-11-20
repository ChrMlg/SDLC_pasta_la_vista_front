import React, { useState, useEffect } from 'react';
import { BRANCHES, DEFAULT_BRANCH_ID } from '../../../shared/api-client';
import { fetchAllManagerMenuItems, MenuItemResponse } from './gerente-menu-api';
import './gerente-menu.css';

interface GerenteMenuAppProps {
  onNavigate: (path: string, params?: any) => void;
  defaultBranchId?: string | null;
}

export function GerenteMenuApp({ onNavigate, defaultBranchId }: GerenteMenuAppProps) {
  const [branchId, setBranchId] = useState(defaultBranchId || DEFAULT_BRANCH_ID);
  const [items, setItems] = useState<MenuItemResponse[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadItems = async () => {
    try {
      setLoading(true);
      setError('');
      const list = await fetchAllManagerMenuItems(branchId, search, category);
      setItems(list);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el menú de la sucursal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [branchId, category]);

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      STARTER: 'Entrada',
      MAIN_COURSE: 'Plato fuerte',
      DRINK: 'Bebida',
      DESSERT: 'Postre',
    };
    return map[cat] || cat;
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const branchLabel = BRANCHES.find((b) => b.id === branchId)?.label || 'Centro';

  return (
    <div className="gerente-container">
      <header className="gerente-header-bar">
        <div className="breadcrumb">
          Gerente / <strong>Menú de sucursal</strong>
        </div>
      </header>

      <main className="gerente-content">
        <div className="meta-info">

        </div>

        <h1>Administración del menú</h1>
        <p className="subtitle-desc">
          Gestiona los platillos de la sucursal y su disponibilidad en tiempo real.
        </p>

        <div className="card-menu-panel">
          <div className="panel-top-bar">
            <div>
              <span className="catalog-tag">CATÁLOGO DE SUCURSAL</span>
              <h2>Platillos registrados ({filteredItems.length})</h2>
              <p>Los cambios de disponibilidad se reflejan al instante para meseros y clientes.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button type="button" className="btn-secondary" onClick={loadItems}>
                Actualizar
              </button>
              <button
                type="button"
                className="btn-primary-green"
                onClick={() => onNavigate('/management/menu/new', { branchId })}
              >
                + Nuevo platillo
              </button>
            </div>
          </div>

          {error && <div className="alert-error-box">{error}</div>}

          <div className="filters-row">
            <div className="form-group-menu">
              <label>Buscar por nombre</label>
              <input
                type="text"
                placeholder="Ej. Pasta al pesto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="form-group-menu">
              <label>Categoría</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Todas">Todas</option>
                <option value="STARTER">Entradas</option>
                <option value="MAIN_COURSE">Platos fuertes</option>
                <option value="DRINK">Bebidas</option>
                <option value="DESSERT">Postres</option>
              </select>
            </div>

            <div className="form-group-menu">
              <label>Sucursal</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="empty-state-menu">Cargando catálogo de platillos...</div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state-menu">
              No se encontraron platillos para los filtros seleccionados.
            </div>
          ) : (
            <table className="menu-table">
              <thead>
                <tr>
                  <th>Platillo</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acción (H2)</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      {item.description && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td>{getCategoryLabel(item.category)}</td>
                    <td>${Number(item.price).toFixed(2)}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          item.isAvailable ? 'available' : 'unavailable'
                        }`}
                      >
                        {item.isAvailable ? 'Disponible' : 'No disponible'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-toggle-avail"
                        onClick={() =>
                          onNavigate(`/management/menu/${item.id}/availability`, {
                            branchId,
                            itemId: item.id,
                            dishName: item.name,
                            currentAvailability: item.isAvailable,
                          })
                        }
                      >
                        {item.isAvailable ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
