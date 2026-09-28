import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'
import { Tag, Megaphone, Star } from 'lucide-react'

import { api } from '../../../convex/_generated/api'
import { AdminCard, EmptyState } from './admin-ui'
import type { useAdminData } from '@/hooks/use-admin-data'
import { Input } from '@/components/ui/input'

const DEFAULT_BANNERS = [
  { title: 'Flat ₹100 off on first order', sub: 'Use code FIRST100 · min order ₹499', code: 'FIRST100' },
  { title: 'Free delivery above ₹499', sub: 'On every home delivery order', code: null },
  { title: '25% off with FIRST25', sub: 'Up to ₹150 off on orders above ₹199', code: 'FIRST25' },
]

export function MarketingPanel({ data }: { data: ReturnType<typeof useAdminData> }) {
  const [tab, setTab] = useState<'coupons' | 'banners' | 'featured'>('coupons')
  const coupons = useQuery(api.coupons.list)
  const createCoupon = useMutation(api.coupons.create)
  const updateCoupon = useMutation(api.coupons.update)
  const removeCoupon = useMutation(api.coupons.remove)
  const [form, setForm] = useState({ code: '', type: 'flat' as 'flat' | 'percent', value: '', minOrder: '', maxOff: '' })
  const [saving, setSaving] = useState(false)
  const [banners, setBanners] = useState(() => {
    try {
      const raw = window.localStorage.getItem('wellcare-promo-banners')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length === DEFAULT_BANNERS.length && parsed.every((b) => typeof b.title === 'string' && typeof b.sub === 'string')) return parsed
      }
    } catch { /* Use the default campaign content. */ }
    return DEFAULT_BANNERS.map((banner) => ({ ...banner }))
  })
  const [bannerNotice, setBannerNotice] = useState('')

  async function handleCreate() {
    const value = Number(form.value)
    const minOrder = Number(form.minOrder || 0)
    const maxOff = form.maxOff.trim() ? Number(form.maxOff) : undefined
    if (!form.code.trim() || Number.isNaN(value) || value <= 0) { toast.error('Enter a coupon code and a positive value'); return }
    setSaving(true)
    try {
      await createCoupon({ code: form.code, type: form.type, value, minOrder, maxOff })
      toast.success('Coupon created')
      setForm({ code: '', type: 'flat', value: '', minOrder: '', maxOff: '' })
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not create coupon') }
    finally { setSaving(false) }
  }

  function saveBanners() {
    try {
      window.localStorage.setItem('wellcare-promo-banners', JSON.stringify(banners))
      setBannerNotice('Saved on this browser only. These edits are not synced to customers or other devices.')
      toast.success('Banner edits saved in this browser')
    } catch { toast.error('Could not save banner edits') }
  }

  const featuredProducts = data.medicines.filter((m) => m.featured)
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['coupons', 'banners', 'featured'] as const).map((k) => <button key={k} onClick={() => setTab(k)} className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${tab === k ? 'bg-teal-500/20 text-teal-300' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>{k === 'coupons' ? 'Coupons' : k === 'banners' ? 'Promotional Banners' : 'Featured Products'}</button>)}
      </div>
      {tab === 'coupons' && <div className="space-y-4"><AdminCard><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Input placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="rounded-md border border-white/10 bg-white/5 px-2 text-sm text-white"><option value="flat">Flat ₹ off</option><option value="percent">% off</option></select>
        <Input type="number" placeholder="Value" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" />
        <Input type="number" placeholder="Min order ₹" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" />
        <button disabled={saving} onClick={handleCreate} className="col-span-2 rounded-md bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400 sm:col-span-4">{saving ? 'Adding…' : 'Add Coupon'}</button>
      </div></AdminCard><AdminCard>{coupons === undefined ? <p className="py-6 text-center text-sm text-white/40">Loading…</p> : coupons.length === 0 ? <EmptyState title="No coupons yet" /> : <div className="space-y-2">{coupons.map((c) => <div key={c._id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5"><div className="flex items-center gap-2"><Tag className="size-3.5 text-teal-300" /><div><p className="text-sm text-white/80">{c.code} {!c.active && <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-white/40">Inactive</span>}</p><p className="text-xs text-white/40">{c.type === 'flat' ? `₹${c.value} off` : `${c.value}% off`} · Min ₹{c.minOrder}</p></div></div><div className="flex gap-2"><button onClick={() => updateCoupon({ id: c._id, active: !c.active })} className="text-xs text-white/50 hover:text-white">{c.active ? 'Disable' : 'Enable'}</button><button onClick={() => removeCoupon({ id: c._id })} className="text-xs text-red-300/80 hover:text-red-300">Delete</button></div></div>)}</div>}</AdminCard></div>}
      {tab === 'banners' && <AdminCard>
        <p className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-100/80">Edit banner headlines, supporting copy and coupon codes. Saving here stores the changes in this browser only; customer-wide banner management still needs a shared database setting.</p>
        <div className="space-y-4">{banners.map((banner, index) => <div key={index} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-300"><Megaphone className="size-4" />Banner {index + 1}</div>
          <Input aria-label={`Banner ${index + 1} headline`} value={banner.title} onChange={(e) => setBanners((old) => old.map((item, i) => i === index ? { ...item, title: e.target.value } : item))} placeholder="Headline" className="border-white/10 bg-white/5 text-white placeholder:text-white/30" />
          <Input aria-label={`Banner ${index + 1} supporting text`} value={banner.sub} onChange={(e) => setBanners((old) => old.map((item, i) => i === index ? { ...item, sub: e.target.value } : item))} placeholder="Supporting text" className="border-white/10 bg-white/5 text-white placeholder:text-white/30" />
          <Input aria-label={`Banner ${index + 1} coupon`} value={banner.code ?? ''} onChange={(e) => setBanners((old) => old.map((item, i) => i === index ? { ...item, code: e.target.value.trim() ? e.target.value.toUpperCase() : null } : item))} placeholder="Coupon code (optional)" className="border-white/10 bg-white/5 text-white placeholder:text-white/30" />
        </div>)}</div>
        <button onClick={saveBanners} className="mt-4 w-full rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-950/20 transition hover:-translate-y-0.5 hover:from-teal-400 hover:to-emerald-400">Save banner changes</button>
        {bannerNotice && <p role="status" className="mt-2 text-xs text-amber-200">{bannerNotice}</p>}
      </AdminCard>}
      {tab === 'featured' && <AdminCard><p className="mb-3 text-xs text-white/40">Toggle the star on any product in Medicines to feature it. Featured products are not yet displayed in a dedicated customer-site section.</p>{featuredProducts.length === 0 ? <EmptyState title="No featured products yet" hint="Star a product from the Medicines tab to feature it." /> : <div className="space-y-2">{featuredProducts.map((m) => <div key={m._id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5"><Star className="size-4 fill-amber-300 text-amber-300" /><span className="text-sm text-white/80">{m.name}</span></div>)}</div>}</AdminCard>}
    </div>
  )
}
