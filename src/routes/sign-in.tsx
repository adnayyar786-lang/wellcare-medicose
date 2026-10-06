import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LoginScreen } from '@/components/auth-gate'
import { useFirebaseAuthState } from '@/components/convex-client-provider'
import { useEffect } from 'react'

export const Route = createFileRoute('/sign-in')({
  head: () => ({ meta: [{ title: 'Sign in — Wellcare Medicose' }] }),
  component: SignInPage,
})

function SignInPage() {
  const navigate = useNavigate()
  const { user, isLoading } = useFirebaseAuthState()

  useEffect(() => {
    // Navigate only from Firebase's persisted/authenticated state.
    // Do not navigate from the raw Google popup result: doing that can move
    // to Home before Firebase persistence and the Convex JWT session are ready.
    if (!isLoading && user) {
      void navigate({ to: '/' })
    }
  }, [isLoading, user, navigate])

  return <LoginScreen />
}
