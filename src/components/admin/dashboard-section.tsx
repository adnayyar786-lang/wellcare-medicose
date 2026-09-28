import { lazy, Suspense, useState } from 'react'
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  IndianRupee,
  Plus,
  ShoppingBag,
  Store,
  Truck,
  Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useCustomersOverview, useOverview, useSalesReport } from './data'
import { formatINR, formatShortDate, type NavTarget } from './format'
import { OrdersTable, type OrderRow } from './orders-section'
import {
  EmptyState,
  FadeIn,
  Panel,
  RowsSkeleton,
  SectionBoundary,
  StatCard,
  StatCardSkeleton,
} from './ui-bits'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const SalesChart = lazy(() => import('./sales-chart'))

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

function Greeting() {
  const now = new Date()
  const h = now.getHours()
  const part = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'
  return (
    <FadeIn>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Good {part}, Admin</h1>
      <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your pharmacy today.</p>
    </FadeIn>
  )
}

function OpRow({ label, count, onClick }: { label: string; count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-secondary motion-reduce:transition-none"
    >
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('min-w-6 rounded-full px-2 text-center text-xs font-semibold', count > 0 ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}>
        {count}
      </span>
    </button>
  )
}

function OverviewBlocks({ onNavigate }: { onNavigate: (t: NavTarget) => void }) {
  const data = useOverview()

  if (data === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-xl bg-muted" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Panel key={i}>
              <RowsSkeleton rows={3} />
            </Panel>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel className="lg:col-span-2">
            <RowsSkeleton rows={5} />
          </Panel>
          <Panel>
            <RowsSkeleton rows={5} />
          </Panel>
        </div>
      </div>
    )
  }

  const { open, inventory: inv, rx, customers } = data
  const openDelivery = open.delivery.placed + open.delivery.preparing + open.delivery.ready_or_out
  const openPickup = open.pickup.placed + open.pickup.preparing + open.pickup.ready_or_out

  const goOrders = (fulfillment: 'all' | 'delivery' | 'pickup', group: 'all' | 'pending' | 'preparing' | 'ready_or_out') =>
    onNavigate({ section: 'orders', orders: { fulfillment, group } })

  // LEVEL 1 — what needs attention right now
  const attention: Array<{ text: string; go: () => void; tone: 'warn' | 'danger' | 'info' }> = []
  if (open.delivery.placed > 0) {
    attention.push({
      text: `${plural(open.delivery.placed, 'Home Delivery order')} awaiting confirmation`,
      go: () => goOrders('delivery', 'pending'),
      tone: 'warn',
    })
  }
  if (open.pickup.placed > 0) {
    attention.push({
      text: `${plural(open.pickup.placed, 'Store Pickup order')} awaiting confirmation`,
      go: () => goOrders('pickup', 'pending'),
      tone: 'warn',
    })
  }
  if (rx.openOrderCount > 0) {
    attention.push({
      text: `${plural(rx.openOrderCount, 'open order')} with prescription medicines`,
      go: () => onNavigate({ section: 'prescriptions' }),
      tone: 'warn',
    })
  }
  if (inv.outCount > 0) {
    attention.push({
      text: `${plural(inv.outCount, 'medicine')} out of stock`,
      go: () => onNavigate({ section: 'inventory', inventoryTab: 'out' }),
      tone: 'danger',
    })
  }
  if (inv.lowCount > 0) {
    attention.push({
      text: `${plural(inv.lowCount, 'medicine')} running low`,
      go: () => onNavigate({ section: 'inventory', inventoryTab: 'low' }),
      tone: 'warn',
    })
  }
  if (open.delivery.ready_or_out > 0) {
    attention.push({
      text: `${plural(open.delivery.ready_or_out, 'order')} out for delivery`,
      go: () => goOrders('delivery', 'ready_or_out'),
      tone: 'info',
    })
  }
  if (open.pickup.ready_or_out > 0) {
    attention.push({
      text: `${plural(open.pickup.ready_or_out, 'order')} ready for pickup`,
      go: () => goOrders('pickup', 'ready_or_out'),
      tone: 'info',
    })
  }

  const dot = { warn: 'bg-amber-500', danger: 'bg-destructive', info: 'bg-sky-500' }

  const recentRows: OrderRow[] = data.recentOrders.map((r) => ({ ...r }))

  return (
    <div className="space-y-6">
      <FadeIn>
        <Panel title="Needs attention now">
          {attention.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-600" />
              All clear — nothing needs attention right now.
            </p>
          ) : (
            <ul className="grid gap-1 sm:grid-cols-2">
              {attention.map((a) => (
                <li key={a.text}>
                  <button
                    type="button"
                    onClick={a.go}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-secondary motion-reduce:transition-none"
                  >
                    <span className={cn('size-2 shrink-0 rounded-full', dot[a.tone])} />
                    {a.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </FadeIn>

      <FadeIn delay={0.04}>
        <Panel title="Quick Actions">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Add Medicine', icon: Plus, go: () => onNavigate({ section: 'medicines', scrollTo: 'add-medicine' }) },
              { label: 'Manage Orders', icon: ClipboardList, go: () => goOrders('all', 'all') },
              { label: 'Review Prescriptions', icon: FileText, go: () => onNavigate({ section: 'prescriptions' }) },
              { label: 'Manage Inventory', icon: Boxes, go: () => onNavigate({ section: 'inventory', inventoryTab: 'stock' }) },
            ].map((a) => (
              <Button key={a.label} variant="outline" className="h-auto justify-start gap-2 py-3 text-left" onClick={a.go}>
                <a.icon className="size-4 shrink-0" />
                {a.label}
              </Button>
            ))}
          </div>
        </Panel>
      </FadeIn>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Today's Orders"
          value={data.todayOrders}
          hint="placed since midnight"
          icon={ShoppingBag}
          onClick={() => goOrders('all', 'all')}
          delay={0}
        />
        <StatCard
          label="Today's Sales"
          value={formatINR(data.todaySales)}
          hint="excludes cancelled orders"
          icon={IndianRupee}
          onClick={() => onNavigate({ section: 'reports' })}
          delay={0.03}
        />
        <StatCard
          label="Pending Orders"
          value={data.pendingOrders}
          hint="awaiting confirmation"
          icon={Clock}
          tone={data.pendingOrders > 0 ? 'warn' : 'default'}
          onClick={() => goOrders('all', 'pending')}
          delay={0.06}
        />
        <StatCard
          label="Home Delivery"
          value={openDelivery}
          hint="open orders"
          icon={Truck}
          onClick={() => goOrders('delivery', 'all')}
          delay={0.09}
        />
        <StatCard
          label="Store Pickup"
          value={openPickup}
          hint="open orders"
          icon={Store}
          onClick={() => goOrders('pickup', 'all')}
          delay={0.12}
        />
        <StatCard
          label="Rx Orders"
          value={rx.openOrderCount}
          hint="open orders with Rx medicines"
          icon={FileText}
          tone={rx.openOrderCount > 0 ? 'warn' : 'default'}
          onClick={() => onNavigate({ section: 'prescriptions' })}
          delay={0.15}
        />
        <StatCard
          label="Low Stock"
          value={inv.lowCount}
          hint={`${inv.outCount} out of stock`}
          icon={AlertTriangle}
          tone={inv.outCount > 0 ? 'danger' : inv.lowCount > 0 ? 'warn' : 'default'}
          onClick={() => onNavigate({ section: 'inventory', inventoryTab: inv.lowCount > 0 || inv.outCount === 0 ? 'low' : 'out' })}
          delay={0.18}
        />
        <StatCard
          label="Customers"
          value={customers.available ? customers.total : '—'}
          hint={customers.available ? `${customers.activeLast7Days} active this week` : 'currently unavailable'}
          icon={Users}
          onClick={() => onNavigate({ section: 'customers' })}
          delay={0.21}
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Today&apos;s Operations</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Panel title="🏠 Home Delivery">
            <OpRow label="Pending confirmation" count={open.delivery.placed} onClick={() => goOrders('delivery', 'pending')} />
            <OpRow label="Preparing" count={open.delivery.preparing} onClick={() => goOrders('delivery', 'preparing')} />
            <OpRow label="Out for Delivery" count={open.delivery.ready_or_out} onClick={() => goOrders('delivery', 'ready_or_out')} />
          </Panel>
          <Panel title="🏪 Store Pickup">
            <OpRow label="Pending confirmation" count={open.pickup.placed} onClick={() => goOrders('pickup', 'pending')} />
            <OpRow label="Preparing" count={open.pickup.preparing} onClick={() => goOrders('pickup', 'preparing')} />
            <OpRow label="Ready for Pickup" count={open.pickup.ready_or_out} onClick={() => goOrders('pickup', 'ready_or_out')} />
          </Panel>
          <Panel title="Prescriptions & Inventory">
            <OpRow label="Orders with Rx medicines" count={rx.openOrderCount} onClick={() => onNavigate({ section: 'prescriptions' })} />
            <OpRow label="Low Stock" count={inv.lowCount} onClick={() => onNavigate({ section: 'inventory', inventoryTab: 'low' })} />
            <OpRow label="Out of Stock" count={inv.outCount} onClick={() => onNavigate({ section: 'inventory', inventoryTab: 'out' })} />
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Recent Orders"
          className="lg:col-span-2"
          action={
            <Button size="sm" variant="outline" onClick={() => goOrders('all', 'all')}>
              View All Orders
            </Button>
          }
        >
          {recentRows.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No orders yet" description="New orders from the website will appear here." />
          ) : (
            <OrdersTable rows={recentRows} onView={(id) => onNavigate({ section: 'orders', openOrderId: id })} />
          )}
        </Panel>

        <Panel
          title="Inventory Alerts"
          action={
            <Button size="sm" variant="outline" onClick={() => onNavigate({ section: 'inventory', inventoryTab: 'low' })}>
              Manage
            </Button>
          }
        >
          {inv.outCount === 0 && inv.lowCount === 0 ? (
            <EmptyState title="No low-stock medicines" description={`Nothing is at or below ${inv.threshold} units.`} />
          ) : (
            <ul className="divide-y divide-border">
              {inv.out.slice(0, 5).map((m) => (
                <li key={m._id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="truncate">{m.name}</span>
                  <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Out</span>
                </li>
              ))}
              {inv.low.slice(0, 5).map((m) => (
                <li key={m._id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="truncate">{m.name}</span>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                    {m.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

const RANGES = [
  { days: 1, label: 'Today' },
  { days: 7, label: 'Last 7 Days' },
  { days: 30, label: 'Last 30 Days' },
]

export function SalesPanel({ defaultDays = 7 }: { defaultDays?: number }) {
  const [days, setDays] = useState(defaultDays)
  const data = useSalesReport(days)
  const total = data?.total ?? 0

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel
        title="Sales Summary"
        className="lg:col-span-2"
        action={
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => setDays(r.days)}
                aria-pressed={days === r.days}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors motion-reduce:transition-none',
                  days === r.days
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      >
        {data === undefined ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 bg-muted" />
              ))}
            </div>
            <Skeleton className="h-48 w-full bg-muted" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Total Sales</p>
                <p className="text-lg font-semibold sm:text-xl">{formatINR(data.total)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="text-lg font-semibold sm:text-xl">{data.orderCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg. Order Value</p>
                <p className="text-lg font-semibold sm:text-xl">{formatINR(Math.round(data.averageOrderValue))}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {(['delivery', 'pickup'] as const).map((f) => {
                const part = data.byFulfillment[f]
                const pct = total > 0 ? Math.round((part.sales / total) * 100) : 0
                return (
                  <div key={f}>
                    <div className="flex justify-between text-xs">
                      <span>{f === 'delivery' ? '🏠 Home Delivery Sales' : '🏪 Store Pickup Sales'}</span>
                      <span className="text-muted-foreground">
                        {formatINR(part.sales)} · {plural(part.orders, 'order')}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary transition-all duration-300 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-5">
              {days === 1 ? (
                <p className="text-xs text-muted-foreground">Choose Last 7 or Last 30 Days to see the sales trend.</p>
              ) : data.orderCount === 0 ? (
                <EmptyState title="No sales data available" description="The trend appears once orders come in." />
              ) : (
                <Suspense fallback={<Skeleton className="h-52 w-full bg-muted" />}>
                  <SalesChart data={data.daily} />
                </Suspense>
              )}
            </div>
            {data.truncated && (
              <p className="mt-2 text-xs text-muted-foreground">Very large date range — totals cover the most recent orders only.</p>
            )}
          </>
        )}
      </Panel>

      <Panel title="Top Products">
        {data === undefined ? (
          <RowsSkeleton rows={4} />
        ) : data.topProducts.length === 0 ? (
          <EmptyState title="Not enough sales data yet" description="No products sold in this period." />
        ) : (
          <ol className="divide-y divide-border">
            {data.topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-4 text-xs text-muted-foreground">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="shrink-0 text-right">
                  <span className="block text-xs font-medium">{plural(p.units, 'unit')}</span>
                  <span className="block text-xs text-muted-foreground">{formatINR(p.revenue)}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  )
}

export function CustomersCard({ onNavigate }: { onNavigate: (t: NavTarget) => void }) {
  const overview = useOverview()
  const list = useCustomersOverview()

  return (
    <Panel
      title="Customers"
      action={
        <Button size="sm" variant="outline" onClick={() => onNavigate({ section: 'customers' })}>
          View Customers
        </Button>
      }
    >
      {overview === undefined || list === undefined ? (
        <RowsSkeleton rows={3} />
      ) : (
        <>
          <div className="mb-3 flex gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Signed-in customers</p>
              <p className="text-lg font-semibold">{overview.customers.total}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active this week</p>
              <p className="text-lg font-semibold">{overview.customers.activeLast7Days}</p>
            </div>
          </div>
          {list.recent.length === 0 ? (
            <EmptyState title="No customers yet" />
          ) : (
            <ul className="divide-y divide-border">
              {list.recent.map((c) => (
                <li key={c._id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.email}</p>
                    <p className="text-xs text-muted-foreground">Last seen {formatShortDate(c.lastLogin)}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{plural(c.orderCount, 'order')}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Panel>
  )
}

export function DashboardSection({ onNavigate }: { onNavigate: (t: NavTarget) => void }) {
  return (
    <div className="space-y-6">
      <Greeting />
      <SectionBoundary label="the dashboard">
        <OverviewBlocks onNavigate={onNavigate} />
      </SectionBoundary>
      <SectionBoundary label="sales">
        <SalesPanel />
      </SectionBoundary>
      <SectionBoundary label="customers">
        <CustomersCard onNavigate={onNavigate} />
      </SectionBoundary>
    </div>
  )
}
