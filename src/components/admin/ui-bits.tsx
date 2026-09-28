import { Component, Fragment, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Inbox, type LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  FULFILLMENT_EMOJI,
  FULFILLMENT_LABEL,
  paymentLabel,
  statusLabel,
  type Fulfillment,
} from './format'

// Small shared building blocks for the admin dashboard.
// Motion is kept calm: short fade/slide-in only. The shell wraps everything in
// <MotionConfig reducedMotion="user"> so "prefers-reduced-motion" is respected.

export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-xl border border-border bg-card shadow-xs', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          {title && <h3 className="text-sm font-semibold">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

type Tone = 'default' | 'warn' | 'danger'

const TONE: Record<Tone, string> = {
  default: 'bg-secondary text-secondary-foreground',
  warn: 'bg-highlight/15 text-highlight',
  danger: 'bg-destructive/10 text-destructive',
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
  onClick,
  delay = 0,
}: {
  label: string
  value: ReactNode
  hint?: string
  icon: LucideIcon
  tone?: Tone
  onClick?: () => void
  delay?: number
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', TONE[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
    </>
  )
  const base =
    'block w-full rounded-xl border border-border bg-card p-4 text-left shadow-xs transition duration-200 motion-reduce:transition-none'
  return (
    <FadeIn delay={delay}>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className={cn(
            base,
            'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:translate-y-0 motion-reduce:hover:translate-y-0',
          )}
        >
          {inner}
        </button>
      ) : (
        <div className={base}>{inner}</div>
      )}
    </FadeIn>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <Skeleton className="bg-muted h-3 w-20" />
        <Skeleton className="bg-muted size-8 rounded-lg" />
      </div>
      <Skeleton className="bg-muted mt-3 h-7 w-16" />
      <Skeleton className="bg-muted mt-2 h-3 w-24" />
    </div>
  )
}

export function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="bg-muted h-4 w-40" />
            <Skeleton className="bg-muted h-3 w-24" />
          </div>
          <Skeleton className="bg-muted h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
}: {
  icon?: LucideIcon
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-4 py-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-sm font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

export function ErrorState({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-8 text-center">
      <AlertTriangle className="size-6 text-destructive" />
      <p className="mt-2 text-sm font-medium">Unable to load {label} right now.</p>
      <Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

// Catches a failing query in one section so the rest of the page keeps working,
// and offers a Retry instead of failing silently.
export class SectionBoundary extends Component<
  { label: string; children: ReactNode; fallback?: ReactNode },
  { failed: boolean; attempt: number; error: unknown }
> {
  state = { failed: false, attempt: 0, error: null as unknown }

  static getDerivedStateFromError(error: unknown) {
    return { failed: true, error }
  }

  render() {
    if (this.state.failed) {
      if (this.props.fallback !== undefined) return this.props.fallback
      return (
        <ErrorState
          label={this.props.label}
          onRetry={() => {
            // Data-source errors carry a retry() that reloads the failed query.
            const retry = (this.state.error as { retry?: () => void } | null)?.retry
            if (typeof retry === 'function') retry()
            this.setState((s) => ({ failed: false, attempt: s.attempt + 1, error: null }))
          }}
        />
      )
    }
    return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>
  }
}

const STATUS_STYLE: Record<string, string> = {
  placed: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  preparing: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
  ready_or_out: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  cancelled: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-300',
}

export function StatusBadge({ status, fulfillment }: { status: string; fulfillment: Fulfillment }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_STYLE[status] ?? 'bg-secondary text-secondary-foreground',
      )}
    >
      {statusLabel(status, fulfillment)}
    </span>
  )
}

export function FulfillmentBadge({ fulfillment }: { fulfillment: Fulfillment }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-xs font-medium">
      <span aria-hidden>{FULFILLMENT_EMOJI[fulfillment]}</span>
      {FULFILLMENT_LABEL[fulfillment]}
    </span>
  )
}

export function PaymentBadge({
  paymentStatus,
  fulfillment,
}: {
  paymentStatus: string
  fulfillment: Fulfillment
}) {
  const paid = paymentStatus === 'paid'
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
        paid
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
          : 'bg-secondary text-secondary-foreground',
      )}
    >
      {paymentLabel(paymentStatus, fulfillment)}
    </span>
  )
}
