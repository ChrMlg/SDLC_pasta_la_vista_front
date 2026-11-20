import React, { useState, useEffect } from 'react';
import { BRANCHES } from '../../../shared/api-client';
import { BranchSalesRow, fetchBranchesComparison } from './analytics-api';
import './gerencia-reports.css';

export function ComparativaSucursalesApp({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState(today);
  const [rows, setRows] = useState<BranchSalesRow[]>(
    BRANCHES.map((b) => ({ branchId: b.id, branch: b.label, sales: 0, orders: 0 }))
  );
  const [error, setError] = useState('');

  const loadComparison = async () => {
    try {
      setError('');
      const data = await fetchBranchesComparison(startDate, endDate);
      setRows(data);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la comparativa entre sucursales.');
    }
  };

  useEffect(() => {
    loadComparison();
  }, [startDate, endDate]);

  const totalSales = rows.reduce((acc, r) => acc + r.sales, 0);

  return (
    <div className="report-container">
      <header className="report-header-bar">
        <div className="breadcrumb">
          Gerencia general / <strong>Comparativa entre sucursales</strong>
        </div>

      </header>

      <main className="report-content">
        <div className="meta-info">

        </div>

        <h1>Comparativa entre sucursales</h1>
        <p className="subtitle-desc">
          Mismo período, métricas y zona horaria para las 3 sucursales.
        </p>

        <div className="card-report-panel">
          {error && <div className="alert-error-box">{error}</div>}

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

          <div className="branch-pills-row">
            {rows.map((r) => (
              <span key={r.branchId} className="branch-pill">
                ✓ {r.branch}
              </span>
            ))}
          </div>

          <div className="chart-container-box">
            {rows.map((r) => {
              const pct = totalSales > 0 ? Math.round((r.sales / totalSales) * 100) : 0;
              return (
                <div key={r.branchId} style={{ marginBottom: '0.85rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.88rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <strong>{r.branch}</strong>
                    <span>
                      ${r.sales.toFixed(2)} ({pct}%)
                    </span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="comparison-grid-bottom">
            <div className="metric-card-box">
              <h4 style={{ margin: '0 0 0.75rem 0' }}>Ventas acumuladas</h4>
              <div className="metric-value-lg">${totalSales.toFixed(2)}</div>
            </div>

            <div className="metric-card-box">
              <h4 style={{ margin: '0 0 0.75rem 0' }}>Pedidos pagados por sede</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
                {rows.map((item) => (
                  <li
                    key={item.branchId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.35rem 0',
                      borderBottom: '1px solid #e2e8f0',
                    }}
                  >
                    <span>{item.branch}</span>
                    <strong>{item.orders}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => onNavigate('/reports/sales')}
          >
            ← Volver al reporte de ventas
          </button>
        </div>
      </main>
    </div>
  );
}
