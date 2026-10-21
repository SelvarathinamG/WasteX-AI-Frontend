import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isFirebaseConfigured } from '../firebase/config'

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth()

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 text-white p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold">Firebase configuration missing</h1>
          <p className="text-sm text-slate-300">
            Create a <code className="bg-navy-800 px-1 py-0.5 rounded">.env.local</code> file from{' '}
            <code className="bg-navy-800 px-1 py-0.5 rounded">.env.example</code> and fill in your Firebase project
            credentials, then restart <code className="bg-navy-800 px-1 py-0.5 rounded">npm run dev</code>.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="w-10 h-10 border-2 border-wastex-green border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />

  return children
}
