import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LoginScreen } from '@/components/auth-gate'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/sign-in')({
  head: () => ({ meta: [{ title: 'Sign in — Wellcare Medicose' }] }),
  component: SignInPage,
})

function SignInPage() {
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    // Firebase and Convex can finish in either order. Redirect only after
    // both have explicitly confirmed the same login attempt.
    let firebaseReady = false
    let convexReady = false
    let navigating = false

    const maybeNavigate = () => {
      if (navigating || !firebaseReady || !convexReady) return
      navigating = true
      void navigate({ to: '/' })
    }

    const onFirebaseSignedIn = () => {
      firebaseReady = true
      setAuthError(null)
      maybeNavigate()
    }

    const onConvexReady = () => {
      convexReady = true
      setAuthError(null)
      maybeNavigate()
    }

    const onSyncFailed = (event: Event) => {
      firebaseReady = false
      convexReady = false
      setAuthError(
        (event as CustomEvent<string>).detail ||
          'Google verification succeeded, but Wellcare could not finish your account setup. Please try again.',
      )
    }

    window.addEventListener('wellcare-firebase-signed-in', onFirebaseSignedIn)
    window.addEventListener('wellcare-convex-user-ready', onConvexReady)
    window.addEventListener('wellcare-convex-user-sync-failed', onSyncFailed)

    return () => {
      window.removeEventListener('wellcare-firebase-signed-in', onFirebaseSignedIn)
      window.removeEventListener('wellcare-convex-user-ready', onConvexReady)
      window.removeEventListener('wellcare-convex-user-sync-failed', onSyncFailed)
    }
  }, [navigate])

  return (
    <>
      <LoginScreen />
      {authError && (
        <div className="fixed bottom-5 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl border border-red-300/30 bg-red-950/95 p-4 text-sm text-red-100 shadow-2xl">
          {authError}
        </div>
      )}
    </>
  )
}
