import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LoginScreen } from '@/components/auth-gate'
import { useEffect } from 'react'

export const Route = createFileRoute('/sign-in')({
  head: () => ({ meta: [{ title: 'Sign in — Wellcare Medicose' }] }),
  component: SignInPage,
})

function SignInPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // IMPORTANT: Do not redirect merely because Firebase has a persisted user.
    // A stale/partial Firebase session can exist while the customer has not
    // completed the current login flow. Redirect only after this login screen
    // itself produces a Firebase session and Convex confirms it is ready.
    let signedInThisVisit = false

    const onSignedIn = () => {
      signedInThisVisit = true
    }

    const onConvexReady = () => {
      if (!signedInThisVisit) return
      void navigate({ to: '/' })
    }

    window.addEventListener('wellcare-firebase-signed-in', onSignedIn)
    window.addEventListener('wellcare-convex-user-ready', onConvexReady)
    return () => {
      window.removeEventListener('wellcare-firebase-signed-in', onSignedIn)
      window.removeEventListener('wellcare-convex-user-ready', onConvexReady)
    }
  }, [navigate])

  return <LoginScreen />
}
