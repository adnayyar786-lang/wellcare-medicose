import { useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { toast } from 'sonner'

import { api } from '../../../convex/_generated/api'
import { AdminCard } from './admin-ui'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function SettingsPanel() {
  const settings = useQuery(api.settings.get)
  const update = useMutation(api.settings.update)
  const [form, setForm] = useState({ storeName: '', address: '', phone: '', hours: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  async function handleSave() {
    setSaving(true)
    try {
      await update(form)
      toast.success('Settings saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <AdminCard>
        <h3 className="mb-1 text-sm font-semibold text-white/80">Store Information</h3>
        <p className="mb-4 text-xs text-white/40">
          For reference within the Admin only — the live customer website currently reads its
          store details from a separate config file, so changes here don't update the customer
          site yet.
        </p>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-white/50">Store Name</label>
            <Input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} className="border-white/10 bg-white/5 text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/50">Address</label>
            <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="border-white/10 bg-white/5 text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/50">Phone</label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border-white/10 bg-white/5 text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/50">Hours</label>
            <Input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="border-white/10 bg-white/5 text-white" />
          </div>
          <button disabled={saving} onClick={handleSave} className="rounded-md bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-400">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </AdminCard>
    </div>
  )
}
