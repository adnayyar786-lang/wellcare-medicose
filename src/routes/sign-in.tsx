import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
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

  // Previously /sign-in always rendered LoginScreen, even after Firebase
  // successfully authenticated the customer. That made successful Google or
  // email sign-ins appear to fail because the user remained on the login UI.
  useEffect(() => {
    if (!isLoading && user) {
      void navigate({ to: '/' })
    }
  }, [isLoading, user, navigate])

  if (isLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    )
  }

  return <LoginScreen />
}
