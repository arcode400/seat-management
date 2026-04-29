import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F7FA' }}>
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#0D47A1" strokeWidth="3" strokeOpacity="0.2" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#0D47A1" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <p className="text-sm text-gray-400">Memuat sesi...</p>
      </div>
    </div>
  )
}

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? children : <Navigate to="/login" replace />
}
