import { useState } from 'react'
import { FileText } from 'lucide-react'

import { AdminCard, EmptyState } from './admin-ui'

export function PrescriptionsPanel() {
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending')

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
              tab === k ? 'bg-teal-500/20 text-teal-300' : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <AdminCard>
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <FileText className="size-7 text-white/25" />
          <p className="text-sm text-white/60">No prescription requests yet</p>
          <p className="max-w-sm text-xs text-white/35">
            Prescription upload &amp; review isn't wired up yet — medicines that need a
            prescription are already flagged with an "Rx" tag for customers and staff, but there's
            no submission workflow connected here. This can be built as a dedicated feature when
            you're ready.
          </p>
        </div>
      </AdminCard>
    </div>
  )
}
