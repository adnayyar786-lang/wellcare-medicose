import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { Check, Package, Store, Truck, CheckCircle2, XCircle } from 'lucide-react'

import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Skeleton } from '@/components/ui/skeleton'
import { BrandLogo } from '@/components/brand'
import { FULFILLMENT_LABEL, ORDER_STATUS_BADGE, orderStatusLabel, type Fulfillment } from '@/lib/order-labels'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/track/$orderId')({
  head: () => ({ meta: [{ title: 'Track Order — Wellcare Medicose' }] }),
  component: TrackPage,
})

function formatINR(n: number) {
  return `₹${n.toFixed(2)}`
}

// Same real statuses for every order; only the wording differs for delivery vs pickup.
function stepsFor(f: Fulfillment) {
  return [
    { key: 'placed', label: 'Order Placed', icon: Check },
    { key: 'preparing', label: 'Preparing', icon: Package },
    { key: 'ready_or_out', label: orderStatusLabel('ready_or_out', f), icon: f === 'delivery' ? Truck : Store },
    { key: 'completed', label: orderStatusLabel('completed', f), icon: CheckCircle2 },
  ]
}

function TrackPage() {
  const { orderId } = useParams({ from: '/track/$orderId' })
  const order = useQuery(api.orders.getById, { id: orderId as Id<'orders'> })

  if (order === undefined) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-24 w-full" />
      </div>
    )
  }

  if (order === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Order not found.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary underline">Back to home</Link>
      </div>
    )
  }

  const STEPS = stepsFor(order.fulfillment)
  const isCancelled = order.status === 'cancelled'
  const currentIndex = STEPS.findIndex((s) => s.key === order.status)

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
        <BrandLogo />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-muted-foreground">
            {FULFILLMENT_LABEL[order.fulfillment]} · {order.customerName}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
            ORDER_STATUS_BADGE[order.status] ?? 'bg-secondary text-secondary-foreground',
          )}
        >
          {orderStatusLabel(order.status, order.fulfillment)}
        </span>
      </div>

      {isCancelled ? (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          <XCircle className="size-5" />
          <span className="text-sm font-medium">This order was cancelled.</span>
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex items-center">
            {STEPS.map((step, idx) => {
              const Icon = step.icon
              const done = idx <= currentIndex
              return (
                <div key={step.key} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    {idx > 0 && <div className={`h-0.5 flex-1 ${idx <= currentIndex ? 'bg-primary' : 'bg-border'}`} />}
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${done ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      <Icon className="size-4" />
                    </div>
                    {idx < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${idx < currentIndex ? 'bg-primary' : 'bg-border'}`} />}
                  </div>
                  <span className="mt-1.5 max-w-[70px] text-center text-[10px] leading-tight text-muted-foreground">{step.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-8 space-y-1 rounded-2xl border border-border bg-card p-4">
        {order.items.map((it, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span>{it.quantity} × {it.name}</span>
            <span>{formatINR(it.price * it.quantity)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
          <span>Total</span>
          <span>{formatINR(order.total)}</span>
        </div>
      </div>

      {order.fulfillment === 'pickup' ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Store className="size-4" /> Collect from Wellcare Medicose, Satti Mohalla, near Badshah Hotel, Roorkee
        </div>
      ) : (
        order.deliveryAddress && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="size-4" /> Delivering to: {order.deliveryAddress}
          </div>
        )
      )}
    </div>
  )
}
