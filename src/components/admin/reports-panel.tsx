import { useMemo, useState } from 'react'
import { IndianRupee, ClipboardList, Wallet, Users } from 'lucide-react'
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts'

import { AdminCard, KpiCard, EmptyState } from './admin-ui'
import type { useAdminData } from '@/hooks/use-admin-data'

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

const RANGES = [
  { key: '1', label: 'Today' },
  { key: '7', label: 'Last 7 Days' },
  { key: '30', label: 'Last 30 Days' },
] as const

export function ReportsPanel({ data }: { data: ReturnType<typeof useAdminData> }) {
  const { orders, stats } = data
  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('7')

  const filtered = useMemo(() => {
    const days = Number(range)
    const cutoff = Date.now() - days * 86400000
    return orders.filter((o) => o._creationTime >= cutoff)
  }, [orders, range])

  const validOrders = filtered.filter((o) => o.status !== 'cancelled')
  const revenue = validOrders.reduce((s, o) => s + o.total, 0)
  const aov = validOrders.length > 0 ? revenue / validOrders.length : 0
  const distinctCustomers = new Set(filtered.map((o) => o.customerPhone)).size

  const dailyData = useMemo(() => {
    const days = Number(range)
    const arr: { label: string; orders: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date().setHours(0, 0, 0, 0) - i * 86400000
      const dayEnd = dayStart + 86400000
      const count = orders.filter((o) => o._creationTime >= dayStart && o._creationTime < dayEnd).length
      arr.push({ label: new Date(dayStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), orders: count })
    }
    return arr
  }, [orders, range])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button key={r.key} onClick={() => setRange(r.key)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${range === r.key ? 'bg-teal-500/20 text-teal-300' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard icon={IndianRupee} label="Revenue" value={formatINR(revenue)} tone="teal" />
        <KpiCard icon={ClipboardList} label="Orders" value={validOrders.length} tone="blue" />
        <KpiCard icon={Wallet} label="Avg. Order Value" value={formatINR(aov)} tone="amber" />
        <KpiCard icon={Users} label="Customers" value={distinctCustomers} tone="blue" />
      </div>

      <AdminCard>
        <h3 className="mb-3 text-sm font-semibold text-white/80">Orders Trend</h3>
        {dailyData.every((d) => d.orders === 0) ? (
          <EmptyState title="No order data for this period" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData}>
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#0f1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="orders" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </AdminCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminCard>
          <h3 className="mb-3 text-sm font-semibold text-white/80">Top Products</h3>
          {stats.topProducts.length === 0 ? (
            <EmptyState title="No sales data yet" />
          ) : (
            <ul className="space-y-2">
              {stats.topProducts.map((p) => (
                <li key={p.name} className="flex justify-between text-sm text-white/70">
                  <span className="truncate">{p.name}</span>
                  <span className="text-white/40">{p.qty} sold</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
        <AdminCard>
          <h3 className="mb-3 text-sm font-semibold text-white/80">Home Delivery vs Store Pickup</h3>
          <div className="flex items-center justify-around py-4 text-center">
            <div>
              <p className="text-2xl font-bold text-sky-300">{stats.deliveryCount}</p>
              <p className="text-xs text-white/40">Home Delivery</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-violet-300">{stats.pickupCount}</p>
              <p className="text-xs text-white/40">Store Pickup</p>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
