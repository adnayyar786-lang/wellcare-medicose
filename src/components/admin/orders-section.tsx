import { useMutation, useQuery } from 'convex/react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ClipboardList, Search } from 'lucide-react'

import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import { STORE_LOCATION } from '@/config/store-location'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { startOfISTDay, useOrders } from './data'
import {
  ALL_STATUSES,
  DEFAULT_ORDERS_FILTER,
  FULFILLMENT_LABEL,
  PAYMENT_METHOD_LABEL,
  formatDateTime,
  formatINR,
  groupToStatuses,
  nextStep,
  orderCode,
  statusLabel,
  type Fulfillment,
  type OrderGroup,
  type OrderRange,
  type OrderStatus,
  type OrdersFilter,
} from './format'
import {
  EmptyState,
  FulfillmentBadge,
  PaymentBadge,
  RowsSkeleton,
  SectionBoundary,
  SectionHeader,
  StatusBadge,
} from './ui-bits'

export type OrderRow = {
  _id: string
  _creationTime: number
  customerName: string
  customerPhone?: string
  fulfillment: Fulfillment
  paymentStatus: string
  status: string
  total: number
  itemCount: number
  itemNames: string[]
  moreItems: number
}

export function toRow(o: Doc<'orders'>): OrderRow {
  return {
    _id: o._id,
    _creationTime: o._creationTime,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    fulfillment: o.fulfillment,
    paymentStatus: o.paymentStatus,
    status: o.status,
    total: o.total,
    itemCount: o.items.reduce((s, it) => s + it.quantity, 0),
    itemNames: o.items.slice(0, 2).map((it) => it.name),
    moreItems: Math.max(0, o.items.length - 2),
  }
}

function itemsText(r: OrderRow) {
  if (r.itemNames.length === 0) return '—'
  return r.itemNames.join(', ') + (r.moreItems > 0 ? ` +${r.moreItems} more` : '')
}

