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
    // Redirect only after the auth action has been explicitly confirmed by
    // Firebase. A pre-existing/stale session must never auto-redirect this page.
    const onSignedIn = (event: Event) => {
      const user = (event as CustomEvent).detail
      if (!user) return
      void navigate({ to: '/' })
    }

    window.addEventListener('wellcare-firebase-signed-in', onSignedIn)
    return () => window.removeEventListener('wellcare-firebase-signed-in', onSignedIn)
  }, [navigate])

  return <LoginScreen />
}
