import React, { useState } from 'react';
import { apiRequest } from '../../shared/api-client';
import './auth.css';

interface RegisterCustomerAppProps {
  onBackToLogin: (prefilledEmail?: string, noticeMessage?: string) => void;
}

export function RegisterCustomerApp({ onBackToLogin }: RegisterCustomerAppProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (cleanFirstName.length < 2 || cleanFirstName.length > 80) {
      setError('El nombre debe tener entre 2 y 80 caracteres.');
      return;
    }
    if (cleanLastName.length < 2 || cleanLastName.length > 80) {
      setError('El apellido debe tener entre 2 y 80 caracteres.');
      return;
    }
    if (!/^\d{8}$/.test(cleanPhone)) {
      setError('El teléfono debe tener exactamente 8 dígitos numéricos.');
      return;
    }
    if (password.length < 8 || password.length > 128) {
      setError('La contraseña debe tener entre 8 y 128 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/auth/register/customer', {
        method: 'POST',
        body: JSON.stringify({
          email: cleanEmail,
          password,
          firstName: cleanFirstName,
          lastName: cleanLastName,
          phone: cleanPhone,
        }),
      });

      onBackToLogin(
        cleanEmail,
        'Cuenta de cliente creada con éxito. Ahora inicia sesión con tu correo y contraseña.'
      );
    } catch (err: any) {
      setError(err?.message || 'No se pudo completar el registro de cliente.');
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
        <form className="auth-card" onSubmit={handleRegister} noValidate>
          <span className="auth-kicker">NUEVO CLIENTE</span>
          <h2 className="auth-title">Crear cuenta</h2>
          <p className="auth-subtitle">Regístrate como cliente para pedir, reservar y consultar tu perfil.</p>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <div className="auth-row">
            <div className="auth-field">
              <label htmlFor="register-firstName">Nombre</label>
              <input
                id="register-firstName"
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ana"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-lastName">Apellido</label>
              <input
                id="register-lastName"
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="López"
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Correo electrónico</label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@correo.com"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-phone">Teléfono (8 dígitos)</label>
            <input
              id="register-phone"
              type="tel"
              inputMode="numeric"
              required
              maxLength={8}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="71234567"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-password">Contraseña</label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Registrando cuenta...' : 'Crear cuenta de cliente →'}
          </button>

          <p className="auth-note">
            ¿Ya tienes una cuenta?{' '}
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => onBackToLogin(email.trim() || undefined)}
            >
              Inicia sesión aquí
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}