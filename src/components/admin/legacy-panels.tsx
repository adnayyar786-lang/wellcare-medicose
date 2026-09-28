import { useAction, useConvexAuth, useMutation, usePaginatedQuery, useQuery } from 'convex/react'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Bell, Upload } from 'lucide-react'

import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { GoogleAuthButton } from '@/components/google-auth-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Existing admin panels (medicines catalog, coupons, customer activity),
// moved here unchanged so the new dashboard shell can host them.

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

function formatINR(n: number) {
  return `₹${n.toFixed(2)}`
}

function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

const STATUS_LABEL: Record<string, string> = {
  placed: 'Placed',
  preparing: 'Preparing',
  ready_or_out: 'Ready / Out for delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function PhotoUpload({ medicineId, currentUrl }: { medicineId: Id<'medicines'>; currentUrl?: string }) {
  const { isAuthenticated } = useConvexAuth()
  const createUpload = useAction(api.appFiles.createUpload)
  const finalize = useAction(api.appFiles.finalizeMedicineImage)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  if (!isAuthenticated) {
    return (
      <div className="w-40">
        <p className="mb-1 text-[10px] text-muted-foreground">Sign in to upload photos</p>
        <GoogleAuthButton />
      </div>
    )
  }

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const grant = await createUpload({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        fileSize: file.size,
        visibility: 'public',
      })
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
      {currentUrl && <img src={currentUrl} alt="" className="size-9 rounded-md object-cover" />}
      <Button size="sm" variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
        <Upload className="size-3.5" /> {uploading ? 'Uploading…' : currentUrl ? 'Replace' : 'Add photo'}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

export function MedicinesPanel() {
  const { results: medicines, status, loadMore } = usePaginatedQuery(
    api.medicines.listAll,
    {},
    { initialNumItems: 300 },
  )
  const create = useMutation(api.medicines.create)
  const update = useMutation(api.medicines.update)
  const remove = useMutation(api.medicines.remove)

  const [form, setForm] = useState({
    name: '',
    manufacturer: '',
    category: '',
    shopCategory: SHOP_CATEGORIES[0],
    description: '',
    price: '',
    mrpPrice: '',
    stock: '',
    requiresPrescription: false,
  })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const filteredMedicines = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return medicines
    return medicines.filter(
      (m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q),
    )
  }, [medicines, search])

  async function handleAdd() {
    if (!form.name.trim()) {
      toast.error('Medicine name is required')
      return
    }
    const price = Number(form.price)
    const stock = Number(form.stock)
    const mrpPrice = form.mrpPrice.trim() ? Number(form.mrpPrice) : undefined
    if (Number.isNaN(price) || Number.isNaN(stock) || (mrpPrice !== undefined && Number.isNaN(mrpPrice))) {
      toast.error('Price, MRP, and stock must be numbers')
      return
    }
    setSaving(true)
    try {
      await create({
        name: form.name,
        manufacturer: form.manufacturer.trim() || undefined,
        category: form.category || 'General',
        shopCategory: form.shopCategory,
        description: form.description,
        price,
        mrpPrice,
        stock,
        requiresPrescription: form.requiresPrescription,
      })
      toast.success('Medicine added')
      setForm({ name: '', manufacturer: '', category: '', shopCategory: SHOP_CATEGORIES[0], description: '', price: '', mrpPrice: '', stock: '', requiresPrescription: false })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add medicine')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card id="add-medicine" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="text-base">Add a medicine</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Company / Manufacturer</Label>
            <Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} placeholder="e.g. Sun Pharma, Cipla, Mankind" />
            <p className="text-[11px] text-muted-foreground">A company folder is created automatically in Shop Department.</p>
          </div>
          <div className="space-y-1">
            <Label>Type (Tablet, Syrup, etc.)</Label>
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Tablet, Syrup, etc." />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Category</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.shopCategory}
              onChange={(e) => setForm({ ...form, shopCategory: e.target.value })}
            >
              {SHOP_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Our Price (₹)</Label>
            <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>MRP (₹, optional — shown struck through)</Label>
            <Input type="number" value={form.mrpPrice} onChange={(e) => setForm({ ...form, mrpPrice: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Stock</Label>
            <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox
              id="rx"
              checked={form.requiresPrescription}
              onCheckedChange={(v) => setForm({ ...form, requiresPrescription: v === true })}
            />
            <Label htmlFor="rx">Requires prescription</Label>
          </div>
          <div className="sm:col-span-2">
            <Button disabled={saving} onClick={handleAdd}>{saving ? 'Adding…' : 'Add medicine'}</Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            Catalog ({filteredMedicines.length}{filteredMedicines.length !== medicines.length ? ` of ${medicines.length}` : ''})
          </h2>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog…"
            className="max-w-xs"
          />
        </div>
        {status === 'LoadingFirstPage' ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-2">
            {filteredMedicines.map((med) => (
              <Card key={med._id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div>
                    <p className="font-medium">
                      {med.name}{' '}
                      {med.requiresPrescription && <Badge variant="outline" className="ml-1 text-[10px]">Rx</Badge>}
                      {!med.active && <Badge variant="destructive" className="ml-1 text-[10px]">Hidden</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {med.manufacturer ?? 'Company not set'} · {med.shopCategory ?? 'Medicines (Branded)'} · {med.category} · Stock: {med.stock}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PhotoUpload medicineId={med._id} currentUrl={med.imageUrl} />
                    <select
                      className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                      value={med.shopCategory ?? 'Medicines (Branded)'}
                      onChange={(e) => update({ id: med._id, shopCategory: e.target.value })}
                    >
                      {SHOP_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        className="w-20"
                        defaultValue={med.price}
                        onBlur={(e) => {
                          const val = Number(e.target.value)
                          if (!Number.isNaN(val) && val !== med.price) {
                            update({ id: med._id, price: val })
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">MRP</span>
                      <Input
                        type="number"
                        className="w-20"
                        defaultValue={med.mrpPrice ?? ''}
                        placeholder="—"
                        onBlur={(e) => {
                          const raw = e.target.value.trim()
                          const val = raw ? Number(raw) : undefined
                          if (val !== med.mrpPrice && (val === undefined || !Number.isNaN(val))) {
                            update({ id: med._id, mrpPrice: val })
                          }
                        }}
                      />
                    </div>
                    <Input
                      type="number"
                      className="w-20"
                      defaultValue={med.stock}
                      onBlur={(e) => {
                        const val = Number(e.target.value)
                        if (!Number.isNaN(val) && val !== med.stock) {
                          update({ id: med._id, stock: val })
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => update({ id: med._id, active: !med.active })}
                    >
                      {med.active ? 'Hide' : 'Unhide'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => remove({ id: med._id })}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {status === 'CanLoadMore' && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => loadMore(300)}>Load more</Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function CouponsPanel() {
  const coupons = useQuery(api.coupons.list)
  const create = useMutation(api.coupons.create)
  const update = useMutation(api.coupons.update)
  const remove = useMutation(api.coupons.remove)

  const [form, setForm] = useState({ code: '', type: 'flat' as 'flat' | 'percent', value: '', minOrder: '', maxOff: '' })
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    const value = Number(form.value)
    const minOrder = Number(form.minOrder || 0)
    const maxOff = form.maxOff.trim() ? Number(form.maxOff) : undefined
    if (!form.code.trim() || Number.isNaN(value) || value <= 0) {
      toast.error('Enter a coupon code and a positive value')
      return
    }
    setSaving(true)
    try {
      await create({ code: form.code, type: form.type, value, minOrder, maxOff })
      toast.success('Coupon created')
      setForm({ code: '', type: 'flat', value: '', minOrder: '', maxOff: '' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create coupon')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a coupon</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label>Code</Label>
            <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE50" />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'flat' | 'percent' })}
            >
              <option value="flat">Flat ₹ off</option>
              <option value="percent">% off</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Value</Label>
            <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.type === 'flat' ? '100' : '25'} />
          </div>
          <div className="space-y-1">
            <Label>Min order (₹)</Label>
            <Input type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} placeholder="0" />
          </div>
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <Label>Max off (₹, optional)</Label>
            <Input type="number" value={form.maxOff} onChange={(e) => setForm({ ...form, maxOff: e.target.value })} placeholder="—" />
          </div>
          <div className="col-span-2 flex items-end sm:col-span-3">
            <Button disabled={saving} onClick={handleCreate}>{saving ? 'Adding…' : 'Add coupon'}</Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Active coupons</h2>
        {coupons === undefined ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No coupons yet.</p>
        ) : (
          <div className="space-y-2">
            {coupons.map((c) => (
              <Card key={c._id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div>
                    <p className="font-medium">
                      {c.code} {!c.active && <Badge variant="destructive" className="ml-1 text-[10px]">Disabled</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.type === 'flat' ? `₹${c.value} off` : `${c.value}% off`}
                      {c.maxOff ? ` (max ₹${c.maxOff})` : ''} · Min order ₹{c.minOrder}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => update({ id: c._id, active: !c.active })}>
                      {c.active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => remove({ id: c._id })}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function ActivityPanel() {
  const visitors = useQuery(api.activity.listVisitors)
  const liveActivity = useQuery(api.activity.listLiveActivity)
  const notifications = useQuery(api.activity.listNotifications)
  const markAllRead = useMutation(api.activity.markAllNotificationsRead)
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Alerts</h2>
        <Popover onOpenChange={(open) => { if (!open) markAllRead({}) }}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm">
              <Bell className="size-4" /> {notifications?.filter((n) => !n.read).length ?? 0} unread
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Recent alerts</p>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {!notifications || notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No alerts yet.</p>
              ) : (
                notifications.map((n) => (
                  <div key={n._id} className="rounded-md border border-border p-2 text-xs">
                    <p>{n.message}</p>
                    <p className="mt-0.5 text-muted-foreground">{formatDateTime(n.time)}</p>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Live Product Browsing</h2>
        {liveActivity === undefined ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : liveActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Gmail ID</th>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {liveActivity.map((v) => (
                  <tr key={v._id} className="border-t border-border">
                    <td className="px-3 py-2">{v.email}</td>
                    <td className="px-3 py-2">{v.medicineName}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDateTime(v.time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Visitors</h2>
        {visitors === undefined ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : visitors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No logins yet.</p>
        ) : (
          <div className="space-y-2">
            {visitors.map((v) => (
              <button
                key={v.email}
                onClick={() => setSelectedEmail(v.email)}
                className="flex w-full items-center justify-between rounded-md border border-border p-3 text-left text-sm hover:border-primary/40"
              >
                <div>
                  <p className="font-medium">{v.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Last login: {formatDateTime(v.lastLogin)} · {v.loginCount} login{v.loginCount > 1 ? 's' : ''}
                  </p>
                </div>
                <span className="text-xs text-primary underline">View history</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedEmail && <CustomerHistoryDialog email={selectedEmail} onClose={() => setSelectedEmail(null)} />}
    </div>
  )
}

function CustomerHistoryDialog({ email, onClose }: { email: string; onClose: () => void }) {
  const history = useQuery(api.activity.getCustomerHistory, { email })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-background p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{email}</h3>
          <button onClick={onClose} className="text-sm text-muted-foreground">Close</button>
        </div>
        {history === undefined ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="mt-4 space-y-5">
            <div>
              <h4 className="mb-1.5 text-xs font-semibold text-muted-foreground">Login history</h4>
              <ul className="space-y-1 text-sm">
                {history.logins.slice(0, 10).map((l, i) => (
                  <li key={i} className="text-muted-foreground">{formatDateTime(l.time)}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-1.5 text-xs font-semibold text-muted-foreground">Products viewed</h4>
              <ul className="space-y-1 text-sm">
                {history.views.slice(0, 15).map((v, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{v.medicineName}</span>
                    <span className="text-muted-foreground">{formatDateTime(v.time)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-1.5 text-xs font-semibold text-muted-foreground">Orders</h4>
              <ul className="space-y-1 text-sm">
                {history.orders.length === 0 ? (
                  <li className="text-muted-foreground">No orders yet.</li>
                ) : (
                  history.orders.map((o) => (
                    <li key={o._id} className="flex justify-between">
                      <span>#{o._id.slice(-8).toUpperCase()} · {STATUS_LABEL[o.status] ?? o.status}</span>
                      <span>{formatINR(o.total)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
