import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types'

interface Props {
  allowedRoles: UserRole[]
  redirectTo?:  string
}

export function RequireRole({ allowedRoles, redirectTo = '/' }: Props) {
  const { role, isLoading, profileLoading } = useAuth()

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-space-900 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
