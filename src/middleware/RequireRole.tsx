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

  // Block only on initial auth check, not background profile refreshes
  if (isLoading) return <Spinner />

  // Show spinner during profile load only if we have no role yet (first load)
  if (profileLoading && !role) return <Spinner />

  // Profile loaded but role still null — wait rather than redirect
  if (user && !role) return <Spinner />

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