// Shared by the dashboard ("Recent Orders") and the Orders page.
export function OrdersTable({
  rows,
  onView,
  onAdvance,
  busyId,
}: {
  rows: OrderRow[]
  onView: (id: string) => void
  onAdvance?: (row: OrderRow, status: OrderStatus) => void
  busyId?: string | null
}) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Order ID</th>
              <th className="py-2 pr-3 font-medium">Customer</th>
              <th className="py-2 pr-3 font-medium">Items</th>
              <th className="py-2 pr-3 text-right font-medium">Amount</th>
              <th className="py-2 pr-3 font-medium">Fulfillment</th>
              <th className="py-2 pr-3 font-medium">Payment</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 pr-3 font-medium">Date</th>
              <th className="py-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const next = onAdvance ? nextStep(r.status, r.fulfillment) : null
              return (
                <tr key={r._id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                  <td className="py-2.5 pr-3 font-mono text-xs">{orderCode(r._id)}</td>
                  <td className="py-2.5 pr-3">
                    <p className="font-medium">{r.customerName}</p>
                    {r.customerPhone && <p className="text-xs text-muted-foreground">{r.customerPhone}</p>}
                  </td>
                  <td className="max-w-[200px] truncate py-2.5 pr-3 text-muted-foreground" title={itemsText(r)}>
                    {itemsText(r)}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-medium">{formatINR(r.total)}</td>
                  <td className="py-2.5 pr-3">
                    <FulfillmentBadge fulfillment={r.fulfillment} />
                  </td>
                  <td className="py-2.5 pr-3">
                    <PaymentBadge paymentStatus={r.paymentStatus} fulfillment={r.fulfillment} />
                  </td>
                  <td className="py-2.5 pr-3">
                    <StatusBadge status={r.status} fulfillment={r.fulfillment} />
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-3 text-xs text-muted-foreground">
                    {formatDateTime(r._creationTime)}
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex justify-end gap-2">
                      {next && onAdvance && (
                        <Button
                          size="sm"
                          disabled={busyId === r._id}
                          onClick={() => onAdvance(r, next.status)}
                        >
                          {next.label}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => onView(r._id)}>
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 md:hidden">
        {rows.map((r) => {
          const next = onAdvance ? nextStep(r.status, r.fulfillment) : null
          return (
            <div key={r._id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.customerName}</p>
                  <p className="font-mono text-xs text-muted-foreground">{orderCode(r._id)}</p>
                </div>
                <p className="shrink-0 font-semibold">{formatINR(r.total)}</p>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{itemsText(r)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <FulfillmentBadge fulfillment={r.fulfillment} />
                <StatusBadge status={r.status} fulfillment={r.fulfillment} />
                <PaymentBadge paymentStatus={r.paymentStatus} fulfillment={r.fulfillment} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{formatDateTime(r._creationTime)}</span>
                <div className="flex gap-2">
                  {next && onAdvance && (
                    <Button size="sm" disabled={busyId === r._id} onClick={() => onAdvance(r, next.status)}>
                      {next.label}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => onView(r._id)}>
                    View
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

const FULFILLMENT_OPTIONS: Array<{ value: OrdersFilter['fulfillment']; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'delivery', label: 'Home Delivery' },
  { value: 'pickup', label: 'Store Pickup' },
]

const RANGE_OPTIONS: Array<{ value: OrderRange; label: string }> = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]

const GROUP_OPTIONS: Array<{ value: OrderGroup; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors motion-reduce:transition-none',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function OrdersSection({
  filter,
  onFilterChange,
  openOrderId,
  onOpenOrder,
  initialSearch = '',
}: {
  initialSearch?: string
  filter: OrdersFilter
  onFilterChange: (f: OrdersFilter) => void
  openOrderId: string | null
  onOpenOrder: (id: string | null) => void
}) {
  const { orders, loading, capped: ordersCapped } = useOrders()
  const setStatus = useMutation(api.orders.setStatus)
  const [search, setSearch] = useState(initialSearch)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [visible, setVisible] = useState(50)

  const filtered = useMemo(() => {
    const statuses = groupToStatuses(filter.group)
    const q = search.trim().toLowerCase().replace('#', '')
    const day = 24 * 60 * 60 * 1000
    const today = startOfISTDay(Date.now())
    const since =
      filter.range === 'today' ? today : filter.range === '7d' ? today - 6 * day : filter.range === '30d' ? today - 29 * day : 0
    return orders
      .filter(
        (o) =>
          o._creationTime >= since &&
          (filter.fulfillment === 'all' || o.fulfillment === filter.fulfillment) &&
          (!statuses || statuses.includes(o.status)) &&
          (!q ||
            o.customerName.toLowerCase().includes(q) ||
            o.customerPhone.includes(q) ||
            o._id.slice(-8).toLowerCase().includes(q)),
      )
      .map(toRow)
  }, [orders, filter.fulfillment, filter.group, filter.range, search])
  const rows = filtered.slice(0, visible)

  async function advance(row: OrderRow, next: OrderStatus) {
    setBusyId(row._id)
    try {
      await setStatus({ id: row._id as Id<'orders'>, status: next })
      toast.success(`Order ${orderCode(row._id)} updated`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update order')
    } finally {
      setBusyId(null)
    }
  }

  const hiddenGroup = filter.group === 'preparing' || filter.group === 'ready_or_out'
  const isFiltered =
    filter.fulfillment !== 'all' || filter.group !== 'all' || (filter.range ?? 'all') !== 'all' || search.trim() !== ''

  return (
    <div>
      <SectionHeader title="Orders" description="Home Delivery and Store Pickup orders, newest first." />

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Fulfillment</span>
          {FULFILLMENT_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              active={filter.fulfillment === o.value}
              onClick={() => onFilterChange({ ...filter, fulfillment: o.value })}
            >
              {o.label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          {GROUP_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              active={filter.group === o.value}
              onClick={() => onFilterChange({ ...filter, group: o.value })}
            >
              {o.label}
            </Chip>
          ))}
          {hiddenGroup && (
            <Chip active onClick={() => onFilterChange({ ...filter, group: 'all' })}>
              {filter.group === 'preparing'
                ? 'Preparing'
                : filter.fulfillment === 'delivery'
                  ? 'Out for Delivery'
                  : filter.fulfillment === 'pickup'
                    ? 'Ready for Pickup'
                    : 'Ready / Out for Delivery'}{' '}
              ✕
            </Chip>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Date</span>
          {RANGE_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              active={(filter.range ?? 'all') === o.value}
              onClick={() => onFilterChange({ ...filter, range: o.value })}
            >
              {o.label}
            </Chip>
          ))}
        </div>
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone or order ID…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
        {loading ? (
          <RowsSkeleton rows={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={isFiltered ? 'No orders match this filter' : 'No orders yet'}
            description={isFiltered ? 'Try a different filter.' : 'New orders from the website will appear here.'}
          />
        ) : (
          <OrdersTable rows={rows} onView={onOpenOrder} onAdvance={advance} busyId={busyId} />
        )}
        {filtered.length > visible && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => setVisible((v) => v + 50)}>
              Show more ({filtered.length - visible} more)
            </Button>
          </div>
        )}
        {ordersCapped && (
          <p className="mt-3 text-center text-xs text-muted-foreground">Showing the most recent 2000 orders.</p>
        )}
      </div>

      <OrderDetailDialog orderId={openOrderId} onClose={() => onOpenOrder(null)} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Order detail
// ---------------------------------------------------------------------------

export function OrderDetailDialog({
  orderId,
  onClose,
}: {
  orderId: string | null
  onClose: () => void
}) {
  return (
    <Dialog open={orderId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order {orderId ? orderCode(orderId) : ''}</DialogTitle>
          <DialogDescription>Details, status and internal notes.</DialogDescription>
        </DialogHeader>
        {orderId && (
          <SectionBoundary label="this order">
            <OrderDetailBody id={orderId as Id<'orders'>} />
          </SectionBoundary>
        )}
      </DialogContent>
    </Dialog>
  )
}

function OrderDetailBody({ id }: { id: Id<'orders'> }) {
  const order = useQuery(api.orders.getById, { id })
  const setStatus = useMutation(api.orders.setStatus)
  const markPaid = useMutation(api.orders.markPaid)
  const [busy, setBusy] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  if (order === undefined) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-48 bg-muted" />
        <Skeleton className="h-24 w-full bg-muted" />
        <Skeleton className="h-32 w-full bg-muted" />
      </div>
    )
  }
  if (order === null) return <EmptyState title="Order not found" description="It may have been removed." />

  async function run(action: () => Promise<unknown>, okMessage: string) {
    setBusy(true)
    try {
      await action()
      toast.success(okMessage)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const o = order
  const next = nextStep(o.status, o.fulfillment)
  const canMarkPaid = o.paymentMethod !== 'cod' && o.paymentMethod !== 'cash' && o.paymentStatus !== 'paid'
  const isClosed = o.status === 'completed' || o.status === 'cancelled'


  return (
    <div className="space-y-5 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <FulfillmentBadge fulfillment={o.fulfillment} />
        <StatusBadge status={o.status} fulfillment={o.fulfillment} />
        <PaymentBadge paymentStatus={o.paymentStatus} fulfillment={o.fulfillment} />
        <span className="text-xs text-muted-foreground">Placed {formatDateTime(o._creationTime)}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-3">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">Customer</p>
          <p className="font-medium">{o.customerName}</p>
          <a href={`tel:${o.customerPhone}`} className="text-primary underline">
            {o.customerPhone}
          </a>
          {o.customerEmail && <p className="break-all text-xs text-muted-foreground">{o.customerEmail}</p>}
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">
            Fulfillment Type: {FULFILLMENT_LABEL[o.fulfillment]}
          </p>
          {o.fulfillment === 'delivery' ? (
            <>
              <p className="font-medium">Delivery address</p>
              <p className="whitespace-pre-wrap text-muted-foreground">{o.deliveryAddress || 'Not provided'}</p>
            </>
          ) : (
            <>
              <p className="font-medium">Pickup at store</p>
              <p className="text-muted-foreground">{STORE_LOCATION.label}</p>
            </>
          )}
          {o.deliveryTimePref && (
            <p className="mt-1 text-xs text-muted-foreground">Preferred time: {o.deliveryTimePref}</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Items</p>
        <ul className="space-y-1">
          {o.items.map((it, idx) => (
            <li key={idx} className="flex justify-between gap-3">
              <span>
                {it.quantity} × {it.name}
              </span>
              <span className="shrink-0">{formatINR(it.price * it.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 space-y-0.5 border-t border-border pt-2 text-xs text-muted-foreground">
          {o.subtotal !== undefined && (
            <p className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatINR(o.subtotal)}</span>
            </p>
          )}
          {(o.discount ?? 0) > 0 && (
            <p className="flex justify-between">
              <span>Discount{o.couponCode ? ` (${o.couponCode})` : ''}</span>
              <span>−{formatINR(o.discount!)}</span>
            </p>
          )}
          {(o.deliveryCharge ?? 0) > 0 && (
            <p className="flex justify-between">
              <span>Delivery charge</span>
              <span>{formatINR(o.deliveryCharge!)}</span>
            </p>
          )}
        </div>
        <p className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
          <span>Total</span>
          <span>{formatINR(o.total)}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Payment</p>
          <p>
            {PAYMENT_METHOD_LABEL[o.paymentMethod] ?? o.paymentMethod} ·{' '}
            <PaymentBadge paymentStatus={o.paymentStatus} fulfillment={o.fulfillment} />
          </p>
        </div>
        {canMarkPaid && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => run(() => markPaid({ id }), 'Marked as paid')}
          >
            Mark paid
          </Button>
        )}
      </div>

      {o.notes && (
        <div className="rounded-lg border border-border p-3">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">Customer note</p>
          <p className="whitespace-pre-wrap">{o.notes}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {next && (
          <Button
            disabled={busy}
            onClick={() =>
              run(() => setStatus({ id, status: next.status }), `Order marked ${statusLabel(next.status, o.fulfillment)}`)
            }
          >
            {next.label}
          </Button>
        )}
        <select
          aria-label="Change order status"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={o.status}
          disabled={busy}
          onChange={(e) => {
            const value = e.target.value as OrderStatus
            if (value === 'cancelled') setConfirmCancel(true)
            else if (value !== o.status) void run(() => setStatus({ id, status: value }), 'Status updated')
          }}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s, o.fulfillment)}
            </option>
          ))}
        </select>
        {!isClosed && (
          <Button variant="destructive" size="sm" disabled={busy} onClick={() => setConfirmCancel(true)}>
            Cancel order
          </Button>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Order timeline</p>
        <ol className="space-y-2 border-l border-border pl-4">
          <li className="relative">
            <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" />
            <p className="font-medium">Order placed</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(o._creationTime)}</p>
          </li>
          {o.paymentStatus === 'paid' && (
            <li className="relative">
              <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" />
              <p className="font-medium">Paid</p>
            </li>
          )}
          {o.status !== 'placed' && (
            <li className="relative">
              <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" />
              <p className="font-medium">Current status: {statusLabel(o.status, o.fulfillment)}</p>
              <p className="text-xs text-muted-foreground">Change times are not recorded yet</p>
            </li>
          )}
        </ol>
      </div>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              The customer will be notified by the existing cancellation email flow. Cancelling here does not add
              the ordered quantities back to medicine stock — update stock manually if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep order</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => run(() => setStatus({ id, status: 'cancelled' }), 'Order cancelled')}
            >
              Cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export { DEFAULT_ORDERS_FILTER }
