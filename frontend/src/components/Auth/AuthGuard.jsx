import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100svh', background: 'var(--gs-bg)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '2px solid var(--gs-border)',
          borderTopColor: 'var(--gs-lime)',
          animation: 'spin 0.9s linear infinite',
        }} />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}
