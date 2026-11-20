import React, { useState, useEffect } from 'react';
import { BRANCHES } from '../../../shared/api-client';
import {
  BranchPerformanceRow,
  fetchBranchPerformanceReport,
} from './analytics-api';
import './gerencia-reports.css';

export function SucursalesAtencionApp() {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState(today);
  const [rows, setRows] = useState<BranchPerformanceRow[]>(
    BRANCHES.map((b) => ({
      branchId: b.id,
      branch: b.label,
      sales: 0,
      orders: 0,
      averageTicket: 0,
      diffVsAveragePct: 0,
      needsAttention: false,
    }))
  );
  const [error, setError] = useState('');

  const loadPerformance = async () => {
    try {
      setError('');
      const data = await fetchBranchPerformanceReport(startDate, endDate);
      setRows(data);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el desempeño operativo de sucursales.');
    }
  };

  useEffect(() => {
    loadPerformance();
  }, [startDate, endDate]);

  return (
    <div className="report-container">
      <header className="report-header-bar">
        <div className="breadcrumb">
          Gerencia general / <strong>Sucursales que requieren atención</strong>
        </div>
        <div className="branch-badge">GENERAL_MANAGER · H35</div>
      </header>

      <main className="report-content">
        <div className="meta-info">
          <span className="badge-h">H35 · GENERAL_MANAGER</span>
          <span className="route-tag">/reports/performance</span>
        </div>

        <h1>Sucursales que requieren atención</h1>
        <p className="subtitle-desc">
          Detección de sedes con desempeño por debajo del promedio de la cadena.
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

          <table className="report-table">
            <thead>
              <tr>
                <th>Sucursal</th>
                <th>Ventas</th>
                <th>Pedidos</th>
                <th>Variación vs promedio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.branchId}>
                  <td>
                    <strong>{r.branch}</strong>
                  </td>
                  <td>${r.sales.toFixed(2)}</td>
                  <td>{r.orders}</td>
                  <td>{r.diffVsAveragePct.toFixed(1)}%</td>
                  <td>
                    <span
                      className={`status-badge ${
                        r.needsAttention ? 'unavailable' : 'available'
                      }`}
                    >
                      {r.needsAttention ? 'Requiere atención' : 'En rango'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="footer-report-note">
            Evaluado únicamente sobre pedidos pagados (PAID) y no anulados dentro del rango seleccionado.
          </div>
        </div>
      </main>
    </div>
  );
}
