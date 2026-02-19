import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Dashboard from './components/Dashboard'

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
    if (error) setError('Email o password errati')
    setLoading(false)
  }

  if (!session) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">FormaPro</h1>
        <p className="text-gray-500 mb-6">Gestione Formazione & Sicurezza</p>
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <input
          className="w-full border border-gray-200 rounded-lg p-3 mb-3 text-sm"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="w-full border border-gray-200 rounded-lg p-3 mb-4 text-sm"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
        />
        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg p-3 font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Accesso...' : 'Accedi'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">🎓 FormaPro</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session.user.email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1 rounded-lg"
          >
            Esci
          </button>
        </div>
      </nav>
      <Dashboard />
    </div>
  )
}

export default App