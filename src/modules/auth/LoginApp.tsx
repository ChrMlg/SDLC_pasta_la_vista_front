import React, { useEffect, useState } from 'react';
import { apiRequest, SessionProfile, UserRole } from '../../shared/api-client';
import './auth.css';

interface LoginAppProps {
  onLoginSuccess: (profile: SessionProfile) => void;
  onOpenRegister?: () => void;
  initialEmail?: string;
  initialNotice?: string;
}

function inferRoleFromEmail(email: string): UserRole {
  const lower = email.toLowerCase();
  if (lower.includes('general')) return 'GENERAL_MANAGER';
  if (lower.includes('manager')) return 'MANAGER';
  if (lower.includes('waiter')) return 'WAITER';
  if (lower.includes('kitchen')) return 'KITCHEN';
  return 'CUSTOMER';
}

export function LoginApp({
  onLoginSuccess,
  onOpenRegister,
  initialEmail = '',
  initialNotice = '',
}: LoginAppProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(initialNotice);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (initialNotice) setNotice(initialNotice);
  }, [initialNotice]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      const data = await apiRequest<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const user = data?.user || data?.data || data;
      let role: UserRole | undefined = user?.role;
      let branchId: string | null = user?.branchId ?? null;
      let userId: string | undefined = user?.id ?? user?.userId;

      if (!role) {
        try {
          const me = await apiRequest<any>('/auth/me');
          const meUser = me?.user || me?.data || me;
          role = meUser?.role;
          branchId = meUser?.branchId ?? branchId;
          userId = meUser?.id ?? meUser?.userId ?? userId;
        } catch {
          // Si /auth/me no está disponible, se infiere el rol
        }
      }

      const resolvedRole = role || inferRoleFromEmail(email);
      onLoginSuccess({
        id: userId,
        email: email.trim(),
        name: user?.name,
        role: resolvedRole,
        branchId,
      });
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas o error en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <aside className="auth-brand-panel">
        <div className="auth-rings" aria-hidden="true" />
        <div className="auth-brand-top">
          <span className="auth-brand-logo">
            Pasta a la vista<span className="auth-brand-dot">.</span>
          </span>
        </div>

        <div className="auth-brand-hero">
          <h1 className="auth-hero-title">
            Tu restaurante, mejor
            <br />
            conectado.
          </h1>
          <p className="auth-hero-copy">
            Pedidos, reservas y operación de las sucursales Centro, Bambu y Ramblas en una sola
            plataforma.
          </p>
        </div>
      </aside>

      <main className="auth-form-panel">
        <form className="auth-card" onSubmit={handleLogin}>
          <span className="auth-kicker">BIENVENIDO DE NUEVO</span>
          <h2 className="auth-title">Entra a tu cuenta</h2>
          <p className="auth-subtitle">Accede a tus pedidos y herramientas de trabajo.</p>

          {notice && (
            <div className="auth-notice" role="status">
              {notice}
            </div>
          )}
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="login-email">Correo electrónico</label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesión →'}
          </button>

          {onOpenRegister && (
            <p className="auth-note">
              ¿Eres cliente nuevo?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setError('');
                  onOpenRegister();
                }}
              >
                Crear cuenta de cliente
              </button>
            </p>
          )}
        </form>
      </main>
    </div>
  );
}