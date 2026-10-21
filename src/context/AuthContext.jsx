import { createContext, useContext, useEffect, useState } from 'react'
import { subscribeToAuthState, logout as firebaseLogout } from '../firebase/auth'
import { isFirebaseConfigured } from '../firebase/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return
    }
    const unsubscribe = subscribeToAuthState((profile) => {
      setUser(profile)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const logout = async () => {
    await firebaseLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
