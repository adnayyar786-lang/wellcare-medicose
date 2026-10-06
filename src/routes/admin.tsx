import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { AdminApp } from '@/components/admin/admin-app'
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
  const admin = useQuery(api.staff.isAdmin)

  if (admin === undefined) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white"><p className="text-sm text-slate-300">Checking admin access…</p></main>
  }

  if (!admin) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-7 text-center shadow-2xl"><h1 className="text-2xl font-bold">Admin access restricted</h1><p className="mt-2 text-sm text-slate-300">Only the registered Wellcare Medicose admin Gmail can open this panel.</p><p className="mt-4 text-xs text-slate-400">Sign in with the authorized admin account.</p></section></main>
  }

  return <AdminApp adminEmail={ADMIN_EMAIL} />
}
