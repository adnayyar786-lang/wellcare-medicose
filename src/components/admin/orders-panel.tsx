import { useMemo, useState } from 'react'
import { useMutation } from 'convex/react'
import { toast } from 'sonner'
import { Search, X, Check, Package, Truck, Store, CheckCircle2 } from 'lucide-react'

import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { AdminCard, StatusBadge, FulfillmentBadge, EmptyState } from './admin-ui'
import type { useAdminData } from '@/hooks/use-admin-data'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function formatINR(n: number) {
  return `₹${n.toFixed(2)}`
}
function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

const STATUS_OPTIONS = ['placed', 'preparing', 'ready_or_out', 'completed', 'cancelled']

const DELIVERY_STEPS = [
  { key: 'placed', label: 'New', icon: Check },
  { key: 'preparing', label: 'Preparing', icon: Package },
  { key: 'ready_or_out', label: 'Out for Delivery', icon: Truck },
  { key: 'completed', label: 'Delivered', icon: CheckCircle2 },
]
const PICKUP_STEPS = [
  { key: 'placed', label: 'New', icon: Check },
  { key: 'preparing', label: 'Preparing', icon: Package },
  { key: 'ready_or_out', label: 'Ready for Pickup', icon: Store },
  { key: 'completed', label: 'Picked Up', icon: CheckCircle2 },
]

type Order = ReturnType<typeof useAdminData>['orders'][number]

