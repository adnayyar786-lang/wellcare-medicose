import { createFileRoute } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'
import { Loader2 } from 'lucide-react'
import { LoginScreen } from '@/components/auth-gate'

export const Route = createFileRoute('/sign-in')({
  head: () => ({ meta: [{ title: 'Sign in — Wellcare Medicose' }] }),
  component: SignInPage,
})

function SignInPage() {
  const { isLoading } = useConvexAuth()

  // Do not redirect from this route based only on Convex's auth state. A stale
  // or prematurely restored session previously sent guests straight home,
  // preventing them from seeing the actual sign-in form.
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="size-7 animate-spin text-primary" /></div>
  }

  return <LoginScreen />
}
