import { createFileRoute, Link } from '@tanstack/react-router'
import { BrandLogo } from '@/components/brand'

export const Route = createFileRoute('/returns')({
  head: () => ({ meta: [{ title: 'Return & Refund Policy — Wellcare Medicose' }] }),
  component: ReturnsPage,
})

function ReturnsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <BrandLogo />
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6 text-sm leading-relaxed text-muted-foreground">
        <h1 className="text-lg font-bold text-foreground">Return & Refund Policy</h1>
        <p>
          Because they are medicines and health products, most items purchased from Wellcare
          Medicose cannot be returned once delivered or collected, in line with standard pharmacy
          practice.
        </p>
        <p>
          If you receive a <strong className="text-foreground">wrong, damaged, or expired</strong>{' '}
          item, please contact us within 24 hours of receiving your order with your order number
          and a photo of the item, and we will arrange a replacement or refund.
        </p>
        <p>
          Orders can be cancelled free of charge before they are dispatched or prepared — use the
          "Cancel Order" option under My Orders.
        </p>
        <p>
          For any questions about a specific order, reach out to us on WhatsApp and we'll help
          resolve it quickly.
        </p>
      </main>
    </div>
  )
}
