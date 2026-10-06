import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { Check, Package, Store, Truck, CheckCircle2, XCircle, MapPin, Phone, ReceiptText, RotateCcw, ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand'
import { FULFILLMENT_LABEL, ORDER_STATUS_BADGE, orderStatusLabel, type Fulfillment } from '@/lib/order-labels'
import { ProductImage, formatINR } from '@/components/product-card'
import { cn } from '@/lib/utils'
import { STORE_LOCATION } from '@/config/store-location'

export const Route = createFileRoute('/track/$orderId')({
  head: () => ({ meta: [{ title: 'Track Order — Wellcare Medicose' }] }),
  component: TrackPage,
})

function stepsFor(f: Fulfillment) {
  return [
    { key: 'placed', label: 'Order placed', icon: Check },
    { key: 'preparing', label: 'Preparing', icon: Package },
    { key: 'ready_or_out', label: f === 'delivery' ? 'Out for delivery' : 'Ready for pickup', icon: f === 'delivery' ? Truck : Store },
    { key: 'completed', label: f === 'delivery' ? 'Delivered' : 'Picked up', icon: CheckCircle2 },
  ] as const
}

function OrderItem({ item }: { item: { medicineId: Id<'medicines'>; name: string; price: number; mrpPrice?: number; quantity: number } }) {
  const med = useQuery(api.medicines.getById, { id: item.medicineId })
  return (
    <div className="flex gap-3 py-3">
      <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
        <ProductImage category={med?.category ?? 'Medicines'} shopCategory={med?.shopCategory} imageUrl={med?.imageUrl} alt="" className="rounded-xl ring-0" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold">{item.name}</p>
        {med?.manufacturer && <p className="mt-0.5 text-xs text-muted-foreground">{med.manufacturer}</p>}
        {item.mrpPrice && item.mrpPrice > item.price && <p className="mt-1 text-[11px] text-muted-foreground line-through">{formatINR(item.mrpPrice)}</p>}
        <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
      </div>
      <p className="shrink-0 text-sm font-bold">{formatINR(item.price * item.quantity)}</p>
    </div>
  )
}

function TrackPage() {
  const { orderId } = useParams({ from: '/track/$orderId' })
  const order = useQuery(api.orders.getById, { id: orderId as Id<'orders'> })
  const [detailsOpen, setDetailsOpen] = useState(true)

  if (order === undefined) return <div className="mx-auto max-w-2xl px-4 py-8"><Skeleton className="h-8 w-48" /><Skeleton className="mt-4 h-32 w-full rounded-3xl" /><Skeleton className="mt-4 h-64 w-full rounded-3xl" /></div>

  if (order === null) return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8 text-center"><BrandLogo /><div className="mt-16"><Package className="mx-auto size-10 text-muted-foreground" /><p className="mt-3 font-semibold">Order not found</p><p className="mt-1 text-sm text-muted-foreground">Check the order link or try again from My Orders.</p><Link to="/orders" className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">My Orders</Link></div></div>
    </div>
  )

  const steps = stepsFor(order.fulfillment)
  const isCancelled = order.status === 'cancelled'
  const currentIndex = steps.findIndex((s) => s.key === order.status)
  const activeIndex = currentIndex < 0 ? 0 : currentIndex
  const isCompleted = order.status === 'completed'
  const canCancel = order.status === 'placed' || order.status === 'preparing'
  const etaText = order.fulfillment === 'delivery'
    ? (order.deliveryTimePref ? `Preferred: ${order.deliveryTimePref}` : 'Delivery timing will be confirmed by the store')
    : (isCompleted ? 'Ready for pickup completed' : order.deliveryTimePref ? `Preferred: ${order.deliveryTimePref}` : 'Pickup readiness will be confirmed by the store')

  return (
    <div className="min-h-screen bg-slate-50/70 pb-10">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/orders" className="rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">← Orders</Link>
          <BrandLogo />
          <span className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-4 sm:py-6">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-wider text-primary">{FULFILLMENT_LABEL[order.fulfillment]}</p><h1 className="mt-1 text-xl font-extrabold tracking-tight">Order #{order._id.slice(-8).toUpperCase()}</h1><p className="mt-1 text-xs text-muted-foreground">{new Date(order._creationTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p></div>
            <span className={cn('rounded-full px-3 py-1 text-xs font-bold', ORDER_STATUS_BADGE[order.status] ?? 'bg-secondary text-secondary-foreground')}>{orderStatusLabel(order.status, order.fulfillment)}</span>
          </div>
          {!isCancelled && <div className="mt-5 rounded-2xl bg-primary/5 p-4"><p className="text-xs font-bold uppercase tracking-wide text-primary">{isCompleted ? 'Order completed' : order.fulfillment === 'delivery' ? 'Delivery update' : 'Pickup update'}</p><p className="mt-1 text-lg font-extrabold">{isCompleted ? (order.fulfillment === 'delivery' ? 'Delivered successfully' : 'Ready and completed') : etaText}</p><p className="mt-1 text-xs text-muted-foreground">{order.paymentStatus === 'paid' ? 'Payment received' : order.paymentStatus === 'cash_on_fulfillment' ? 'Pay on fulfillment' : 'Payment pending'}</p></div>}
          {isCancelled && <div className="mt-5 flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-destructive"><XCircle className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">Order cancelled</p><p className="mt-1 text-xs text-destructive/80">This order is no longer being fulfilled.</p></div></div>}
        </section>

        {!isCancelled && <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-base font-bold">Order status</h2><span className="text-xs text-muted-foreground">Live from store status</span></div>
          <div className="space-y-0">
            {steps.map((step, idx) => {
              const Icon = step.icon
              const done = idx <= activeIndex
              const active = idx === activeIndex
              return <div key={step.key} className="flex gap-3">
                <div className="flex w-8 shrink-0 flex-col items-center"><div className={cn('flex size-8 items-center justify-center rounded-full', done ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground', active && 'ring-4 ring-primary/10')}>{<Icon className="size-4" />}</div>{idx < steps.length - 1 && <div className={cn('my-1 min-h-8 w-0.5 flex-1', idx < activeIndex ? 'bg-primary' : 'bg-border')} />}</div>
                <div className="pb-5 pt-1"><p className={cn('text-sm font-semibold', active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground')}>{step.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{active ? 'Current status' : done ? 'Completed' : 'Not started'}</p></div>
              </div>
            })}
          </div>
        </section>}

        <section className="rounded-3xl border border-border bg-card shadow-sm">
          <button type="button" onClick={() => setDetailsOpen((v) => !v)} className="flex w-full items-center justify-between p-5 text-left"><span><span className="block text-base font-bold">Order details</span><span className="mt-0.5 block text-xs text-muted-foreground">{order.items.length} item{order.items.length === 1 ? '' : 's'} · {formatINR(order.total)}</span></span><ChevronDown className={cn('size-5 transition-transform', detailsOpen && 'rotate-180')} /></button>
          {detailsOpen && <div className="border-t border-border px-5 pb-5"><div className="divide-y divide-border">{order.items.map((item, i) => <OrderItem key={i} item={item} />)}</div><div className="space-y-2 border-t border-border pt-4 text-sm"><div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatINR(order.subtotal ?? order.items.reduce((s, i) => s + i.price * i.quantity, 0))}</span></div><div className="flex justify-between text-muted-foreground"><span>Delivery fee</span><span>{order.deliveryCharge ? formatINR(order.deliveryCharge) : 'FREE'}</span></div>{(order.discount ?? 0) > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><span>−{formatINR(order.discount ?? 0)}</span></div>}<div className="flex justify-between border-t border-border pt-3 text-base font-extrabold"><span>Total</span><span>{formatINR(order.total)}</span></div></div></div>}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{order.fulfillment === 'delivery' ? 'Delivery address' : 'Pickup store'}</p><div className="mt-2 flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" /><p className="select-text text-sm font-medium">{order.fulfillment === 'delivery' ? (order.deliveryAddress ?? 'Address saved with order') : STORE_LOCATION.label}</p></div></div>
          <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Payment</p><div className="mt-2 flex gap-2"><ReceiptText className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="text-sm font-semibold">{order.paymentMethod.toUpperCase()}</p><p className="text-xs text-muted-foreground">{order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'cash_on_fulfillment' ? 'Pay on fulfillment' : 'Pending'}</p></div></div></div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary"><Truck className="size-5 text-primary" /></div><div><p className="text-sm font-bold">{order.fulfillment === 'delivery' ? 'Delivery partner' : 'Store pickup'}</p><p className="mt-1 text-xs text-muted-foreground">{order.fulfillment === 'delivery' ? 'Delivery partner will be assigned soon. We only show partner details when the store has provided them.' : 'Pickup staff will confirm when your order is ready.'}</p></div></div>
        </section>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Link to="/orders" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold hover:bg-secondary"><Package className="size-4" /> Orders</Link>
          <a href="https://wa.me/917088252556" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold hover:bg-secondary"><Phone className="size-4" /> Store</a>
          <Link to="/" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold hover:bg-secondary"><RotateCcw className="size-4" /> Shop again</Link>
          {canCancel && <span className="inline-flex min-h-11 items-center justify-center rounded-xl bg-secondary px-3 text-xs font-semibold text-muted-foreground">Cancel in My Orders</span>}
        </div>
      </main>
    </div>
  )
}
