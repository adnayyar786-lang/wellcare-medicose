import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ConvexProviderWithAuth, ConvexReactClient, useMutation } from 'convex/react'
import { useCallback, useEffect, useMemo, useState, createContext, useContext } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { getFirebaseAuth, type FirebaseUserLike } from '@/lib/firebase-auth'
import { api } from '../../convex/_generated/api'

const CONVEX_URL =
  (import.meta as any).env.VITE_CONVEX_URL ||
  'https://impartial-reindeer-344.eu-west-1.convex.cloud'
const convex = new ConvexReactClient(CONVEX_URL)

type FirebaseAuthState = { user: FirebaseUserLike | null; isLoading: boolean }
const FirebaseAuthStateContext = createContext<FirebaseAuthState>({ user: null, isLoading: true })
export function useFirebaseAuthState() { return useContext(FirebaseAuthStateContext) }

function FirebaseSynchronizer({ children }: { children: React.ReactNode }) {
  const { user } = useFirebaseAuthState()
  const ensureUser = useMutation(api.firebaseAuth.ensureUser)
  useEffect(() => {
    if (!user) return
    ensureUser({}).catch(() => {})
  }, [user, ensureUser])
  return <>{children}</>
}

function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUserLike | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let mounted = true
    let lastKnownUser: FirebaseUserLike | null = null
    let ignoreNullUntil = 0

    try {
      const auth = getFirebaseAuth()
      if (!auth) {
        setIsLoading(false)
        return
      }

      // Firebase's observer is authoritative and waits for the SDK to finish
      // restoring any persisted session. Do not treat currentUser === null as
      // a confirmed sign-out before this callback fires.
      const sync = (next: FirebaseUserLike | null) => {
        if (!mounted) return
        // A Google popup can finish before the compat auth observer's
        // initialization callback. Firebase documents that currentUser can
        // temporarily be null while auth is initializing. Never let that
        // transient null immediately kick a freshly signed-in customer back
        // to the login screen.
        if (!next && lastKnownUser && Date.now() < ignoreNullUntil) return
        lastKnownUser = next
        setUser(next)
        setIsLoading(false)
      }

      const restored = auth.currentUser
      if (restored) {
        lastKnownUser = restored as FirebaseUserLike
        setUser(restored as FirebaseUserLike)
      }
      unsubscribe = auth.onAuthStateChanged(sync)

      // signInWithPopup resolves with the authenticated user before React has
      // necessarily processed the auth observer callback. This event closes
      // that small race without forcing a page reload.
      const onSignedIn = (event: Event) => {
        const next = (event as CustomEvent<FirebaseUserLike | null>).detail
        if (next) {
          lastKnownUser = next
          ignoreNullUntil = Date.now() + 10000
          sync(next)
        }
      }
      window.addEventListener('wellcare-firebase-signed-in', onSignedIn)

      return () => {
        mounted = false
        unsubscribe?.()
        window.removeEventListener('wellcare-firebase-signed-in', onSignedIn)
      }
    } catch {
      if (mounted) {
        setUser(null)
        setIsLoading(false)
      }
    }
  }, [])

  const fetchAccessToken = useCallback(async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
    if (!user) return null
    return user.getIdToken(forceRefreshToken)
  }, [user])

  const useAuth = useCallback(() => ({ isLoading, isAuthenticated: !!user, fetchAccessToken }), [isLoading, user, fetchAccessToken])
  const authState = useMemo(() => ({ user, isLoading }), [user, isLoading])

  return (
    <FirebaseAuthStateContext.Provider value={authState}>
      <ConvexProviderWithAuth client={convex} useAuth={useAuth}>
        <FirebaseSynchronizer>{children}</FirebaseSynchronizer>
      </ConvexProviderWithAuth>
    </FirebaseAuthStateContext.Provider>
  )
}

export default function AppConvexProvider({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: s => s.location.pathname })
  const staffPath = pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/staff' || pathname.startsWith('/staff/')
    || pathname === '/staff-login'
  if (staffPath) {
    return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>
  }
  return <FirebaseProvider>{children}</FirebaseProvider>
}