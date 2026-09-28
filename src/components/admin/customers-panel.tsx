import { useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { Search } from 'lucide-react'

import { api } from '../../../convex/_generated/api'
import { AdminCard, EmptyState } from './admin-ui'
import type { useAdminData } from '@/hooks/use-admin-data'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function formatINR(n: number) {
  return `₹${n.toFixed(2)}`
}
function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export function CustomersPanel({ data }: { data: ReturnType<typeof useAdminData> }) {
  const { customers, orders } = data
  const [mode, setMode] = useState<'orders' | 'activity'>('orders')
  const [search, setSearch] = useState('')
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = customers ?? []
    if (!q) return list
    return list.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
  }, [customers, search])

  const selected = filtered.find((c) => c.phone === selectedPhone)
  const selectedOrders = selectedPhone ? orders.filter((o) => o.customerPhone === selectedPhone) : []

  const liveActivity = useQuery(api.activity.listLiveActivity)
  const visitors = useQuery(api.activity.listVisitors)
  const history = useQuery(api.activity.getCustomerHistory, selectedEmail ? { email: selectedEmail } : 'skip')

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setMode('orders')} className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${mode === 'orders' ? 'bg-teal-500/20 text-teal-300' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>Customers (from Orders)</button>
        <button onClick={() => setMode('activity')} className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${mode === 'activity' ? 'bg-teal-500/20 text-teal-300' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>Signed-in Activity</button>
      </div>

      {mode === 'orders' ? (
        <>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or phone…" className="border-white/10 bg-white/5 pl-8 text-white placeholder:text-white/30" />
          </div>

          <AdminCard>
            {customers === undefined ? (
              <p className="py-8 text-center text-sm text-white/40">Loading…</p>
            ) : filtered.length === 0 ? (
              <EmptyState title="No customers yet" hint="Customers appear here once orders are placed." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase text-white/35">
                      <th className="pb-2 pr-3 font-medium">Customer</th>
                      <th className="pb-2 pr-3 font-medium">Orders</th>
                      <th className="pb-2 pr-3 font-medium">Total Spend</th>
                      <th className="pb-2 pr-3 font-medium">Last Order</th>
                      <th className="pb-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((c) => (
                      <tr key={c.phone}>
                        <td className="py-2.5 pr-3">
                          <p className="text-white/80">{c.name}</p>
                          <p className="text-xs text-white/40">{c.phone}</p>
                        </td>
                        <td className="py-2.5 pr-3 text-white/70">{c.orderCount}</td>
                        <td className="py-2.5 pr-3 text-white/80">{formatINR(c.totalSpend)}</td>
                        <td className="py-2.5 pr-3 text-xs text-white/40">{formatDateTime(c.lastOrderAt)}</td>
                        <td className="py-2.5">
                          <button onClick={() => setSelectedPhone(c.phone)} className="text-xs font-medium text-teal-300 hover:underline">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>
        </>
      ) : (
        <>
          <AdminCard>
            <h3 className="mb-3 text-sm font-semibold text-white/80">Live Product Browsing</h3>
            {liveActivity === undefined ? (
              <p className="py-6 text-center text-sm text-white/40">Loading…</p>
            ) : liveActivity.length === 0 ? (
              <EmptyState title="No browsing activity yet" />
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase text-white/35">
                      <th className="pb-2 pr-3 font-medium">Gmail ID</th>
                      <th className="pb-2 pr-3 font-medium">Product</th>
                      <th className="pb-2 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {liveActivity.map((v) => (
                      <tr key={v._id}>
                        <td className="py-2 pr-3 text-white/70">{v.email}</td>
                        <td className="py-2 pr-3 text-white/70">{v.medicineName}</td>
                        <td className="py-2 text-xs text-white/40">{formatDateTime(v.time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>

          <AdminCard>
            <h3 className="mb-3 text-sm font-semibold text-white/80">Signed-in Visitors</h3>
            {visitors === undefined ? (
              <p className="py-6 text-center text-sm text-white/40">Loading…</p>
            ) : visitors.length === 0 ? (
              <EmptyState title="No logins yet" />
            ) : (
              <div className="space-y-2">
                {visitors.map((v) => (
                  <button key={v.email} onClick={() => setSelectedEmail(v.email)} className="flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2.5 text-left hover:bg-white/10">
                    <div>
                      <p className="text-sm text-white/80">{v.email}</p>
                      <p className="text-xs text-white/40">Last login: {formatDateTime(v.lastLogin)} · {v.loginCount} login{v.loginCount > 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-xs text-teal-300">View history</span>
                  </button>
                ))}
              </div>
            )}
          </AdminCard>
        </>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelectedPhone(null)}>
        <DialogContent className="dark max-w-md border-white/10 bg-[#0d1826] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <p className="text-white/50">{selected.phone}{selected.email ? ` · ${selected.email}` : ''}</p>
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-white/5 p-3 text-center">
                <div><p className="text-lg font-bold text-white">{selected.orderCount}</p><p className="text-[10px] text-white/40">Orders</p></div>
                <div><p className="text-lg font-bold text-white">{formatINR(selected.totalSpend)}</p><p className="text-[10px] text-white/40">Spent</p></div>
                <div><p className="text-lg font-bold text-white">{selected.cancelledCount}</p><p className="text-[10px] text-white/40">Cancelled</p></div>
              </div>
              <div>
                <h4 className="mb-1.5 text-xs font-semibold text-white/40">ORDER HISTORY</h4>
                <ul className="max-h-60 space-y-1.5 overflow-y-auto">
                  {selectedOrders.map((o) => (
                    <li key={o._id} className="flex justify-between text-white/70">
                      <span>#{o._id.slice(-6).toUpperCase()} · {o.status}</span>
                      <span>{formatINR(o.total)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedEmail} onOpenChange={(o) => !o && setSelectedEmail(null)}>
        <DialogContent className="dark max-w-md border-white/10 bg-[#0d1826] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedEmail}</DialogTitle>
          </DialogHeader>
          {history === undefined ? (
            <p className="py-4 text-center text-sm text-white/40">Loading…</p>
          ) : (
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="mb-1.5 text-xs font-semibold text-white/40">LOGIN HISTORY</h4>
                <ul className="max-h-24 space-y-1 overflow-y-auto text-white/60">
                  {history.logins.slice(0, 8).map((l, i) => <li key={i}>{formatDateTime(l.time)}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="mb-1.5 text-xs font-semibold text-white/40">PRODUCTS VIEWED</h4>
                <ul className="max-h-32 space-y-1 overflow-y-auto text-white/60">
                  {history.views.slice(0, 10).map((v, i) => (
                    <li key={i} className="flex justify-between"><span>{v.medicineName}</span><span className="text-white/30">{formatDateTime(v.time)}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-1.5 text-xs font-semibold text-white/40">ORDERS</h4>
                <ul className="max-h-32 space-y-1 overflow-y-auto text-white/60">
                  {history.orders.length === 0 ? <li className="text-white/30">No orders yet.</li> : history.orders.map((o) => (
                    <li key={o._id} className="flex justify-between"><span>#{o._id.slice(-6).toUpperCase()} · {o.status}</span><span>{formatINR(o.total)}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
