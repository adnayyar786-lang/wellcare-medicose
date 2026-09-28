import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ClipboardList, Search, Store, Truck, X } from 'lucide-react'

import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useCart } from '@/hooks/use-cart'
import { getLastPhone, saveLastPhone } from '@/hooks/use-recently-viewed'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BrandLogo } from '@/components/brand'
import { FULFILLMENT_LABEL, ORDER_STATUS_BADGE, orderStatusLabel } from '@/lib/order-labels'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

export const Route = createFileRoute('/orders')({
  head: () => ({ meta: [{ title: 'My Orders — Wellcare Medicose' }] }),
  component: OrdersPage,
})

function formatINR(n: number) {
  return `₹${n.toFixed(2)}`
}

function OrdersPage() {
  const [phone, setPhone] = useState('')
  const [searchedPhone, setSearchedPhone] = useState('')
  const { addToCart } = useCart()
  const orders = useQuery(api.orders.findByPhone, searchedPhone ? { phone: searchedPhone } : 'skip')

  useEffect(() => {
    const saved = getLastPhone()
    if (saved) {
      setPhone(saved)
      setSearchedPhone(saved)
    }
  }, [])

  function handleSearch() {
    const trimmed = phone.trim()
    if (!trimmed) {
      toast.error('Enter the phone number used while ordering')
      return
    }
    saveLastPhone(trimmed)
    setSearchedPhone(trimmed)
  }

  function handleReorder(order: NonNullable<typeof orders>[number]) {
    let anyAdded = false
    for (const it of order.items) {
      addToCart(
        { _id: it.medicineId, name: it.name, price: it.price, stock: 9999 },
        () => {},
      )
      anyAdded = true
    }
    if (anyAdded) toast.success('Items added to your cart')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <BrandLogo />
          <Link to="/" className="inline-block py-2 text-sm font-medium text-primary hover:underline">Continue shopping</Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-lg font-bold">My Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the phone number you used while placing your order to see its status.
        </p>
        <div className="mt-4 flex gap-2">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your phone number"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch}>
            <Search className="size-4" />
          </Button>
        </div>

        {searchedPhone && (
          <div className="mt-6 space-y-3">
            {orders === undefined ? (
              <>
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
              </>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
                  <ClipboardList className="size-5" />
                </span>
                <p className="text-sm font-medium">No orders found for this number</p>
                <p className="text-xs text-muted-foreground">Check the number you used while ordering.</p>
              </div>
            ) : (
              orders.map((order) => (
                <OrderCard key={order._id} order={order} onReorder={() => handleReorder(order)} />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function OrderCard({
  order,
  onReorder,
}: {
  order: {
    _id: Id<'orders'>
    status: string
    fulfillment: 'pickup' | 'delivery'
    _creationTime?: number
    items: Array<{ medicineId: Id<'medicines'>; name: string; price: number; quantity: number }>
    total: number
  }
  onReorder: () => void
}) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [cancelling, setCancelling] = useState(false)
  const cancelItems = useMutation(api.orders.cancelItems)

  const canCancel = order.status === 'placed' || order.status === 'preparing'

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleConfirmCancel() {
    if (selected.size === 0) {
      toast.error('Select at least one item')
      return
    }
    setCancelling(true)
    try {
      await cancelItems({ id: order._id, medicineIds: Array.from(selected) as Id<'medicines'>[] })
      toast.success('Order updated')
      setCancelOpen(false)
      setSelected(new Set())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not cancel')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link to="/track/$orderId" params={{ orderId: order._id }} className="text-sm font-semibold text-primary hover:underline">
              #{order._id.slice(-8).toUpperCase()}
            </Link>
            {order._creationTime && (
              <p className="text-xs text-muted-foreground">
                {new Date(order._creationTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              ORDER_STATUS_BADGE[order.status] ?? 'bg-secondary text-secondary-foreground',
            )}
          >
            {orderStatusLabel(order.status, order.fulfillment)}
          </span>
        </div>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium">
          {order.fulfillment === 'delivery' ? <Truck className="size-3.5 text-brand-teal" /> : <Store className="size-3.5 text-brand-teal" />}
          {FULFILLMENT_LABEL[order.fulfillment]}
        </p>
        <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
          {order.items.map((it, idx) => (
            <li key={idx}>{it.quantity} × {it.name}</li>
          ))}
        </ul>
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <span className="font-semibold">{formatINR(order.total)}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onReorder}>Reorder</Button>
            {canCancel && (
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => setCancelOpen(true)}>
                Cancel Order
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel items</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Select the medicines you want to cancel from this order.</p>
          <div className="space-y-2">
            {order.items.map((it) => (
              <label key={String(it.medicineId)} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                <Checkbox
                  checked={selected.has(String(it.medicineId))}
                  onCheckedChange={() => toggle(String(it.medicineId))}
                />
                {it.quantity} × {it.name}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              <X className="size-4" /> Close
            </Button>
            <Button variant="destructive" disabled={cancelling} onClick={handleConfirmCancel}>
              {cancelling ? 'Cancelling…' : 'Cancel selected'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
