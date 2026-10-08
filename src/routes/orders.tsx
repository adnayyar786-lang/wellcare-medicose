import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ClipboardList, Search, Store, Truck, X, Package, ChevronRight, CheckCircle2, MapPin, CreditCard, Headphones, RefreshCw, Clock3, ShoppingBag, FileText, Phone, MessageCircle } from 'lucide-react'

import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useCart } from '@/hooks/use-cart'
import { getLastPhone, saveLastPhone } from '@/hooks/use-recently-viewed'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { BrandLogo } from '@/components/brand'
import { FULFILLMENT_LABEL, ORDER_STATUS_BADGE, orderStatusLabel } from '@/lib/order-labels'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

export const Route = createFileRoute('/orders')({ head: () => ({ meta: [{ title: 'My Orders — Wellcare Medicose' }] }), component: OrdersPage })
function formatINR(n: number) { return `₹${n.toFixed(2)}` }

type Order = {
  _id: Id<'orders'>
  status: string
  fulfillment: 'pickup' | 'delivery'
  _creationTime?: number
  items: Array<{ medicineId: Id<'medicines'>; name: string; price: number; quantity: number }>
  total: number
}

function OrdersPage() {
  const [phone, setPhone] = useState('')
  const [searchedPhone, setSearchedPhone] = useState('')
  const [selectedId, setSelectedId] = useState<Id<'orders'> | null>(null)
  const { addToCart } = useCart()
  const orders = useQuery(api.orders.findByPhone, searchedPhone ? { phone: searchedPhone } : 'skip')

  useEffect(() => { const saved = getLastPhone(); if (saved) { setPhone(saved); setSearchedPhone(saved) } }, [])

  function handleSearch() {
    const trimmed = phone.trim()
    if (!trimmed) { toast.error('Enter the phone number used while ordering'); return }
    saveLastPhone(trimmed)
    setSearchedPhone(trimmed)
    setSelectedId(null)
  }

  function handleReorder(order: Order) {
    for (const it of order.items) addToCart({ _id: it.medicineId, name: it.name, price: it.price, stock: 9999 }, () => {})
    if (order.items.length) toast.success('Items added to your cart')
  }

  const active = orders?.filter((o) => ['placed', 'preparing', 'ready_or_out'].includes(o.status)) ?? []
  const past = orders?.filter((o) => ['completed', 'cancelled'].includes(o.status)) ?? []
  const all = orders ?? []
  const selected = all.find((o) => o._id === selectedId) ?? all[0] ?? null

  useEffect(() => {
    if (all.length && (!selectedId || !all.some((o) => o._id === selectedId))) setSelectedId(all[0]._id)
  }, [all, selectedId])

  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.10),transparent_28%),linear-gradient(135deg,#f7fbfc_0%,#edf7fb_52%,#f8fafc_100%)]">
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3 lg:px-6">
        <BrandLogo />
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />
        <div className="hidden text-sm font-bold text-slate-700 sm:block">My Orders</div>
        <div className="ml-auto flex items-center gap-2"><Link to="/" className="rounded-xl px-3 py-2 text-sm font-bold text-primary hover:bg-primary/10">Continue shopping</Link><div className="hidden size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brand-blue text-white sm:flex"><ShoppingBag className="size-4" /></div></div>
      </div>
    </header>

    <main className="mx-auto max-w-[1500px] px-3 py-4 pb-10 sm:px-5 lg:px-6">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Wellcare Medicose</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">My Orders</h1><p className="mt-1 text-sm text-slate-500">Track deliveries, pickup orders and your complete purchase history.</p></div>
        <div className="flex w-full max-w-xl gap-2"><Input inputMode="tel" value={phone} onChange={(e) => { const value = e.target.value; setPhone(value); if (value.trim() !== searchedPhone.trim()) { setSearchedPhone(''); setSelectedId(null) } }} placeholder="Search orders by phone number" className="h-11 rounded-xl border-white/80 bg-white/80 shadow-sm backdrop-blur" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} /><Button className="h-11 rounded-xl bg-gradient-to-r from-primary to-brand-blue px-4 shadow-md" onClick={handleSearch} aria-label="Find orders"><Search className="size-4" /><span className="ml-2 hidden sm:inline">Find Orders</span></Button></div>
      </div>

      {!searchedPhone ? <EmptyOrders /> : orders === undefined ? <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"><Skeleton className="h-[620px] rounded-3xl" /><Skeleton className="h-[620px] rounded-3xl" /></div> : orders.length === 0 ? <NoOrders /> : <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white/75 shadow-[0_20px_55px_-35px_rgba(15,118,110,0.5)] backdrop-blur-xl">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-5"><div className="flex items-center justify-between"><div><h2 className="font-black text-slate-900">Order history</h2><p className="mt-0.5 text-xs text-slate-500">{all.length} orders found</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{active.length} active</span></div>
          </div>
          <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3 sm:px-5">
            {[['All', all.length], ['Active', active.length], ['Past', past.length]].map(([label, count]) => <span key={String(label)} className={cn('shrink-0 rounded-full px-3 py-1.5 text-xs font-bold', label === 'All' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500')}>{label} <span className="ml-1 opacity-80">{count}</span></span>)}
          </div>
          <div className="max-h-[720px] space-y-2.5 overflow-y-auto p-3 sm:p-4">
            {all.map((order) => <OrderListCard key={order._id} order={order} selected={selected?._id === order._id} onSelect={() => setSelectedId(order._id)} onReorder={() => handleReorder(order)} />)}
          </div>
        </section>
        <OrderDetail order={selected} onReorder={selected ? () => handleReorder(selected) : undefined} />
      </div>}
    </main>
  </div>
}

function EmptyOrders() {
  return <div className="flex min-h-[520px] items-center justify-center rounded-3xl border border-white/80 bg-white/70 shadow-sm backdrop-blur-xl"><div className="max-w-md px-6 text-center"><span className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-primary shadow-inner"><ClipboardList className="size-9" /></span><h2 className="mt-5 text-2xl font-black text-slate-900">Find your orders</h2><p className="mt-2 text-sm leading-6 text-slate-500">Enter the phone number used while ordering to see active deliveries, pickup orders and past purchases.</p></div></div>
}
function NoOrders() {
  return <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 text-center shadow-sm"><div><ClipboardList className="mx-auto size-10 text-slate-300" /><p className="mt-3 font-black text-slate-800">No orders found</p><p className="mt-1 text-xs text-slate-500">Check the phone number used while ordering.</p></div></div>
}

function OrderListCard({ order, selected, onSelect, onReorder }: { order: Order; selected: boolean; onSelect: () => void; onReorder: () => void }) {
  const canCancel = order.status === 'placed' || order.status === 'preparing'
  return <button type="button" onClick={onSelect} className={cn('w-full rounded-2xl border bg-white/80 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4', selected ? 'border-primary/50 bg-emerald-50/70 ring-2 ring-primary/10' : 'border-slate-100')}>
    <div className="flex items-start gap-3"><div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', selected ? 'bg-gradient-to-br from-primary to-brand-blue text-white' : 'bg-slate-100 text-primary')}>{order.fulfillment === 'delivery' ? <Truck className="size-5" /> : <Store className="size-5" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-black text-slate-900">#{order._id.slice(-8).toUpperCase()}</span><span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold', ORDER_STATUS_BADGE[order.status] ?? 'bg-slate-100 text-slate-600')}>{orderStatusLabel(order.status, order.fulfillment)}</span></div><p className="mt-1 text-[11px] text-slate-400">{order._creationTime ? new Date(order._creationTime).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : 'Recent order'}</p><div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500"><span>{order.items.length} items</span><span>•</span><span className="font-black text-slate-800">{formatINR(order.total)}</span></div><div className="mt-3 flex gap-1.5 overflow-hidden">{order.items.slice(0,3).map((it,i)=><span key={i} className="truncate rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500">{it.name}</span>)}{order.items.length>3&&<span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">+{order.items.length-3}</span>}</div></div><ChevronRight className={cn('mt-1 size-4 shrink-0', selected ? 'text-primary' : 'text-slate-300')} /></div>
    <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3"><Link onClick={(e)=>e.stopPropagation()} to="/track/$orderId" params={{orderId:order._id}} className="inline-flex min-h-9 flex-1 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-brand-blue text-[11px] font-bold text-white">Track Order</Link>{order.status === 'completed' && <Button type="button" size="sm" variant="outline" className="h-9 rounded-lg text-[11px]" onClick={(e)=>{e.stopPropagation();onReorder()}}>Reorder</Button>}{canCancel && <span className="inline-flex items-center rounded-lg bg-rose-50 px-2.5 text-[10px] font-bold text-rose-600">Cancel available</span>}</div>
  </button>
}

