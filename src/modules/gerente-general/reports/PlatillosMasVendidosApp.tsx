import React, { useState, useEffect } from 'react';
import { BRANCHES, DEFAULT_BRANCH_ID } from '../../../shared/api-client';
import { fetchTopDishesReport, TopDishReportRow } from './analytics-api';
import './gerencia-reports.css';

export function PlatillosMasVendidosApp() {
  const today = new Date().toISOString().split('T')[0];
  const [branchId, setBranchId] = useState(DEFAULT_BRANCH_ID);
  const [topLimit, setTopLimit] = useState(5);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState(today);
  const [dishes, setDishes] = useState<TopDishReportRow[]>([]);
  const [error, setError] = useState('');

  const loadTopDishes = async () => {
    try {
      setError('');
      const rows = await fetchTopDishesReport(branchId, startDate, endDate, topLimit);
      setDishes(rows);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el ranking de platillos.');
    }
  };

  useEffect(() => {
    loadTopDishes();
  }, [branchId, topLimit, startDate, endDate]);

  return (
    <div className="report-container">
      <header className="report-header-bar">
        <div className="breadcrumb">
          Gerencia general / <strong>Platillos más vendidos</strong>
        </div>
        <div className="branch-badge">GENERAL_MANAGER · H33</div>
      </header>

      <main className="report-content">
        <div className="meta-info">
          <span className="badge-h">H33 · GENERAL_MANAGER</span>
          <span className="route-tag">/reports/top-dishes</span>
        </div>

        <h1>Platillos más vendidos</h1>
        <p className="subtitle-desc">
          Unidades vendidas en pedidos pagados (PAID) y no anulados.
        </p>

        <div className="card-report-panel">
          {error && <div className="alert-error-box">{error}</div>}

          <div className="date-filters-grid">
            <div className="form-group-report">
              <label>Sucursal</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group-report">
              <label>Límite</label>
              <select value={topLimit} onChange={(e) => setTopLimit(Number(e.target.value))}>
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
              </select>
            </div>
          </div>

          <div className="date-filters-grid">
            <div className="form-group-report">
              <label>Desde</label>
              <input
                type="date"
                max={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group-report">
              <label>Hasta</label>
              <input
                type="date"
                max={today}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {dishes.length === 0 ? (
            <div className="empty-state-box">No hay datos disponibles.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {dishes.map((item) => (
                <div
                  key={item.rank}
                  className="metric-card-box"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <strong>
                      #{item.rank} · {item.name}
                    </strong>
                    {item.category && (
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.category}</div>
                    )}
                  </div>
                  <strong>{item.units} unidades</strong>
                </div>
              ))}
            </div>
          )}

          <div className="footer-report-note">
            Orden descendente por unidades vendidas. Si el período no tiene ventas elegibles: «No hay datos disponibles».
          </div>
        </div>
      </main>
    </div>
  );
}
