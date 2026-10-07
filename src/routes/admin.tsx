import { createFileRoute } from '@tanstack/react-router'
import { useConvexAuth, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { AdminApp } from '@/components/admin/admin-app'
import { GoogleAuthButton } from '@/components/google-auth-button'
import { signOutFirebase } from '@/lib/firebase-auth'
import { useFirebaseAuthState } from '@/components/convex-client-provider'
import siteMetadata from '../metadata.json'

const ADMIN_EMAIL = 'adnayyar786@gmail.com'

export const Route = createFileRoute('/admin')({
  head: () => ({
    meta: [
      { title: siteMetadata['/admin'].title },
      { name: 'description', content: siteMetadata['/admin'].description },
    ],
  }),
  component: AdminGate,
})

function AdminGate() {
  const { user, isLoading: authLoading } = useFirebaseAuthState()
  // Convex can briefly be undefined while the Firebase ID token is being attached.\n  // Do not turn that synchronization window into an access-denied screen.\n  const admin = useQuery(api.staff.isAdmin, user ? {} : 'skip')

  if (authLoading) {
    return <AdminStatus message="Restoring your Wellcare session…" />
  }

  if (!user) {
    return (
      <AdminAccessCard
        title="Admin login"
        description="Sign in with the registered Wellcare Medicose admin Gmail to open the command center."
      >
        <GoogleAuthButton premium />
      </AdminAccessCard>
    )
  }

  const email = user.email?.trim().toLowerCase() ?? ''

  if (email !== ADMIN_EMAIL) {
    return (
      <AdminAccessCard
        title="Admin access restricted"
        description={`This account (${user.email ?? 'unknown account'}) is not the registered Wellcare Medicose admin account.`}
      >
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => void signOutFirebase()}
            className="w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.14]"
          >
            Sign out and use admin Gmail
          </button>
          <p className="text-center text-xs text-slate-400">Admin account: {ADMIN_EMAIL}</p>
        </div>
      </AdminAccessCard>
    )
  }

  if (convexAuthLoading || (user && !convexAuthenticated)) {
    return <AdminStatus message="Connecting to the Wellcare admin service…" />
  }

  if (admin === undefined) {
    return <AdminStatus message="Verifying admin access…" />
  }

  if (!admin) {
    return (
      <AdminAccessCard
        title="Admin verification failed"
        description="Your Firebase account is signed in, but Convex has not accepted it as the Wellcare Medicose admin identity yet."
      >
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            Retry verification
          </button>
          <p className="text-center text-xs text-slate-400">Signed in as {user.email}</p>
        </div>
      </AdminAccessCard>
    )
  }

  return <AdminApp adminEmail={ADMIN_EMAIL} />
}

function AdminStatus({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="rounded-3xl border border-white/10 bg-white/[0.06] px-7 py-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 size-7 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
        <p className="text-sm text-slate-300">{message}</p>
      </div>
    </main>
  )
}

function AdminAccessCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-7 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl">⚕</div>
        <h1 className="mt-5 text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  )
}
