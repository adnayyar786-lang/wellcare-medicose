import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ClipboardList, Search, Store, Truck, X, MessageCircle, Package, ChevronRight } from 'lucide-react'

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

export const Route = createFileRoute('/orders')({ head: () => ({ meta: [{ title: 'My Orders — Wellcare Medicose' }] }), component: OrdersPage })
function formatINR(n: number) { return `₹${n.toFixed(2)}` }

function OrdersPage() {
  const [phone, setPhone] = useState('')
  const [searchedPhone, setSearchedPhone] = useState('')
  const { addToCart } = useCart()
  const orders = useQuery(api.orders.findByPhone, searchedPhone ? { phone: searchedPhone } : 'skip')

  useEffect(() => { const saved = getLastPhone(); if (saved) { setPhone(saved); setSearchedPhone(saved) } }, [])

  function handleSearch() {
    const trimmed = phone.trim()
    if (!trimmed) { toast.error('Enter the phone number used while ordering'); return }
    saveLastPhone(trimmed); setSearchedPhone(trimmed)
  }

  function handleReorder(order: NonNullable<typeof orders>[number]) {
    for (const it of order.items) addToCart({ _id: it.medicineId, name: it.name, price: it.price, stock: 9999 }, () => {})
    if (order.items.length) toast.success('Items added to your cart')
  }

  const active = orders?.filter((o) => ['placed','preparing','ready_or_out'].includes(o.status)) ?? []
  const past = orders?.filter((o) => ['completed','cancelled'].includes(o.status)) ?? []

  return <div className="min-h-screen bg-slate-50/70">
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-xl"><div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3"><BrandLogo /><Link to="/" className="rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-secondary">Continue shopping</Link></div></header>
    <main className="mx-auto max-w-3xl px-4 py-5 pb-10">
      <div><h1 className="text-2xl font-extrabold tracking-tight">My Orders</h1><p className="mt-1 text-sm text-muted-foreground">Track active deliveries, pickup orders and past purchases.</p></div>
      <div className="mt-4 flex gap-2"><Input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number used while ordering" className="h-12 rounded-xl bg-card" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} /><Button className="h-12 rounded-xl px-4" onClick={handleSearch} aria-label="Find orders"><Search className="size-4" /></Button></div>

      {searchedPhone && <div className="mt-6 space-y-7">
        {orders === undefined ? <><Skeleton className="h-36 w-full rounded-3xl" /><Skeleton className="h-28 w-full rounded-3xl" /></> : orders.length === 0 ? <div className="rounded-3xl border border-dashed border-border bg-card px-4 py-12 text-center"><ClipboardList className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-semibold">No orders found</p><p className="mt-1 text-xs text-muted-foreground">Check the phone number used while ordering.</p></div> : <>
          {active.length > 0 && <section><div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Active orders</h2><span className="text-xs text-muted-foreground">{active.length}</span></div><div className="space-y-3">{active.map((order) => <OrderCard key={order._id} order={order} onReorder={() => handleReorder(order)} active />)}</div></section>}
          {past.length > 0 && <section><div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Past orders</h2><span className="text-xs text-muted-foreground">{past.length}</span></div><div className="space-y-3">{past.map((order) => <OrderCard key={order._id} order={order} onReorder={() => handleReorder(order)} />)}</div></section>}
        </>}
      </div>}
    </main>
  </div>
}

function OrderCard({ order, onReorder, active }: { order: { _id: Id<'orders'>; status: string; fulfillment: 'pickup'|'delivery'; _creationTime?: number; items: Array<{ medicineId: Id<'medicines'>; name: string; price: number; quantity: number }>; total: number }, onReorder: () => void, active?: boolean }) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [cancelling, setCancelling] = useState(false)
  const cancelItems = useMutation(api.orders.cancelItems)
  const canCancel = order.status === 'placed' || order.status === 'preparing'

  function toggle(id: string) { setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next }) }
  async function handleConfirmCancel() {
    if (!selected.size) { toast.error('Select at least one item'); return }
    setCancelling(true)
    try { await cancelItems({ id: order._id, medicineIds: Array.from(selected) as Id<'medicines'>[]); toast.success('Order updated'); setCancelOpen(false); setSelected(new Set()) }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Could not cancel') }
    finally { setCancelling(false) }
  }

  return <Card className="overflow-hidden rounded-3xl border-border shadow-sm"><CardContent className="p-0">
    <div className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div><Link to="/track/$orderId" params={{ orderId: order._id }} className="text-base font-extrabold text-foreground hover:text-primary">Order #{order._id.slice(-8).toUpperCase()}</Link>{order._creationTime && <p className="mt-0.5 text-xs text-muted-foreground">{new Date(order._creationTime).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>}</div>
        <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', ORDER_STATUS_BADGE[order.status] ?? 'bg-secondary text-secondary-foreground')}>{orderStatusLabel(order.status, order.fulfillment)}</span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1">{order.fulfillment === 'delivery' ? <Truck className="size-3.5 text-primary" /> : <Store className="size-3.5 text-primary" />}{FULFILLMENT_LABEL[order.fulfillment]}</span>{active && <span className="text-primary">{order.fulfillment === 'delivery' ? 'Live status available' : 'Pickup status available'}</span>}</div>
      <div className="mt-4 flex gap-2 overflow-hidden">{order.items.slice(0,4).map((it,i) => <div key={i} className="min-w-0 flex-1 rounded-xl bg-secondary/70 p-2"><p className="line-clamp-2 text-[11px] font-semibold">{it.name}</p><p className="mt-1 text-[10px] text-muted-foreground">Qty {it.quantity}</p></div>)}{order.items.length > 4 && <div className="flex items-center rounded-xl bg-secondary px-3 text-xs font-bold">+{order.items.length-4}</div>}</div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3"><div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p><p className="text-lg font-extrabold">{formatINR(order.total)}</p></div><div className="flex gap-2"><Link to="/track/$orderId" params={{ orderId: order._id }} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground">{active ? 'Track order' : 'View order'}<ChevronRight className="size-4" /></Link>{!active && <Button size="sm" variant="outline" className="rounded-xl" onClick={onReorder}>Reorder</Button>}</div></div>
      {canCancel && <Button size="sm" variant="outline" className="mt-3 w-full rounded-xl text-destructive" onClick={() => setCancelOpen(true)}>Cancel order</Button>}
    </div>
    <Dialog open={cancelOpen} onOpenChange={setCancelOpen}><DialogContent><DialogHeader><DialogTitle>Cancel items</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Select the medicines you want to cancel from this order.</p><div className="space-y-2">{order.items.map((it)=><label key={String(it.medicineId)} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm"><Checkbox checked={selected.has(String(it.medicineId))} onCheckedChange={()=>toggle(String(it.medicineId))}/>{it.quantity} × {it.name}</label>)}</div><DialogFooter><Button variant="outline" onClick={()=>setCancelOpen(false)}><X className="size-4"/> Close</Button><Button variant="destructive" disabled={cancelling} onClick={handleConfirmCancel}>{cancelling?'Cancelling…':'Cancel selected'}</Button></DialogFooter></DialogContent></Dialog>
  </CardContent></Card>
}
