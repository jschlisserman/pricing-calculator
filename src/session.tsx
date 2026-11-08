import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Role = 'internal' | 'agency'

export interface SessionUser {
  email: string
  name: string
  role: Role
}

const SessionContext = createContext<SessionUser | null>(null)

function redirectToLogin() {
  const returnTo = `${window.location.pathname}${window.location.search}`
  window.location.assign(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`)
}

/** Loads the signed-in user from `/auth/me` and renders nothing until it has one. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/auth/me', { credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) throw new Error(`/auth/me returned ${res.status}`)
        return (await res.json()) as SessionUser
      })
      .then((data) => {
        if (!cancelled) setUser(data)
      })
      .catch(() => {
        if (!cancelled) redirectToLogin()
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!user) return null
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
}

export function useSession(): SessionUser {
  const user = useContext(SessionContext)
  if (!user) throw new Error('useSession must be used inside <SessionProvider>')
  return user
}
