import { createContext, useContext, useState, useEffect } from 'react'
import { api, setAuthToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setAuthToken(token)
      api.get('/api/v1/about_me/')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token')
          setAuthToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const form = new FormData()
    form.append('username', username)
    form.append('password', password)
    
    const res = await api.post('/api/v1/login/', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    localStorage.setItem('token', res.data.access_token)
    setAuthToken(res.data.access_token)
    const userRes = await api.get('/api/v1/about_me/')
    setUser(userRes.data)
    return userRes.data
  }

  const register = async (username, email, password) => {
    const res = await api.post('/api/v1/register/', { username, email, password })
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setAuthToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}