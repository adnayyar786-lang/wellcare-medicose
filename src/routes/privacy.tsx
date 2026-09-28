import { createFileRoute, Link } from '@tanstack/react-router'
import { BrandLogo } from '@/components/brand'

export const Route = createFileRoute('/privacy')({
  head: () => ({ meta: [{ title: 'Privacy Policy — Wellcare Medicose' }] }),
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <BrandLogo />
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6 text-sm leading-relaxed text-muted-foreground">
        <h1 className="text-lg font-bold text-foreground">Privacy Policy</h1>
        <p>
          When you sign in with Google, we store your name, email address, and profile photo as
          provided by Google, along with the date and time of each sign-in.
        </p>
        <p>
          While you're signed in, we keep a record of the medicines and products you view — the
          product name and the time you viewed it. This helps us understand what our customers are
          looking for and improve our catalog and service. If you place an order while signed in,
          we link that order to your account so our team can see your order history alongside your
          browsing activity.
        </p>
        <p>
          Our team may use this activity data to follow up with you about products you've shown
          interest in, or to improve how we stock and present our catalog.
        </p>
        <p>
          We do not sell your personal data to third parties. Your data is used only to operate and
          improve Wellcare Medicose.
        </p>
        <p>
          If you'd like your account data removed, message us on WhatsApp and we'll take care of
          it.
        </p>
      </main>
    </div>
  )
}
