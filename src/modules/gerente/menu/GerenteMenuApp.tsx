import React, { useState, useEffect, useRef } from 'react';
import { apiRequest, BRANCHES, DEFAULT_BRANCH_ID } from '../../../shared/api-client';
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
  const [feedback, setFeedback] = useState('');

  // Estado para editar un platillo existente
  const [editingItem, setEditingItem] = useState<MenuItemResponse | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('MAIN_COURSE');
  const [editPrice, setEditPrice] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const editFormRef = useRef<HTMLFormElement | null>(null);
  const editNameInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (!editingItem) return;

    requestAnimationFrame(() => {
      if (editFormRef.current) {
        editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      editNameInputRef.current?.focus();
    });
  }, [editingItem]);

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      STARTER: 'Entrada',
      MAIN_COURSE: 'Plato fuerte',
      DRINK: 'Bebida',
      DESSERT: 'Postre',
    };
    return map[cat] || cat;
  };

  const openEditModal = (item: MenuItemResponse) => {
    setFeedback('');
    setError('');
    setEditingItem(item);
    setEditName(item.name || '');
    setEditDescription(item.description || '');
    setEditCategory(item.category || 'MAIN_COURSE');
    setEditPrice(String(item.price ?? ''));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const normalizedRaw = String(editPrice ?? '')
      .trim()
      .replace(/[^0-9,.-]+/g, '')
      .replace(',', '.');
    const cleanPrice = parseFloat(normalizedRaw);

    if (!editName.trim() || Number.isNaN(cleanPrice) || cleanPrice <= 0) {
      setError('Ingresa un nombre válido y un precio mayor a 0.');
      return;
    }

    const payload = {
      name: editName.trim(),
      description: editDescription.trim(),
      category: editCategory,
      price: cleanPrice.toFixed(2),
    };

    try {
      setSavingEdit(true);
      setError('');
      setFeedback('');

      try {
        await apiRequest(`/branches/${branchId}/menu-items/${editingItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } catch (patchErr: any) {
        if (patchErr?.status === 404 || patchErr?.status === 405) {
          await apiRequest(`/branches/${branchId}/menu-items/${editingItem.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          });
        } else {
          throw patchErr;
        }
      }

      setEditingItem(null);
      setFeedback(`Platillo actualizado: "${payload.name}".`);
      await loadItems();
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar el platillo.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteItem = async (item: MenuItemResponse) => {
    const confirmed = window.confirm(
      `¿Eliminar "${item.name}"? Si tiene pedidos asociados, mejor edítale el nombre.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(item.id);
      setError('');
      setFeedback('');

      await apiRequest(`/branches/${branchId}/menu-items/${item.id}`, {
        method: 'DELETE',
      });

      setFeedback(`Platillo "${item.name}" eliminado.`);
      await loadItems();
    } catch (err: any) {
      setError(
        err?.message ||
          `No se pudo eliminar "${item.name}" (puede tener pedidos asociados; intenta editarle el nombre).`
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const branchLabel = BRANCHES.find((b) => b.id === branchId)?.label || 'Centro';

  return (
    <div className="gerente-container">
      <header className="gerente-header-bar">
        <div className="breadcrumb">
          Gerente / <strong>Menú de sucursal ({branchLabel})</strong>
        </div>
      </header>

      <main className="gerente-content">
        <div className="meta-info"></div>

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

          {feedback && (
            <div
              style={{
                background: '#ecfdf5',
                color: '#065f46',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}
            >
              {feedback}
            </div>
          )}

          {error && <div className="alert-error-box">{error}</div>}

          {editingItem && (
            <form
              ref={editFormRef}
              onSubmit={handleSaveEdit}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1.25rem',
                scrollMarginTop: '1.5rem',
              }}
            >
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem' }}>
                Editar platillo: {editingItem.name}
              </h3>

              <div className="filters-row">
                <div className="form-group-menu">
                  <label>Nombre</label>
                  <input
                    ref={editNameInputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group-menu">
                  <label>Categoría</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  >
                    <option value="STARTER">Entrada</option>
                    <option value="MAIN_COURSE">Plato fuerte</option>
                    <option value="DRINK">Bebida</option>
                    <option value="DESSERT">Postre</option>
                  </select>
                </div>

                <div className="form-group-menu">
                  <label>Precio</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ej. 9.99 o 9,99"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group-menu" style={{ marginTop: '0.75rem' }}>
                <label>Descripción</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
                <button
                  type="submit"
                  className="btn-primary-green"
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingItem(null)}
                  disabled={savingEdit}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

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
                  <th>Acción</th>
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
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
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

                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => openEditModal(item)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={deletingId === item.id}
                          onClick={() => handleDeleteItem(item)}
                        >
                          {deletingId === item.id ? 'Borrando...' : 'Eliminar'}
                        </button>
                      </div>
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