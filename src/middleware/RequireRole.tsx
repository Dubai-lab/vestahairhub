import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types'

interface Props {
  allowedRoles: UserRole[]
  redirectTo?:  string
}

const Spinner = () => (
  <div className="min-h-screen bg-space-900 flex items-center justify-center">
    <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

export function RequireRole({ allowedRoles, redirectTo = '/' }: Props) {
  const { user, role, isLoading, profileLoading } = useAuth()

  // Wait for initial auth check
  if (isLoading || profileLoading) return <Spinner />

  // User is authenticated but profile hasn't resolved yet — wait instead of redirecting
  if (user && !role) return <Spinner />

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
