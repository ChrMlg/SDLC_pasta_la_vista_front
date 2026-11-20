import React from 'react';

interface CompanionPlaceholderProps {
  title: string;
  moduleLabel: string;
  endpointHint: string;
  onBack: () => void;
}

export function CompanionModulePlaceholder({
  title,
  moduleLabel,
  endpointHint,
  onBack,
}: CompanionPlaceholderProps) {
  return (
    <div style={{ padding: '2rem', maxWidth: '720px', margin: '0 auto' }}>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '2rem',
        }}
      >
        <span className="badge-h">{moduleLabel}</span>
        <h1 style={{ marginTop: '0.75rem' }}>{title}</h1>
        <p style={{ color: '#64748b' }}>
          Vista reservada para la integración del módulo de tu compañero. La conexión y los contratos
          de navegación hacia esta ruta ya están preparados en <code>src/shared/module-bridges.ts</code>.
        </p>
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '0.88rem',
            margin: '1rem 0 1.5rem 0',
          }}
        >
          <strong>Endpoint esperado en backend:</strong> <code>{endpointHint}</code>
        </div>
        <button type="button" className="btn-primary-green" onClick={onBack}>
          ← Volver a mi flujo principal
        </button>
      </div>
    </div>
  );
}
