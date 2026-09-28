import { useMemo, useRef, useState } from 'react'
import { useAction, useConvexAuth, useMutation } from 'convex/react'
import { toast } from 'sonner'
import { Search, Upload, Star, Plus } from 'lucide-react'

import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { AdminCard, EmptyState } from './admin-ui'
import type { useAdminData } from '@/hooks/use-admin-data'
import { GoogleAuthButton } from '@/components/google-auth-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

function formatINR(n: number) {
  return `₹${n.toFixed(2)}`
}

const SHOP_CATEGORIES = [
  'Medicines (Branded)',
  'Generic Medicines',
  'Mankind Products',
  "Dr. Reddy's Products",
  'Apollo Products',
  'Cipla Products',
  'Sun Pharma Products',
  'Abbott Products',
  'Lupin Products',
  'Himalaya Products',
  'Torrent Products',
  'Pfizer Products',
  'Glenmark Products',
  'Zydus Products',
  'Pet Care',
  'Grocery / Health Supplements',
  'Baby Care',
  'Personal Care',
]

function PhotoUpload({ medicineId, currentUrl }: { medicineId: Id<'medicines'>; currentUrl?: string }) {
  const { isAuthenticated } = useConvexAuth()
  const createUpload = useAction(api.appFiles.createUpload)
  const finalize = useAction(api.appFiles.finalizeMedicineImage)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  if (!isAuthenticated) {
    return (
      <div className="w-36">
        <p className="mb-1 text-[10px] text-white/40">Sign in to upload photos</p>
        <GoogleAuthButton />
      </div>
    )
  }

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const grant = await createUpload({ filename: file.name, contentType: file.type || 'application/octet-stream', fileSize: file.size, visibility: 'public' })
      const res = await fetch(grant.uploadUrl, { method: grant.method, headers: grant.headers, body: file })
      if (!res.ok) throw new Error(`Upload failed (${res.status})`)
      await finalize({ fileId: grant.fileId, medicineId })
      toast.success('Photo updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {currentUrl && <img src={currentUrl} alt="" className="size-8 rounded-md object-cover" />}
      <button
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/70 hover:bg-white/10"
      >
        <Upload className="size-3" /> {uploading ? '…' : currentUrl ? 'Replace' : 'Photo'}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = '' }} />
    </div>
  )
}

