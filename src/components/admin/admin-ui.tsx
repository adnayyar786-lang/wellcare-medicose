import { Inbox, AlertTriangle, Loader2 } from 'lucide-react'

export function AdminCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 ${className}`}>{children}</div>
  )
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  tone = 'teal',
  onClick,
}: {
  icon: typeof Inbox
  label: string
  value: string | number
  tone?: 'teal' | 'amber' | 'red' | 'blue'
  onClick?: () => void
}) {
  const toneClass = {
    teal: 'bg-teal-500/15 text-teal-300',
    amber: 'bg-amber-500/15 text-amber-300',
    red: 'bg-red-500/15 text-red-300',
    blue: 'bg-sky-500/15 text-sky-300',
  }[tone]

  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors ${onClick ? 'hover:bg-white/[0.06]' : ''}`}
    >
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="truncate text-xs text-white/50">{label}</p>
      </div>
    </Comp>
  )
}

const STATUS_STYLE: Record<string, string> = {
  placed: 'bg-sky-500/15 text-sky-300',
  preparing: 'bg-amber-500/15 text-amber-300',
  ready_or_out: 'bg-violet-500/15 text-violet-300',
  completed: 'bg-emerald-500/15 text-emerald-300',
  cancelled: 'bg-red-500/15 text-red-300',
  in_stock: 'bg-emerald-500/15 text-emerald-300',
  low_stock: 'bg-amber-500/15 text-amber-300',
  out_of_stock: 'bg-red-500/15 text-red-300',
  active: 'bg-emerald-500/15 text-emerald-300',
  inactive: 'bg-white/10 text-white/50',
}

const STATUS_LABEL: Record<string, string> = {
  placed: 'New',
  preparing: 'Preparing',
  ready_or_out: 'Ready / Out',
  completed: 'Completed',
  cancelled: 'Cancelled',
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  active: 'Active',
  inactive: 'Inactive',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLE[status] ?? 'bg-white/10 text-white/60'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

export function FulfillmentBadge({ fulfillment }: { fulfillment: 'pickup' | 'delivery' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
        fulfillment === 'delivery' ? 'bg-blue-500/15 text-blue-300' : 'bg-purple-500/15 text-purple-300'
      }`}
    >
      {fulfillment === 'delivery' ? 'Home Delivery' : 'Store Pickup'}
    </span>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 py-14 text-center">
      <Inbox className="size-7 text-white/25" />
      <p className="text-sm text-white/60">{title}</p>
      {hint && <p className="max-w-sm text-xs text-white/35">{hint}</p>}
    </div>
  )
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-white/40">
      <Loader2 className="size-4 animate-spin" />
      <span className="text-sm">Loading…</span>
    </div>
  )
}

export function AdminErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 py-12 text-center">
      <AlertTriangle className="size-6 text-red-300" />
      <p className="text-sm text-white/70">Something went wrong while loading this data.</p>
      <button onClick={onRetry} className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15">
        Try Again
      </button>
    </div>
  )
}
