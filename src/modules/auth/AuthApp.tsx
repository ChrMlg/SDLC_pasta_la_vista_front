import { useEffect, useState, type FormEvent } from 'react';
import { MenuApp, type MenuSession } from '../menu/MenuApp';
import './auth.css';

type Identity = MenuSession & { userId: string; email: string | null };

async function request<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, {
    method: body ? 'POST' : 'GET', credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(error.message ?? 'No se pudo completar la solicitud');
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

function AuthForm({ onLogin }: { onLogin: (identity: Identity) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      if (mode === 'register') {
        await request('register/customer', { email, password });
        setNotice('Cuenta creada. Inicie sesión.');
        setMode('login'); setPassword('');
      } else {
        onLogin(await request<Identity>('login', { email, password }));
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Error del servidor'); }
    finally { setBusy(false); }
  }

  return <main className="authShell">
    <h1>Bistro</h1>
    <div className="authTabs">
      <button type="button" aria-pressed={mode === 'login'} onClick={() => { setMode('login'); setError(''); setNotice(''); }}>Iniciar sesión</button>
      <button type="button" aria-pressed={mode === 'register'} onClick={() => { setMode('register'); setError(''); setNotice(''); }}>Crear cuenta</button>
    </div>
    <form onSubmit={submit}>
      <label>Correo electrónico<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} /></label>
      <label>Contraseña<input type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={mode === 'register' ? 12 : 1} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} /></label>
      {mode === 'register' && <p>Use al menos 12 caracteres. Las cuentas nuevas se crean como cliente.</p>}
      {error && <p role="alert" className="authError">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <button disabled={busy} type="submit">{busy ? 'Espere...' : mode === 'register' ? 'Crear cuenta' : 'Entrar'}</button>
    </form>
  </main>;
}

export function AuthApp() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState(() => localStorage.getItem('selectedBranchId'));
  useEffect(() => {
    let active = true;
    request<Identity>('me').then(user => { if (active) setIdentity(user); }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  if (loading) return <main className="authShell"><p role="status">Cargando sesión...</p></main>;
  if (!identity) return <AuthForm onLogin={user => { window.history.replaceState({}, '', '/'); localStorage.removeItem('selectedBranchId'); setSelectedBranchId(null); setIdentity(user); }} />;
  return <MenuApp session={identity} selectedBranchId={selectedBranchId} onSelectBranch={branchId => { localStorage.setItem('selectedBranchId', branchId); setSelectedBranchId(branchId); }} onLogout={async () => { try { await request('logout', {}); window.history.replaceState({}, '', '/'); localStorage.removeItem('selectedBranchId'); setSelectedBranchId(null); setIdentity(null); } catch { window.alert('No se pudo cerrar sesión'); } }} />;
}
