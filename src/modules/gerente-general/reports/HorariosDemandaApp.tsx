import React, { useState, useEffect } from 'react';
import { BRANCHES, DEFAULT_BRANCH_ID } from '../../../shared/api-client';
import { fetchPeakHoursReport, PeakHourRow } from './analytics-api';
import './gerencia-reports.css';

export function HorariosDemandaApp() {
  const today = new Date().toISOString().split('T')[0];
  const [branchId, setBranchId] = useState(DEFAULT_BRANCH_ID);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState(today);
  const [peakHours, setPeakHours] = useState<PeakHourRow[]>([]);
  const [error, setError] = useState('');

  const loadPeakHours = async () => {
    try {
      setError('');
      const rows = await fetchPeakHoursReport(branchId, startDate, endDate);
      setPeakHours(rows);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los horarios de mayor demanda.');
    }
  };

  useEffect(() => {
    loadPeakHours();
  }, [branchId, startDate, endDate]);

  const maxOrders = peakHours.reduce((max, r) => Math.max(max, r.orders), 0);

  return (
    <div className="report-container">
      <header className="report-header-bar">
        <div className="breadcrumb">
          Gerencia general / <strong>Horarios de mayor demanda</strong>
        </div>
        <div className="branch-badge">GENERAL_MANAGER</div>
      </header>

      <main className="report-content">
        <div className="meta-info">
          <span className="route-tag">/reports/peak-hours</span>
        </div>

        <h1>Horarios de mayor demanda</h1>
        <p className="subtitle-desc">
          Pedidos pagados agrupados en intervalos de 60 minutos por sucursal.
        </p>

        <div className="card-report-panel">
          {error && <div className="alert-error-box">{error}</div>}

          <div className="form-group-report" style={{ maxWidth: '320px' }}>
            <label>Sucursal</label>
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
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

          {peakHours.length === 0 ? (
            <div className="empty-state-box">
              No hay franjas horarias con pedidos pagados en el rango seleccionado.
            </div>
          ) : (
            <div className="chart-container-box">
              {peakHours.map((slot, idx) => {
                const pct =
                  maxOrders > 0 ? Math.round((slot.orders / maxOrders) * 100) : 0;
                return (
                  <div key={idx} style={{ marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.86rem',
                        marginBottom: '0.2rem',
                      }}
                    >
                      <strong>{slot.hourLabel}</strong>
                      <span>{slot.orders} pedidos</span>
                    </div>
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="footer-report-note">
            Empates: primero fecha y hora más antigua. Comparaciones con misma zona horaria.
          </div>
        </div>
      </main>
    </div>
  );
}