export function OrdersPanel({ data }: { data: ReturnType<typeof useAdminData> }) {
  const { orders, ordersStatus, loadMoreOrders } = data
  const setStatus = useMutation(api.orders.setStatus)
  const markPaid = useMutation(api.orders.markPaid)

  const [tab, setTab] = useState<'all' | 'delivery' | 'pickup'>('all')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [selected, setSelected] = useState<Order | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      if (tab !== 'all' && o.fulfillment !== tab) return false
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (paymentFilter !== 'all' && o.paymentStatus !== paymentFilter) return false
      if (q && !(o.customerName.toLowerCase().includes(q) || o.customerPhone.includes(q) || o._id.includes(q))) return false
      return true
    })
  }, [orders, tab, statusFilter, paymentFilter, search])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'delivery', 'pickup'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              tab === k ? 'bg-teal-500/20 text-teal-300' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {k === 'all' ? `All (${orders.length})` : k === 'delivery' ? 'Home Delivery' : 'Store Pickup'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, order ID…"
            className="border-white/10 bg-white/5 pl-8 text-white placeholder:text-white/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-white/10 bg-white/5 px-2 text-xs text-white"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="rounded-md border border-white/10 bg-white/5 px-2 text-xs text-white"
        >
          <option value="all">All payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="cash_on_fulfillment">Cash on fulfillment</option>
        </select>
      </div>

      <AdminCard>
        {ordersStatus === 'LoadingFirstPage' ? (
          <p className="py-8 text-center text-sm text-white/40">Loading…</p>
        ) : filtered.length === 0 ? (
          <EmptyState title="No orders found" hint="Try a different filter or search term." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase text-white/35">
                  <th className="pb-2 pr-3 font-medium">Order ID</th>
                  <th className="pb-2 pr-3 font-medium">Customer</th>
                  <th className="pb-2 pr-3 font-medium">Items</th>
                  <th className="pb-2 pr-3 font-medium">Amount</th>
                  <th className="pb-2 pr-3 font-medium">Fulfillment</th>
                  <th className="pb-2 pr-3 font-medium">Payment</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 pr-3 font-medium">Date</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((o) => (
                  <tr key={o._id}>
                    <td className="py-2.5 pr-3 font-mono text-xs text-white/70">#{o._id.slice(-6).toUpperCase()}</td>
                    <td className="py-2.5 pr-3 text-white/80">{o.customerName}</td>
                    <td className="py-2.5 pr-3 text-white/50">{o.items.length}</td>
                    <td className="py-2.5 pr-3 text-white/80">{formatINR(o.total)}</td>
                    <td className="py-2.5 pr-3"><FulfillmentBadge fulfillment={o.fulfillment} /></td>
                    <td className="py-2.5 pr-3 text-xs text-white/50">{o.paymentStatus === 'paid' ? 'Paid' : o.paymentStatus === 'cash_on_fulfillment' ? 'On fulfillment' : 'Pending'}</td>
                    <td className="py-2.5 pr-3"><StatusBadge status={o.status} /></td>
                    <td className="py-2.5 pr-3 text-xs text-white/40">{formatDateTime(o._creationTime)}</td>
                    <td className="py-2.5">
                      <button onClick={() => setSelected(o)} className="text-xs font-medium text-teal-300 hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {ordersStatus === 'CanLoadMore' && (
          <div className="mt-3 flex justify-center">
            <button onClick={() => loadMoreOrders(500)} className="rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10">
              Load more
            </button>
          </div>
        )}
      </AdminCard>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="dark max-w-lg border-white/10 bg-[#0d1826] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Order #{selected?._id.slice(-6).toUpperCase()}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5 text-sm">
              <div>
                <h4 className="mb-1.5 text-xs font-semibold text-white/40">CUSTOMER INFORMATION</h4>
                <p className="text-white/80">{selected.customerName} · {selected.customerPhone}</p>
                {selected.customerEmail && <p className="text-white/50">{selected.customerEmail}</p>}
                {selected.fulfillment === 'delivery' && selected.deliveryAddress && (
                  <p className="mt-1 text-white/50">{selected.deliveryAddress}</p>
                )}
              </div>

              <div>
                <h4 className="mb-1.5 text-xs font-semibold text-white/40">PRODUCTS</h4>
                <ul className="space-y-1.5">
                  {selected.items.map((it, idx) => (
                    <li key={idx} className="flex justify-between text-white/70">
                      <span>{it.quantity} × {it.name}</span>
                      <span>{formatINR(it.price * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between border-t border-white/10 pt-2 font-semibold text-white">
                  <span>Total</span>
                  <span>{formatINR(selected.total)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div>
                  <h4 className="mb-1 text-xs font-semibold text-white/40">PAYMENT</h4>
                  <p className="text-white/70">{selected.paymentMethod.toUpperCase()} · {selected.paymentStatus}</p>
                  {selected.paymentStatus !== 'paid' && selected.paymentMethod !== 'cod' && selected.paymentMethod !== 'cash' && (
                    <button
                      onClick={() => markPaid({ id: selected._id })}
                      className="mt-1 text-xs text-teal-300 hover:underline"
                    >
                      Mark as paid
                    </button>
                  )}
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-semibold text-white/40">FULFILLMENT</h4>
                  <FulfillmentBadge fulfillment={selected.fulfillment} />
                </div>
              </div>

              {selected.status !== 'cancelled' && (
                <div>
                  <h4 className="mb-3 text-xs font-semibold text-white/40">ORDER TIMELINE</h4>
                  <OrderTimeline order={selected} />
                </div>
              )}

              <div>
                <h4 className="mb-1.5 text-xs font-semibold text-white/40">UPDATE STATUS</h4>
                <select
                  value={selected.status}
                  onChange={(e) => {
                    setStatus({ id: selected._id, status: e.target.value as any })
                    toast.success('Order status updated')
                    setSelected({ ...selected, status: e.target.value as any })
                  }}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OrderTimeline({ order }: { order: Order }) {
  const steps = order.fulfillment === 'delivery' ? DELIVERY_STEPS : PICKUP_STEPS
  const currentIndex = steps.findIndex((s) => s.key === order.status)
  return (
    <div className="flex items-center">
      {steps.map((step, idx) => {
        const Icon = step.icon
        const done = idx <= currentIndex
        return (
          <div key={step.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {idx > 0 && <div className={`h-0.5 flex-1 ${idx <= currentIndex ? 'bg-teal-400' : 'bg-white/10'}`} />}
              <div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${done ? 'bg-teal-500 text-white' : 'bg-white/10 text-white/30'}`}>
                <Icon className="size-3.5" />
              </div>
              {idx < steps.length - 1 && <div className={`h-0.5 flex-1 ${idx < currentIndex ? 'bg-teal-400' : 'bg-white/10'}`} />}
            </div>
            <span className="mt-1.5 max-w-[64px] text-center text-[10px] leading-tight text-white/40">{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}
