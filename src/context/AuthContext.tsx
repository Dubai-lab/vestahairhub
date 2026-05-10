import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types'

interface AuthContextValue {
  user:            User | null
  session:         Session | null
  profile:         Profile | null
  role:            UserRole | null
  isLoading:       boolean
  signOut:         () => void
  refreshProfile:  () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchProfileSafe(userId: string): Promise<Profile | null> {
  // Race the DB call against a 10-second timeout so isLoading can never
  // get stuck waiting forever (e.g. bad network, slow cold-start).
  const query   = supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 10_000))
  try {
    const result = await Promise.race([query, timeout])
    if (!result || 'data' in result === false) return null
    return (result as { data: Profile | null }).data
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null)
  const [session,   setSession]   = useState<Session | null>(null)
  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string) => {
    const p = await fetchProfileSafe(userId)
    setProfile(p)
  }, [])

  useEffect(() => {
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          await loadProfile(currentSession.user.id)
        } else {
          setProfile(null)
        }

        // Set loading done after the very first event fires (INITIAL_SESSION
        // or SIGNED_IN). Subsequent events (TOKEN_REFRESHED etc.) don't need
        // to flip this back on.
        if (mounted) setIsLoading(false)
      },
    )

    // Hard failsafe: if onAuthStateChange never fires (extremely rare edge
    // case), stop blocking after 12 seconds rather than hanging forever.
    const failsafe = setTimeout(() => {
      if (mounted) setIsLoading(false)
    }, 12_000)

    return () => {
      mounted = false
      clearTimeout(failsafe)
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signOut = useCallback(() => {
    supabase.auth.signOut().catch(() => {})
    setUser(null)
    setSession(null)
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    await loadProfile(user.id)
  }, [user, loadProfile])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role:     (profile?.role ?? null) as UserRole | null,
        isLoading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
