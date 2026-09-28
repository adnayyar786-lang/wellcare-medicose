import { useMutation } from 'convex/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { PackageCheck, Search } from 'lucide-react'

import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useLowStockThreshold, useMedicines, useOverview } from './data'
import type { InventoryTab } from './format'
import { EmptyState, Panel, RowsSkeleton, SectionBoundary, SectionHeader } from './ui-bits'

type StockItem = {
  _id: Id<'medicines'>
  name: string
  category: string
  stock: number
  requiresPrescription: boolean
  active?: boolean
}

function StockBadge({ stock, threshold }: { stock: number; threshold: number }) {
  if (stock <= 0) {
    return (
      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        Out of stock
      </span>
    )
  }
  if (stock <= threshold) {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
        Low stock
      </span>
    )
  }
  return (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
      In stock
    </span>
  )
}

function StockRow({ item, threshold }: { item: StockItem; threshold: number }) {
  const update = useMutation(api.medicines.update)
  const [saving, setSaving] = useState(false)

  async function commit(raw: string) {
    const n = Number(raw)
    if (!Number.isInteger(n) || n < 0) {
      toast.error('Stock must be a whole number, 0 or more')
      return
    }
    if (n === item.stock) return
    setSaving(true)
    try {
      await update({ id: item._id, stock: n })
      toast.success(`${item.name}: stock set to ${n}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update stock')
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <StockBadge stock={item.stock} threshold={threshold} />
          <span className="truncate text-xs text-muted-foreground">{item.category}</span>
          {item.requiresPrescription && (
            <span className="rounded-full border border-border px-1.5 text-[10px] text-muted-foreground">Rx</span>
          )}
          {item.active === false && (
            <span className="rounded-full border border-border px-1.5 text-[10px] text-muted-foreground">
              Hidden
            </span>
          )}
        </div>
      </div>
      <Input
        key={item.stock}
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        defaultValue={item.stock}
        disabled={saving}
        aria-label={`Stock for ${item.name}`}
        className="w-24 shrink-0"
        onBlur={(e) => void commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />
    </li>
  )
}

export function ThresholdForm() {
  const threshold = useLowStockThreshold()
  const [value, setValue] = useState<string | null>(null)
  const shown = value ?? String(threshold.value)

  function submit() {
    const n = Number(shown)
    if (!Number.isInteger(n) || n < 0) {
      toast.error('Enter a whole number, 0 or more')
      return
    }
    threshold.set(n)
    setValue(null)
    toast.success('Low stock threshold saved')
  }

  return (
    <div>
      <label className="text-sm font-medium" htmlFor="low-stock-threshold">
        Low stock threshold
      </label>
      <p className="text-xs text-muted-foreground">
        A medicine is flagged as low when its stock is at or below this number. Saved on this device
        {threshold.isDefault ? ' — currently using the default (10).' : '.'}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <Input
          id="low-stock-threshold"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={shown}
          onChange={(e) => setValue(e.target.value)}
          className="w-28"
        />
        <Button size="sm" disabled={value === null} onClick={submit}>
          Save
        </Button>
      </div>
    </div>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors motion-reduce:transition-none',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function AllStock({ threshold }: { threshold: number }) {
  // Uses the medicines already loaded for the whole admin (no second query).
  const { medicines, loading } = useMedicines()
  const [search, setSearch] = useState('')
  const [visible, setVisible] = useState(100)
  const q = search.trim().toLowerCase()
  const matches = medicines.filter(
    (m) => !q || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q),
  )
  const items = matches.slice(0, visible)

  return (
    <>
      <div className="relative mb-3 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search medicines…"
          className="pl-9"
        />
      </div>
      {loading ? (
        <RowsSkeleton rows={6} />
      ) : items.length === 0 ? (
        <EmptyState icon={PackageCheck} title="No medicines found" description="Add medicines from the Medicines page." />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((m) => (
            <StockRow key={m._id} item={m} threshold={threshold} />
          ))}
        </ul>
      )}
      {matches.length > visible && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={() => setVisible((v) => v + 100)}>
            Show more ({matches.length - visible} more)
          </Button>
        </div>
      )}
    </>
  )
}

function AlertList({ kind }: { kind: 'low' | 'out' }) {
  const data = useOverview()
  if (data === undefined) return <RowsSkeleton rows={5} />
  const inv = data.inventory
  const items = kind === 'low' ? inv.low : inv.out
  const total = kind === 'low' ? inv.lowCount : inv.outCount
  if (items.length === 0) {
    return (
      <EmptyState
        icon={PackageCheck}
        title={kind === 'low' ? 'No low-stock medicines' : 'Nothing is out of stock'}
        description={kind === 'low' ? `Nothing is at or below ${inv.threshold} units.` : undefined}
      />
    )
  }
  return (
    <>
      {total > items.length && (
        <p className="mb-2 text-xs text-muted-foreground">
          Showing the first {items.length} of {total}.
        </p>
      )}
      <ul className="divide-y divide-border">
        {items.map((m) => (
          <StockRow key={m._id} item={m} threshold={inv.threshold} />
        ))}
      </ul>
    </>
  )
}

export function InventorySection({
  tab,
  onTabChange,
}: {
  tab: InventoryTab
  onTabChange: (t: InventoryTab) => void
}) {
  const { value: threshold } = useLowStockThreshold()

  return (
    <div>
      <SectionHeader
        title="Inventory"
        description="Stock you set here is what customers can order online — checkout stops when a medicine runs out."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Tab active={tab === 'stock'} onClick={() => onTabChange('stock')}>
          Stock
        </Tab>
        <Tab active={tab === 'low'} onClick={() => onTabChange('low')}>
          Low Stock
        </Tab>
        <Tab active={tab === 'out'} onClick={() => onTabChange('out')}>
          Out of Stock
        </Tab>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Panel>
          <SectionBoundary label="inventory">
            {tab === 'stock' ? <AllStock threshold={threshold} /> : <AlertList kind={tab} />}
          </SectionBoundary>
        </Panel>
        <Panel className="h-fit">
          <SectionBoundary label="settings">
            <ThresholdForm />
          </SectionBoundary>
        </Panel>
      </div>
    </div>
  )
}