export function MedicinesPanel({ data }: { data: ReturnType<typeof useAdminData> }) {
  const { medicines, medicinesStatus, loadMoreMedicines } = data
  const create = useMutation(api.medicines.create)
  const update = useMutation(api.medicines.update)
  const remove = useMutation(api.medicines.remove)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', manufacturer: '', category: '', shopCategory: SHOP_CATEGORIES[0], description: '', price: '', mrpPrice: '', stock: '', requiresPrescription: false })
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return medicines.filter((m) => {
      if (categoryFilter !== 'all' && (m.shopCategory ?? 'Medicines (Branded)') !== categoryFilter) return false
      if (q && !m.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [medicines, search, categoryFilter])

  async function handleAdd() {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    const price = Number(form.price)
    const stock = Number(form.stock)
    const mrpPrice = form.mrpPrice.trim() ? Number(form.mrpPrice) : undefined
    if (Number.isNaN(price) || Number.isNaN(stock)) { toast.error('Price and stock must be numbers'); return }
    setSaving(true)
    try {
      await create({ name: form.name, manufacturer: form.manufacturer.trim() || undefined, category: form.category || 'General', shopCategory: form.shopCategory, description: form.description, price, mrpPrice, stock, requiresPrescription: form.requiresPrescription })
      toast.success('Product added')
      setForm({ name: '', manufacturer: '', category: '', shopCategory: SHOP_CATEGORIES[0], description: '', price: '', mrpPrice: '', stock: '', requiresPrescription: false })
      setShowAdd(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products, categories…" className="border-white/10 bg-white/5 pl-8 text-white placeholder:text-white/30" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-md border border-white/10 bg-white/5 px-2 text-xs text-white">
          <option value="all">All Categories</option>
          {SHOP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setShowAdd((v) => !v)} className="flex items-center gap-1.5 rounded-md bg-teal-500 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-400">
          <Plus className="size-3.5" /> Add Product
        </button>
      </div>

      {showAdd && (
        <AdminCard>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" />
            <Input placeholder="Company / Manufacturer (e.g. Apollo, Cipla, Mankind)" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" />
            <Input placeholder="Type (Tablet, Syrup...)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" />
            <select value={form.shopCategory} onChange={(e) => setForm({ ...form, shopCategory: e.target.value })} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white sm:col-span-2">
              {SHOP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border-white/10 bg-white/5 text-white placeholder:text-white/30 sm:col-span-2" />
            <Input type="number" placeholder="Price (₹)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" />
            <Input type="number" placeholder="MRP (₹, optional)" value={form.mrpPrice} onChange={(e) => setForm({ ...form, mrpPrice: e.target.value })} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" />
            <Input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="border-white/10 bg-white/5 text-white placeholder:text-white/30" />
            <label className="flex items-center gap-2 text-xs text-white/60">
              <input type="checkbox" checked={form.requiresPrescription} onChange={(e) => setForm({ ...form, requiresPrescription: e.target.checked })} />
              Requires prescription
            </label>
            <button disabled={saving} onClick={handleAdd} className="rounded-md bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400 sm:col-span-2">
              {saving ? 'Adding…' : 'Add Product'}
            </button>
          </div>
        </AdminCard>
      )}

      <AdminCard>
        {medicinesStatus === 'LoadingFirstPage' ? (
          <p className="py-8 text-center text-sm text-white/40">Loading…</p>
        ) : filtered.length === 0 ? (
          <EmptyState title="No products found" hint="Try a different search or category filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase text-white/35">
                  <th className="pb-2 pr-3 font-medium">Image</th>
                  <th className="pb-2 pr-3 font-medium">Name</th>
                  <th className="pb-2 pr-3 font-medium">Category</th>
                  <th className="pb-2 pr-3 font-medium">Price</th>
                  <th className="pb-2 pr-3 font-medium">Stock</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((med) => (
                  <tr key={med._id}>
                    <td className="py-2.5 pr-3">
                      <PhotoUpload medicineId={med._id} currentUrl={med.imageUrl} />
                    </td>
                    <td className="py-2.5 pr-3 text-white/80">
                      {med.name}
                      {med.requiresPrescription && <span className="ml-1.5 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-300">Rx</span>}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-white/50">{med.shopCategory ?? 'Medicines (Branded)'}</td>
                    <td className="py-2.5 pr-3 text-white/80">
                      {formatINR(med.price)}
                      {med.mrpPrice ? <span className="ml-1 text-xs text-white/30 line-through">{formatINR(med.mrpPrice)}</span> : null}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Input type="number" defaultValue={med.stock} onBlur={(e) => { const v = Number(e.target.value); if (!Number.isNaN(v) && v !== med.stock) update({ id: med._id, stock: v }) }} className="h-7 w-20 border-white/10 bg-white/5 text-xs text-white" />
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${med.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-white/40'}`}>
                        {med.active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => update({ id: med._id, featured: !med.featured })} title="Toggle featured" className={`rounded p-1 ${med.featured ? 'text-amber-300' : 'text-white/30 hover:text-white/60'}`}>
                          <Star className="size-3.5" fill={med.featured ? 'currentColor' : 'none'} />
                        </button>
                        <button onClick={() => update({ id: med._id, active: !med.active })} className="text-xs text-white/50 hover:text-white">
                          {med.active ? 'Hide' : 'Unhide'}
                        </button>
                        <button onClick={() => remove({ id: med._id })} className="text-xs text-red-300/80 hover:text-red-300">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {medicinesStatus === 'CanLoadMore' && (
          <div className="mt-3 flex justify-center">
            <button onClick={() => loadMoreMedicines(500)} className="rounded-md bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10">Load more</button>
          </div>
        )}
      </AdminCard>
    </div>
  )
}