function OrderDetail({ order, onReorder }: { order: Order | null; onReorder?: () => void }) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const [selected, setSelected] = useState<Set<Id<'medicines'>>>(new Set())
  const [cancelling, setCancelling] = useState(false)
  const cancelItems = useMutation(api.orders.cancelItems)
  if (!order) return <div className="min-h-[620px] rounded-3xl border border-white/80 bg-white/70 p-8 text-center text-slate-400 shadow-sm">Select an order to view details.</div>
  const canCancel = order.status === 'placed' || order.status === 'preparing'
  function toggle(id: Id<'medicines'>) { setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next }) }
  async function confirmCancel() { if (!selected.size) { toast.error('Select at least one item'); return } setCancelling(true); try { await cancelItems({id:order._id,medicineIds:Array.from(selected)}); toast.success('Order updated'); setCancelOpen(false); setSelected(new Set()) } catch(err) { toast.error(err instanceof Error ? err.message : 'Could not cancel') } finally { setCancelling(false) } }
  const step = order.status === 'placed' ? 0 : order.status === 'preparing' ? 1 : order.status === 'ready_or_out' ? 2 : order.status === 'completed' ? 3 : 0
  const steps = order.fulfillment === 'delivery' ? ['Confirmed','Preparing','Out for Delivery','Delivered'] : ['Confirmed','Preparing','Ready for Pickup','Picked Up']
  return <section className="min-w-0 overflow-hidden rounded-3xl border border-white/80 bg-white/75 shadow-[0_20px_55px_-35px_rgba(15,118,110,0.55)] backdrop-blur-xl">
    <div className="border-b border-slate-100 bg-gradient-to-r from-white to-emerald-50/70 px-4 py-4 sm:px-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><Link to="/track/$orderId" params={{orderId:order._id}} className="flex items-center gap-2 text-lg font-black text-slate-900 hover:text-primary"><ChevronRight className="rotate-180 size-5" />Order #{order._id.slice(-8).toUpperCase()}</Link><p className="mt-1 text-xs text-slate-500">Placed {order._creationTime ? new Date(order._creationTime).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : ''}</p></div><span className={cn('rounded-full px-3 py-1.5 text-xs font-black', ORDER_STATUS_BADGE[order.status] ?? 'bg-slate-100 text-slate-600')}>{orderStatusLabel(order.status, order.fulfillment)}</span></div></div>
    <div className="p-3 sm:p-5">
      <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-primary">Order journey</p><p className="mt-1 text-xs text-slate-500">{order.fulfillment === 'delivery' ? 'Your order is moving towards you' : 'Your store pickup is being prepared'}</p></div><Clock3 className="size-5 text-primary" /></div><div className="grid grid-cols-4 gap-1">{steps.map((name,i)=><div key={name} className="relative text-center"><div className={cn('mx-auto flex size-9 items-center justify-center rounded-full border-2', i <= step ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-300')}>{i < step ? <CheckCircle2 className="size-4" /> : <span className="text-xs font-black">{i+1}</span>}</div><p className={cn('mt-2 text-[10px] font-bold',i<=step?'text-slate-800':'text-slate-400')}>{name}</p>{i<3&&<div className={cn('absolute left-[58%] top-4 h-0.5 w-[84%]',i<step?'bg-primary':'bg-slate-200')} />}</div>)}</div></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-slate-100 bg-white/80 p-4"><div className="flex items-center gap-2 text-sm font-black text-slate-800"><MapPin className="size-4 text-primary" /> {order.fulfillment === 'delivery' ? 'Delivery address' : 'Store pickup'}</div><p className="mt-2 text-xs leading-5 text-slate-500">{order.fulfillment === 'delivery' ? 'Home delivery selected. Your saved delivery address will be used at checkout.' : 'Pickup from your selected Wellcare store.'}</p><Link to="/checkout" className="mt-2 inline-flex text-xs font-bold text-primary">View checkout details <ChevronRight className="ml-1 size-3.5" /></Link></div><div className="rounded-2xl border border-slate-100 bg-white/80 p-4"><div className="flex items-center gap-2 text-sm font-black text-slate-800"><CreditCard className="size-4 text-brand-blue" /> Payment</div><p className="mt-2 text-xs text-slate-500">Order total</p><p className="text-lg font-black text-slate-900">{formatINR(order.total)}</p><span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Order placed successfully</span></div></div>
      <div className="mt-3 rounded-2xl border border-slate-100 bg-white/80 p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-black text-slate-800">Order Items ({order.items.length})</p><p className="text-[11px] text-slate-400">Your medicines and healthcare products</p></div><Package className="size-5 text-primary" /></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{order.items.map((it)=><div key={String(it.medicineId)} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3"><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{it.name}</p><p className="mt-1 text-[10px] text-slate-400">Qty {it.quantity}</p></div><p className="ml-3 text-sm font-black text-primary">{formatINR(it.price * it.quantity)}</p></div>)}</div></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3"><Link to="/track/$orderId" params={{orderId:order._id}} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-brand-blue text-xs font-black text-white shadow-md"><Truck className="size-4" /> Track Live</Link>{onReorder && <Button className="h-11 rounded-xl bg-white text-xs font-black text-primary shadow-sm" variant="outline" onClick={onReorder}><RefreshCw className="mr-2 size-4" /> Reorder</Button>}<Button variant="outline" className="h-11 rounded-xl text-xs font-bold"><Headphones className="mr-2 size-4" /> Need Help?</Button></div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><Button variant="outline" className="rounded-xl text-xs"><FileText className="mr-1.5 size-3.5" /> Invoice</Button><Button variant="outline" className="rounded-xl text-xs"><MessageCircle className="mr-1.5 size-3.5" /> Chat</Button><Button variant="outline" className="rounded-xl text-xs"><Phone className="mr-1.5 size-3.5" /> Call</Button>{canCancel && <Button variant="outline" className="rounded-xl text-xs text-rose-600 hover:bg-rose-50" onClick={()=>setCancelOpen(true)}><X className="mr-1.5 size-3.5" /> Cancel</Button>}</div>
    </div>
    <Dialog open={cancelOpen} onOpenChange={setCancelOpen}><DialogContent><DialogHeader><DialogTitle>Cancel items</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Select the medicines you want to cancel from this order.</p><div className="space-y-2">{order.items.map((it)=><label key={String(it.medicineId)} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm"><Checkbox checked={selected.has(it.medicineId)} onCheckedChange={()=>toggle(it.medicineId)} />{it.quantity} × {it.name}</label>)}</div><DialogFooter><Button variant="outline" onClick={()=>setCancelOpen(false)}>Close</Button><Button variant="destructive" disabled={cancelling} onClick={confirmCancel}>{cancelling?'Cancelling…':'Cancel selected'}</Button></DialogFooter></DialogContent></Dialog>
  </section>
}
