import { FileText, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

import { STORE_LOCATION } from '@/config/store-location'
import { Button } from '@/components/ui/button'
import { useCustomersOverview, useOverview } from './data'
import { formatDateTime, formatINR, orderCode, type NavTarget } from './format'
import { ThresholdForm } from './inventory-section'
import { ActivityPanel, CouponsPanel } from './legacy-panels'
import { SalesPanel } from './dashboard-section'
import {
  EmptyState,
  FulfillmentBadge,
  Panel,
  RowsSkeleton,
  SectionBoundary,
  SectionHeader,
  StatusBadge,
} from './ui-bits'

export function PrescriptionsSection({ onNavigate }: { onNavigate: (t: NavTarget) => void }) {
  return (
    <div>
      <SectionHeader
        title="Prescriptions"
        description="Administrative view only — no clinical approval happens here."
      />
      <SectionBoundary label="prescriptions">
        <PrescriptionsBody onNavigate={onNavigate} />
      </SectionBoundary>
    </div>
  )
}

function PrescriptionsBody({ onNavigate }: { onNavigate: (t: NavTarget) => void }) {
  const data = useOverview()
  if (data === undefined) {
    return (
      <Panel>
        <RowsSkeleton rows={4} />
      </Panel>
    )
  }
  const { rx } = data
  return (
    <div className="space-y-4">
      <Panel title="Prescription Requests">
        <EmptyState
          icon={FileText}
          title="No prescription requests available"
          description="Customers don't upload prescriptions at checkout yet, so there is nothing to review. Prescription upload and review is a future module."
        />
      </Panel>

      <Panel title={`Open orders with prescription medicines (${rx.openOrderCount})`}>
        <p className="mb-3 text-xs text-muted-foreground">
          {rx.medicineCount} medicine{rx.medicineCount === 1 ? ' is' : 's are'} marked &quot;Rx required&quot; in your
          catalog. Orders containing them are listed here so a prescription can be checked at handover.
        </p>
        {rx.orders.length === 0 ? (
          <EmptyState title="No open orders contain prescription medicines" />
        ) : (
          <ul className="divide-y divide-border">
            {rx.orders.map((o) => (
              <li key={o._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">
                    {o.customerName} <span className="font-mono text-xs text-muted-foreground">{orderCode(o._id)}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">Rx: {o.rxItems.join(', ')}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <FulfillmentBadge fulfillment={o.fulfillment} />
                    <StatusBadge status={o.status} fulfillment={o.fulfillment} />
                    <span className="text-xs text-muted-foreground">{formatDateTime(o._creationTime)}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => onNavigate({ section: 'orders', openOrderId: o._id })}>
                  View order
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

export function CustomersSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Customers" description="Who is signing up and ordering from your store." />
      <SectionBoundary label="customers">
        <CustomersOverview />
      </SectionBoundary>
      <div>
        <h3 className="mb-3 text-sm font-semibold">Customer activity</h3>
        <SectionBoundary label="customer activity">
          <ActivityPanel />
        </SectionBoundary>
      </div>
    </div>
  )
}

function CustomersOverview() {
  const overview = useOverview()
  const list = useCustomersOverview()
  if (overview === undefined || list === undefined) {
    return (
      <Panel>
        <RowsSkeleton rows={4} />
      </Panel>
    )
  }
  return (
    <Panel title="Overview">
      <div className="mb-4 flex gap-8">
        <div>
          <p className="text-xs text-muted-foreground">Signed-in customers</p>
          <p className="text-2xl font-semibold">{overview.customers.total}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Active in last 7 days</p>
          <p className="text-2xl font-semibold">{overview.customers.activeLast7Days}</p>
        </div>
      </div>
      {list.recent.length === 0 ? (
        <EmptyState icon={Users} title="No customers yet" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Recent customers</th>
                <th className="py-2 pr-3 font-medium">Last seen</th>
                <th className="py-2 pr-3 text-right font-medium">Orders</th>
                <th className="py-2 text-right font-medium">Order value</th>
              </tr>
            </thead>
            <tbody>
              {list.recent.map((c) => (
                <tr key={c._id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 font-medium">{c.email}</td>
                  <td className="whitespace-nowrap py-2 pr-3 text-xs text-muted-foreground">{formatDateTime(c.lastLogin)}</td>
                  <td className="py-2 pr-3 text-right">{c.orderCount}</td>
                  <td className="py-2 text-right">{formatINR(c.totalSpent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">Based on customers who signed in recently.</p>
    </Panel>
  )
}

const DEFAULT_BANNERS = [
  { title: '15% OFF on medicines', sub: 'Save more on selected medicines · Limited-time offer', code: 'MED15' },
  { title: '20% OFF on wellness', sub: 'Extra savings on health & wellness products', code: 'HEALTH20' },
  { title: '10% OFF on first order', sub: 'New to Wellcare? Use your welcome offer', code: 'WELCOME10' },
]

function BannerEditor() {
  const [banners, setBanners] = useState(DEFAULT_BANNERS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('wellcare-promo-banners')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (
        Array.isArray(parsed) &&
        parsed.length === DEFAULT_BANNERS.length &&
        parsed.every((b) => typeof b?.title === 'string' && typeof b?.sub === 'string' && typeof b?.code === 'string')
      ) setBanners(parsed)
    } catch {
      // Keep defaults when saved data is invalid.
    }
  }, [])

  function update(index: number, key: 'title' | 'sub' | 'code', value: string) {
    setBanners((current) => current.map((banner, i) => (i === index ? { ...banner, [key]: value } : banner)))
    setSaved(false)
  }

  function save() {
    try {
      window.localStorage.setItem('wellcare-promo-banners', JSON.stringify(banners))
      setSaved(true)
    } catch {
      setSaved(false)
    }
  }

  function reset() {
    setBanners(DEFAULT_BANNERS)
    try { window.localStorage.removeItem('wellcare-promo-banners') } catch { /* ignore */ }
    setSaved(true)
  }

  return (
    <Panel title="Home page offer banners">
      <p className="mb-4 text-xs text-muted-foreground">
        Edit the three promotional cards shown on the customer Home page. Changes are saved on this browser after you press Save.
      </p>
      <div id="banners" className="grid gap-4 lg:grid-cols-3">
        {banners.map((banner, index) => (
          <div key={index} className="rounded-xl border border-border bg-background p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Offer {index + 1}</p>
            <div className="space-y-3">
              <label className="block text-xs font-medium">
                Offer title
                <input value={banner.title} onChange={(e) => update(index, 'title', e.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <label className="block text-xs font-medium">
                Subtitle
                <input value={banner.sub} onChange={(e) => update(index, 'sub', e.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <label className="block text-xs font-medium">
                Coupon code
                <input value={banner.code} onChange={(e) => update(index, 'code', e.target.value.toUpperCase())} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm uppercase outline-none focus:ring-2 focus:ring-ring" />
              </label>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={save}>Save banners</Button>
        <Button variant="outline" onClick={reset}>Reset defaults</Button>
        {saved && <span className="text-xs text-emerald-600">Saved on this browser.</span>}
      </div>
    </Panel>
  )
}

export function MarketingSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Marketing" description="Manage coupons and the promotional cards shown on the customer home page." />
      <SectionBoundary label="banners"><BannerEditor /></SectionBoundary>
      <SectionBoundary label="coupons"><CouponsPanel /></SectionBoundary>
    </div>
  )
}

export function ReportsSection() {
  return (
    <div>
      <SectionHeader
        title="Reports"
        description="Sales are order value excluding cancelled orders. Days are counted in Indian Standard Time."
      />
      <SectionBoundary label="reports">
        <SalesPanel defaultDays={30} />
      </SectionBoundary>
    </div>
  )
}

export function SettingsSection({
  adminEmail,
  onSignOut,
}: {
  adminEmail: string | null
  onSignOut: () => void
}) {
  return (
    <div>
      <SectionHeader title="Settings" />
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Inventory">
          <SectionBoundary label="settings">
            <ThresholdForm />
          </SectionBoundary>
        </Panel>
        <Panel title="Admin account">
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="font-medium">{adminEmail ?? 'Admin'}</p>
          <p className="mt-3 text-xs text-muted-foreground">Store location: {STORE_LOCATION.label}</p>
          <Button className="mt-4" variant="outline" size="sm" onClick={onSignOut}>
            Sign out
          </Button>
        </Panel>
      </div>
    </div>
  )
}
