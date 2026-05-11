import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// Prevents logged-in users from accessing /auth/login and /auth/register
export function RedirectIfAuthed() {
  const { user, role, isLoading, profileLoading } = useAuth()

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-space-900 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) {
    const destination = role === 'admin' ? '/admin' : role === 'seller' ? '/dashboard' : '/marketplace'
    return <Navigate to={destination} replace />
  }

  return <Outlet />
}
