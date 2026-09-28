import { useMemo, useState } from 'react'
import { Boxes, CheckCircle2, AlertTriangle, XCircle, Search } from 'lucide-react'

import { AdminCard, KpiCard, EmptyState } from './admin-ui'
import type { useAdminData } from '@/hooks/use-admin-data'
import { Input } from '@/components/ui/input'

function formatINR(n: number) {
  return `₹${n.toFixed(2)}`
}
function formatDate(ms?: number) {
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString('en-IN', { dateStyle: 'medium' })
}

function stockStatus(stock: number): { label: string; className: string } {
  if (stock <= 0) return { label: 'Out of Stock', className: 'bg-red-500/15 text-red-300' }
  if (stock <= 10) return { label: 'Low Stock', className: 'bg-amber-500/15 text-amber-300' }
  return { label: 'In Stock', className: 'bg-emerald-500/15 text-emerald-300' }
}

export function InventoryPanel({ data }: { data: ReturnType<typeof useAdminData> }) {
  const { medicines } = data
  const [search, setSearch] = useState('')

  const activeMeds = medicines.filter((m) => m.active)
  const inStock = activeMeds.filter((m) => m.stock > 10).length
  const lowStock = activeMeds.filter((m) => m.stock > 0 && m.stock <= 10).length
  const outOfStock = activeMeds.filter((m) => m.stock <= 0).length

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return activeMeds.filter((m) => !q || m.name.toLowerCase().includes(q))
  }, [activeMeds, search])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard icon={Boxes} label="Total Products" value={activeMeds.length} tone="teal" />
        <KpiCard icon={CheckCircle2} label="In Stock" value={inStock} tone="teal" />
        <KpiCard icon={AlertTriangle} label="Low Stock" value={lowStock} tone="amber" />
        <KpiCard icon={XCircle} label="Out of Stock" value={outOfStock} tone="red" />
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product…" className="border-white/10 bg-white/5 pl-8 text-white placeholder:text-white/30" />
      </div>

      <AdminCard>
        {filtered.length === 0 ? (
          <EmptyState title="No products found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase text-white/35">
                  <th className="pb-2 pr-3 font-medium">Product</th>
                  <th className="pb-2 pr-3 font-medium">Category</th>
                  <th className="pb-2 pr-3 font-medium">Stock</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 pr-3 font-medium">Price</th>
                  <th className="pb-2 font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((m) => {
                  const s = stockStatus(m.stock)
                  return (
                    <tr key={m._id}>
                      <td className="py-2.5 pr-3 text-white/80">{m.name}</td>
                      <td className="py-2.5 pr-3 text-xs text-white/50">{m.category}</td>
                      <td className="py-2.5 pr-3 text-white/80">{m.stock}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.className}`}>{s.label}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-white/70">{formatINR(m.price)}</td>
                      <td className="py-2.5 text-xs text-white/40">{formatDate(m.updatedAt ?? m._creationTime)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  )
}
