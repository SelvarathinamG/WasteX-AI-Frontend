import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Recycle, Loader2 } from 'lucide-react'
import { loginWithUsername } from '../firebase/auth'
import { isFirebaseConfigured } from '../firebase/config'
import { useToast } from '../components/Toast'
import { seedDemoData } from '../services/seedService'

const TABS = [
  { role: 'admin', label: 'Admin' },
  { role: 'collector', label: 'Collector' },
  { role: 'vendor', label: 'Vendor' }
]

const ROLE_HOME = { admin: '/admin', collector: '/collector/dashboard', vendor: '/vendor/dashboard' }

export default function Login() {
  const [tab, setTab] = useState('admin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const toast = useToast()

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 text-white p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold">Firebase configuration missing</h1>
          <p className="text-sm text-slate-300">
            Copy <code className="bg-navy-800 px-1 py-0.5 rounded">.env.example</code> to{' '}
            <code className="bg-navy-800 px-1 py-0.5 rounded">.env.local</code>, fill in your Firebase project
            credentials, then restart the dev server.
          </p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const profile = await loginWithUsername(username, password, tab)
      toast.success(`Welcome back, ${profile.fullName || profile.businessName || profile.username}.`)
      navigate(ROLE_HOME[tab])
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const summary = await seedDemoData((msg) => toast.info(msg))
      toast.success(`Demo data ready: ${summary.bins} bins, ${summary.vehicles} vehicles, ${summary.collectors} collectors, ${summary.vendors} vendors.`)
    } catch (err) {
      toast.error(err.message || 'Failed to seed demo data.')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:22px_22px]" />
      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-wastex-green/15 text-wastex-green flex items-center justify-center mb-3">
            <Recycle size={26} />
          </div>
          <h1 className="text-white text-xl font-extrabold tracking-tight">WASTEX AI</h1>
          <p className="text-slate-400 text-xs mt-1 text-center">AI-Enabled Smart Waste Segregation<br />& Resource Recovery System</p>
        </div>

        <div className="bg-navy-900 border border-white/5 rounded-2xl shadow-panel p-6">
          <div className="grid grid-cols-3 bg-navy-950 rounded-lg p-1 mb-5">
            {TABS.map((t) => (
              <button
                key={t.role}
                onClick={() => { setTab(t.role); setError('') }}
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  tab === t.role ? 'bg-wastex-green text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-slate-400">Username</label>
              <input
                className="w-full mt-1 bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-wastex-green"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={tab === 'admin' ? 'Selva' : tab === 'collector' ? 'arun01' : 'greencycle'}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Password</label>
              <input
                type="password"
                className="w-full mt-1 bg-navy-950 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-wastex-green"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-xs text-wastex-red bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-wastex-green hover:bg-wastex-greendark text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Sign in
            </button>
          </form>

          {tab === 'vendor' && (
            <p className="text-center text-xs text-slate-400 mt-4">
              New recycling partner?{' '}
              <Link to="/vendor/register" className="text-wastex-green font-semibold hover:underline">
                Register as vendor
              </Link>
            </p>
          )}
        </div>

        <button
          onClick={handleSeed}
          disabled={seeding}
          className="w-full mt-4 text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2 disabled:opacity-50"
        >
          {seeding ? 'Seeding demo data into Firebase…' : 'First time here? Seed demo data (Selva / selva2005, and more)'}
        </button>
      </div>
    </div>
  )
}

function mapAuthError(err) {
  const code = err?.code || ''
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Incorrect username or password.'
  }
  if (code.includes('too-many-requests')) return 'Too many attempts. Try again shortly.'
  return err.message || 'Sign-in failed. Please try again.'
}
