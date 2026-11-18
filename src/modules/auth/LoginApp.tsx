import React, { useState } from 'react';

interface LoginAppProps {
  onLoginSuccess: (role?: 'MANAGER' | 'WAITER' | 'CUSTOMER') => void;
}

export function LoginApp({ onLoginSuccess }: LoginAppProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas o error en el servidor.');
      }

      let role: 'MANAGER' | 'WAITER' | 'CUSTOMER' = 'MANAGER';
      const lowerEmail = email.toLowerCase();
      if (lowerEmail.includes('waiter') || lowerEmail.includes('mesero')) {
        role = 'WAITER';
      } else if (lowerEmail.includes('customer') || lowerEmail.includes('cliente')) {
        role = 'CUSTOMER';
      }

      onLoginSuccess(role);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: '#fff' }}>
      <form onSubmit={handleLogin} style={{ background: '#1e293b', padding: '2rem', borderRadius: '8px', width: '350px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#34d399' }}>Pasta la Vista - Login</h2>
        
        {error && <div style={{ background: '#ef4444', color: '#fff', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Correo electrónico:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
            placeholder="ej. manager-c852796f82f5@bistro.local"
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Contraseña:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
            placeholder="••••••••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '0.75rem', background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {loading ? 'Iniciando sesión...' : 'Entrar'}
        </button>

        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
          Usa las credenciales de tu archivo <b>ACCESOS_LOCALES.md</b> según el rol que quieras probar.
        </div>
      </form>
    </div>
  );
}