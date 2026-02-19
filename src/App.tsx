import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Dashboard from './components/Dashboard'

function LogoIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="url(#logoGrad)"/>
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e3a8a"/>
          <stop offset="100%" stopColor="#2563eb"/>
        </linearGradient>
      </defs>
      <rect x="11" y="10" width="4" height="20" rx="2" fill="white"/>
      <rect x="11" y="10" width="16" height="4" rx="2" fill="white"/>
      <rect x="11" y="19" width="12" height="3.5" rx="1.75" fill="white" opacity="0.85"/>
      <circle cx="30" cy="30" r="3" fill="white" opacity="0.35"/>
    </svg>
  )
}

function App() {
  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    supabase.auth.onAuthStateChange((_event, session) => setSession(session))
  }, [])

  async function login() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o password non corretti')
    setLoading(false)
  }

  if (!session) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f0f4ff 0%, #e8eeff 40%, #dbeafe 100%)',
      display: 'flex',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        width: '45%',
        background: 'linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.07,
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <LogoIcon size={72} />
          <h1 style={{ color: 'white', fontSize: '42px', fontWeight: '800', margin: '24px 0 8px', letterSpacing: '-1px' }}>FormaPro</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '16px', margin: '0 0 48px' }}>
            Piattaforma di gestione Formazione & Sicurezza
          </p>
          {[
            { icon: 'shield', text: 'Sicurezza D.Lgs. 81/08' },
            { icon: 'clipboard', text: 'Apprendistato & Tirocini' },
            { icon: 'clock', text: 'Alert scadenze automatici' },
            { icon: 'building', text: 'Multi-azienda' },
          ].map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>
              <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {f.icon === 'shield' ? '🛡️' : f.icon === 'clipboard' ? '📋' : f.icon === 'clock' ? '⏰' : '🏢'}
              </span>
              {f.text}
            </div>
          ))}
        </div>
        <p style={{ position: 'absolute', bottom: '24px', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
          CONFAZIENDE P.M.I. © 2026
        </p>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Bentornato</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Accedi alla tua area riservata</p>
          </div>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#dc2626', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@azienda.it"
              style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: '#0f172a', outline: 'none', background: 'white' }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && login()}
              style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: '#0f172a', outline: 'none', background: 'white' }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <button onClick={login} disabled={loading}
            style={{ width: '100%', background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1e3a8a, #2563eb)', border: 'none', borderRadius: '10px', padding: '13px', color: 'white', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.35)' }}
          >
            {loading ? 'Accesso in corso...' : 'Accedi →'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <nav style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 32px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LogoIcon size={36} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', lineHeight: 1, letterSpacing: '-0.3px' }}>FormaPro</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '1px' }}>Formazione & Sicurezza</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>{session.user.email}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Amministratore</div>
          </div>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '700' }}>
            {session.user.email?.[0]?.toUpperCase()}
          </div>
          <button onClick={() => supabase.auth.signOut()} style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
            Esci
          </button>
        </div>
      </nav>
      <Dashboard />
    </div>
  )
}

export default App
