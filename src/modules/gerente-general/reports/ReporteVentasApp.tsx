import React, { useState, useEffect } from 'react';
import { BRANCHES } from '../../../shared/api-client';
import { BranchSalesRow, fetchSalesReport } from './analytics-api';
import './gerencia-reports.css';

export function ReporteVentasApp({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState(today);
  const [salesData, setSalesData] = useState<BranchSalesRow[]>(
    BRANCHES.map((b) => ({
      branchId: b.id,
      branch: b.label,
      sales: 0,
      orders: 0,
    }))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = async () => {
    try {
      setLoading(true);
      setError('');
      const rows = await fetchSalesReport(startDate, endDate);
      setSalesData(rows);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el reporte de ventas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [startDate, endDate]);

  const totalSales = salesData.reduce((acc, curr) => acc + curr.sales, 0);
  const totalOrders = salesData.reduce((acc, curr) => acc + curr.orders, 0);

  return (
    <div className="report-container">
      <header className="report-header-bar">
        <div className="breadcrumb">
          Gerencia general / <strong>Reporte de ventas por sucursal</strong>
        </div>
        <div className="branch-badge">GENERAL_MANAGER · H31</div>
      </header>

      <main className="report-content">
        <div className="meta-info">
          <span className="badge-h">H31 · GENERAL_MANAGER</span>
          <span className="route-tag">/reports/sales</span>
        </div>

        <h1>Reporte de ventas por sucursal</h1>
        <p className="subtitle-desc">
          Totales aprobados (IVA incluido) y cantidad de pedidos PAID por sucursal.
        </p>

        <div className="card-report-panel">
          {error && <div className="alert-error-box">{error}</div>}

          <div className="date-filters-grid">
            <div className="form-group-report">
              <label>Fecha inicial</label>
              <input
                type="date"
                max={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group-report">
              <label>Fecha final</label>
              <input
                type="date"
                max={today}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="metrics-summary-grid">
            <div className="metric-card-box">
              <span className="metric-desc">Ventas totales de la cadena</span>
              <div className="metric-value-lg">${totalSales.toFixed(2)}</div>
            </div>
            <div className="metric-card-box">
              <span className="metric-desc">Pedidos pagados (PAID)</span>
              <div className="metric-value-lg">{totalOrders}</div>
            </div>
          </div>

          <table className="report-table">
            <thead>
              <tr>
                <th>Sucursal</th>
                <th>Ventas</th>
                <th>Pedidos pagados</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((row) => (
                <tr key={row.branchId}>
                  <td>
                    <strong>{row.branch}</strong>
                  </td>
                  <td>${row.sales.toFixed(2)}</td>
                  <td>{row.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="report-actions-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={loadReport}
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Actualizar reporte'}
            </button>
            <button
              type="button"
              className="btn-primary-green"
              onClick={() => onNavigate('/reports/comparison')}
            >
              Comparar sucursales (H32) →
            </button>
          </div>

          <div className="footer-report-note">
            No se incluyen pagos rechazados/revertidos ni pedidos anulados. Ceros no equivalen a errores.
          </div>
        </div>
      </main>
    </div>
  );
}