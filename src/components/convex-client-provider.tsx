import { ConvexProviderWithAuth, ConvexReactClient, useConvexAuth, useMutation } from 'convex/react'
import { useCallback, useEffect, useMemo, useState, createContext, useContext } from 'react'
import { getFirebaseAuth, type FirebaseUserLike } from '@/lib/firebase-auth'
import { api } from '../../convex/_generated/api'

// Customer production backend is fixed to the migrated Wellcare Medicose deployment.
// Do not allow a stale Cloudflare VITE_CONVEX_URL to redirect customers to the old Macaly Convex project.
const CONVEX_URL = 'https://hardy-parakeet-432.convex.cloud'
const convex = new ConvexReactClient(CONVEX_URL)

type FirebaseAuthState = { user: FirebaseUserLike | null; isLoading: boolean }
const FirebaseAuthStateContext = createContext<FirebaseAuthState>({ user: null, isLoading: true })
export function useFirebaseAuthState() { return useContext(FirebaseAuthStateContext) }

function FirebaseSynchronizer({ children }: { children: React.ReactNode }) {
  const { user } = useFirebaseAuthState()
  const { isAuthenticated, isLoading: isConvexAuthLoading } = useConvexAuth()
  const ensureUser = useMutation(api.firebaseAuth.ensureUser)

  useEffect(() => {
    let cancelled = false
    if (!user || isConvexAuthLoading || !isAuthenticated) return

    // Wait until Convex has accepted the Firebase ID token before creating the
    // application user. A one-shot mutation during the auth handshake can fail
    // with "Authentication required", leaving Firebase signed in but the
    // Wellcare profile/order identity missing until the next page refresh.
    const syncUser = async () => {
      let lastError: unknown
      for (let attempt = 0; attempt < 5; attempt += 1) {
        if (cancelled) return
        try {
          await user.getIdToken(true)
          await ensureUser({})
          if (!cancelled) {
            window.dispatchEvent(new CustomEvent('wellcare-convex-user-ready', { detail: user }))
          }
          return
        } catch (error) {
          lastError = error
          if (attempt < 4) {
            await new Promise(resolve => window.setTimeout(resolve, 400 * (attempt + 1)))
          }
        }
      }

      if (!cancelled) {
        console.error('Wellcare Firebase → Convex user sync failed after retries', lastError)
        window.dispatchEvent(new CustomEvent('wellcare-convex-user-sync-failed', {
          detail: lastError instanceof Error ? lastError.message : 'Could not create the Wellcare account session.',
        }))
      }
    }

    void syncUser()
    return () => { cancelled = true }
  }, [user, isAuthenticated, isConvexAuthLoading, ensureUser])

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
      const firebase = (window as any).firebase
      if (!auth) {
        setIsLoading(false)
        return
      }

      const sync = (next: FirebaseUserLike | null) => {
        if (!mounted) return
        // Do not replace a just-restored/signed-in user with a transient null.
        if (!next && lastKnownUser && Date.now() < ignoreNullUntil) return
        lastKnownUser = next
        setUser(next)
        setIsLoading(false)
      }

      // Explicitly restore Firebase LOCAL persistence before observing auth.
      // This prevents Android/Chrome from briefly reporting a signed-out state
      // after the Google popup returns and the app navigates between routes.
      const preparePersistence = async () => {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      }

      // Keep the gate in loading state until Firebase has restored LOCAL
      // persistence and processed any pending Google redirect result.
      const processRedirect = async () => {
        try {
          const result = await auth.getRedirectResult()
          if (result?.user) {
            lastKnownUser = result.user as FirebaseUserLike
            ignoreNullUntil = Date.now() + 10000
            sync(result.user as FirebaseUserLike)
            window.dispatchEvent(
              new CustomEvent('wellcare-firebase-signed-in', { detail: result.user }),
            )
          }
        } catch (error) {
          // A redirect result error should not be turned into a fake signed-out
          // state. The UI can continue with the normal auth observer.
          console.error('Firebase Google redirect result failed', error)
        }
      }

      const restored = auth.currentUser
      if (restored) {
        lastKnownUser = restored as FirebaseUserLike
        setUser(restored as FirebaseUserLike)
      }

      void (async () => {
        try {
          await preparePersistence()
        } catch (error) {
          console.error('Firebase persistence setup failed', error)
        }
        if (!mounted) return
        unsubscribe = auth.onAuthStateChanged(sync)
        await processRedirect()
      })()

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
  // Customer, staff and admin share one Firebase -> Convex identity bridge.
  // This prevents route changes from switching authentication providers.
  return <FirebaseProvider>{children}</FirebaseProvider>
}
