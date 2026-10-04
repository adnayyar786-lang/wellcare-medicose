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
    // Do NOT redirect just because a Firebase session already exists.
    // The sign-in page must remain visible when a user intentionally opens
    // /sign-in. We only go home after an actual sign-in action succeeds.
    const onSignedIn = () => {
      void navigate({ to: '/' })
    }

    window.addEventListener('wellcare-firebase-signed-in', onSignedIn)
    return () => window.removeEventListener('wellcare-firebase-signed-in', onSignedIn)
  }, [navigate])

  return <LoginScreen />
}
