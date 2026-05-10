import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function RequireAuth() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  // CRITICAL: never redirect while session is still being restored from localStorage.
  // Supabase fires INITIAL_SESSION asynchronously — isLoading stays true until it resolves.
  if (isLoading) {
    return (
      <div className="min-h-screen bg-space-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/50 text-sm font-medium">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // Save the page they tried to visit so we can redirect back after login
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
