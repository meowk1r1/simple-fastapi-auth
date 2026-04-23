import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import GuestPage from './pages/GuestPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MainPage from './pages/MainPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  
  if (loading) return <div>Загрузка...</div>
  if (!user) {
    navigate('/login', { replace: true })
    return null
  }
  return children
}

export default function App() {
  const { user } = useAuth()
  
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/main" /> : <GuestPage />} />
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/main" />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/main" />} />
      <Route path="/main" element={
        <ProtectedRoute>
          <MainPage />
        </ProtectedRoute>
      } />
    </Routes>
  )
}