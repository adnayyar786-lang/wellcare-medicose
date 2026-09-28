import { ClipboardList, IndianRupee, Clock, PackageX, Users, FileWarning } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'

import type { AdminView } from './admin-shell'
import { AdminCard, KpiCard, StatusBadge, FulfillmentBadge, EmptyState } from './admin-ui'
import type { useAdminData } from '@/hooks/use-admin-data'

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function DashboardPanel({
  data,
  onNavigate,
}: {
  data: ReturnType<typeof useAdminData>
  onNavigate: (v: AdminView) => void
}) {
  const { stats, orders } = data
  const recentOrders = orders.slice(0, 6)
  const fulfillmentData = [
    { name: 'Home Delivery', value: stats.deliveryCount, color: '#38bdf8' },
    { name: 'Store Pickup', value: stats.pickupCount, color: '#a78bfa' },
  ]
  const hasFulfillmentData = stats.deliveryCount + stats.pickupCount > 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard icon={ClipboardList} label="Today's Orders" value={stats.todaysOrderCount} tone="teal" onClick={() => onNavigate('orders')} />
        <KpiCard icon={IndianRupee} label="Today's Sales" value={formatINR(stats.todaysSales)} tone="teal" />
        <KpiCard icon={Clock} label="Pending Orders" value={stats.pendingOrderCount} tone="amber" onClick={() => onNavigate('orders')} />
        <KpiCard icon={FileWarning} label="Prescription Requests" value={0} tone="blue" onClick={() => onNavigate('prescriptions')} />
        <KpiCard icon={PackageX} label="Low Stock Items" value={stats.lowStockCount} tone="red" onClick={() => onNavigate('inventory')} />
        <KpiCard icon={Users} label="Total Customers" value={stats.totalCustomers} tone="blue" onClick={() => onNavigate('customers')} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AdminCard className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-white/80">Sales Overview — Last 7 Days</h3>
          {stats.salesTrend.every((d) => d.value === 0) ? (
            <EmptyState title="No sales yet" hint="Sales will appear here once orders come in." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.salesTrend}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0f1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => formatINR(Number(v))}
                />
                <Area type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={2} fill="url(#salesFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </AdminCard>

        <AdminCard>
          <h3 className="mb-3 text-sm font-semibold text-white/80">Fulfillment Split</h3>
          {!hasFulfillmentData ? (
            <EmptyState title="No orders yet" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={fulfillmentData} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {fulfillmentData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-white/60"><span className="size-2 rounded-full bg-sky-400" /> Delivery {stats.deliveryCount}</span>
                <span className="flex items-center gap-1.5 text-white/60"><span className="size-2 rounded-full bg-violet-400" /> Pickup {stats.pickupCount}</span>
              </div>
            </>
          )}
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AdminCard className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/80">Recent Orders</h3>
            <button onClick={() => onNavigate('orders')} className="text-xs text-teal-300 hover:underline">View all</button>
          </div>
          {recentOrders.length === 0 ? (
            <EmptyState title="No orders yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase text-white/35">
                    <th className="pb-2 font-medium">Order</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Fulfillment</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentOrders.map((o) => (
                    <tr key={o._id}>
                      <td className="py-2 font-mono text-xs text-white/70">#{o._id.slice(-6).toUpperCase()}</td>
                      <td className="py-2 text-white/80">{o.customerName}</td>
                      <td className="py-2 text-white/80">{formatINR(o.total)}</td>
                      <td className="py-2"><FulfillmentBadge fulfillment={o.fulfillment} /></td>
                      <td className="py-2"><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        <AdminCard>
          <h3 className="mb-3 text-sm font-semibold text-white/80">Top Selling Products</h3>
          {stats.topProducts.length === 0 ? (
            <EmptyState title="No sales data yet" />
          ) : (
            <ul className="space-y-2.5">
              {stats.topProducts.map((p) => (
                <li key={p.name} className="flex items-center justify-between text-sm">
                  <span className="truncate text-white/70">{p.name}</span>
                  <span className="shrink-0 text-white/40">{p.qty} sold</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  )
}
