import { usePaginatedQuery, useQuery } from 'convex/react'
import {
  Component,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { api } from '../../../convex/_generated/api'
import type { Doc } from '../../../convex/_generated/dataModel'

// The dashboard only uses backend functions that already exist
// (orders.listV3, medicines.listAll, activity.listVisitors). Each one is loaded
// by its own small "loader" so that if ONE of them fails, only the sections that
// need it show an error with a Retry button — the rest of the admin keeps working.
// Every number is derived in the browser from that real data; if there is no
// data the numbers are 0 / empty.

const IST_OFFSET = 330 * 60 * 1000 // Asia/Kolkata, UTC+5:30
const DAY = 24 * 60 * 60 * 1000
const ORDER_CAP = 2000
const MEDICINE_CAP = 5000
const LIST_CAP = 100
const DEFAULT_LOW_STOCK = 10
const THRESHOLD_KEY = 'wellcare-admin-low-stock-threshold'

type Order = Doc<'orders'>
type Medicine = Doc<'medicines'>
type Visitor = { email: string; userId: string; lastLogin: number; loginCount: number }
type Source = 'orders' | 'medicines' | 'visitors'

export function startOfISTDay(ts: number) {
  return Math.floor((ts + IST_OFFSET) / DAY) * DAY - IST_OFFSET
}

function istDateKey(ts: number) {
  return new Date(ts + IST_OFFSET).toISOString().slice(0, 10)
}

function readThreshold(): number | null {
  try {
    const raw = window.localStorage.getItem(THRESHOLD_KEY)
    if (raw === null) return null
    const n = Number(raw)
    return Number.isInteger(n) && n >= 0 ? n : null
  } catch {
    return null
  }
}

type AdminData = {
  orders: Order[]
  medicines: Medicine[]
  visitors: Visitor[] | null
  ordersReady: boolean
  medicinesReady: boolean
  visitorsReady: boolean
  ordersCapped: boolean
  errors: Record<Source, Error | null>
  retry: (source: Source) => void
  threshold: number
  thresholdIsDefault: boolean
  setThreshold: (n: number) => void
}

const AdminDataContext = createContext<AdminData | null>(null)

// Renders nothing; if its child loader throws (a failed query) it reports the
// error to the provider instead of taking the whole page down.
class LoaderBoundary extends Component<
  { onError: (e: Error) => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    this.props.onError(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

type OrdersState = { data: Order[]; done: boolean; capped: boolean }
type MedsState = { data: Medicine[]; done: boolean }

function OrdersLoader({ onChange }: { onChange: (v: OrdersState) => void }) {
  const { results, status, loadMore } = usePaginatedQuery(api.orders.listV3, {}, { initialNumItems: 200 })
  useEffect(() => {
    if (status === 'CanLoadMore' && results.length < ORDER_CAP) loadMore(300)
  }, [status, results.length, loadMore])
  const done = status === 'Exhausted' || results.length >= ORDER_CAP
  const capped = status !== 'Exhausted' && results.length >= ORDER_CAP
  useEffect(() => {
    onChange({ data: results, done, capped })
  }, [results, done, capped, onChange])
  return null
}

function MedicinesLoader({ onChange }: { onChange: (v: MedsState) => void }) {
  const { results, status, loadMore } = usePaginatedQuery(api.medicines.listAll, {}, { initialNumItems: 300 })
  useEffect(() => {
    if (status === 'CanLoadMore' && results.length < MEDICINE_CAP) loadMore(500)
  }, [status, results.length, loadMore])
  const done = status === 'Exhausted' || results.length >= MEDICINE_CAP
  useEffect(() => {
    onChange({ data: results, done })
  }, [results, done, onChange])
  return null
}

function VisitorsLoader({ onChange }: { onChange: (v: Visitor[] | null) => void }) {
  const visitors = useQuery(api.activity.listVisitors)
  useEffect(() => {
    onChange(visitors ?? null)
  }, [visitors, onChange])
  return null
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<OrdersState>({ data: [], done: false, capped: false })
  const [meds, setMeds] = useState<MedsState>({ data: [], done: false })
  const [visitors, setVisitors] = useState<Visitor[] | null>(null)
  const [errors, setErrors] = useState<Record<Source, Error | null>>({
    orders: null,
    medicines: null,
    visitors: null,
  })
  const [attempts, setAttempts] = useState<Record<Source, number>>({ orders: 0, medicines: 0, visitors: 0 })
  const [stored, setStored] = useState<number | null>(null)

  useEffect(() => {
    setStored(readThreshold())
  }, [])

  const retry = useCallback((source: Source) => {
    setErrors((e) => ({ ...e, [source]: null }))
    setAttempts((a) => ({ ...a, [source]: a[source] + 1 }))
  }, [])

  const setThreshold = useCallback((n: number) => {
    try {
      window.localStorage.setItem(THRESHOLD_KEY, String(n))
    } catch {
      // storage blocked: the value still applies for this visit
    }
    setStored(n)
  }, [])

  const value = useMemo<AdminData>(
    () => ({
      orders: orders.data,
      medicines: meds.data,
      visitors,
      ordersReady: orders.done,
      medicinesReady: meds.done,
      visitorsReady: visitors !== null,
      ordersCapped: orders.capped,
      errors,
      retry,
      threshold: stored ?? DEFAULT_LOW_STOCK,
      thresholdIsDefault: stored === null,
      setThreshold,
    }),
    [orders, meds, visitors, errors, retry, stored, setThreshold],
  )

  return (
    <AdminDataContext.Provider value={value}>
      <LoaderBoundary
        key={`orders-${attempts.orders}`}
        onError={(e) => setErrors((p) => ({ ...p, orders: e }))}
      >
        <OrdersLoader onChange={setOrders} />
      </LoaderBoundary>
      <LoaderBoundary
        key={`medicines-${attempts.medicines}`}
        onError={(e) => setErrors((p) => ({ ...p, medicines: e }))}
      >
        <MedicinesLoader onChange={setMeds} />
      </LoaderBoundary>
      <LoaderBoundary
        key={`visitors-${attempts.visitors}`}
        onError={(e) => setErrors((p) => ({ ...p, visitors: e }))}
      >
        <VisitorsLoader onChange={setVisitors} />
      </LoaderBoundary>
      {children}
    </AdminDataContext.Provider>
  )
}

export function useAdminData(): AdminData {
  const ctx = useContext(AdminDataContext)
  if (!ctx) throw new Error('useAdminData must be used inside AdminDataProvider')
  return ctx
}

// If a source failed, throw an error that carries a `retry` so the nearest
// section boundary can show "Unable to load … [Retry]" and actually reload it.
function assertSources(d: AdminData, needed: Source[]) {
  for (const s of needed) {
    if (d.errors[s]) throw Object.assign(new Error(`Could not load ${s}`), { retry: () => d.retry(s) })
  }
}

export function useOrders() {
  const d = useAdminData()
  assertSources(d, ['orders'])
  return { orders: d.orders, loading: !d.ordersReady, capped: d.ordersCapped }
}

export function useMedicines() {
  const d = useAdminData()
  assertSources(d, ['medicines'])
  return { medicines: d.medicines, loading: !d.medicinesReady }
}

export function useLowStockThreshold() {
  const { threshold, thresholdIsDefault, setThreshold } = useAdminData()
  return { value: threshold, isDefault: thresholdIsDefault, set: setThreshold }
}

// ---------------------------------------------------------------------------
// Overview (dashboard numbers)
// ---------------------------------------------------------------------------

export function useOverview() {
  const d = useAdminData()
  assertSources(d, ['orders', 'medicines'])
  return useMemo(() => (d.ordersReady && d.medicinesReady ? computeOverview(d) : undefined), [d])
}

function computeOverview(d: AdminData) {
  const now = Date.now()
  const todayStart = startOfISTDay(now)

  const todayOrders = d.orders.filter((o) => o._creationTime >= todayStart)
  const todaySales = todayOrders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)

  const open = {
    delivery: { placed: 0, preparing: 0, ready_or_out: 0 },
    pickup: { placed: 0, preparing: 0, ready_or_out: 0 },
  }
  const openOrders: Order[] = []
  for (const o of d.orders) {
    if (o.status === 'placed' || o.status === 'preparing' || o.status === 'ready_or_out') {
      open[o.fulfillment][o.status] += 1
      openOrders.push(o)
    }
  }

  const meds = d.medicines.filter((m) => m.active)
  const slim = (m: Medicine) => ({
    _id: m._id,
    name: m.name,
    category: m.category,
    stock: m.stock,
    requiresPrescription: m.requiresPrescription,
  })
  const outAll = meds.filter((m) => m.stock <= 0).sort((a, b) => a.name.localeCompare(b.name))
  const lowAll = meds.filter((m) => m.stock > 0 && m.stock <= d.threshold).sort((a, b) => a.stock - b.stock)

  const rxIds = new Set(meds.filter((m) => m.requiresPrescription).map((m) => String(m._id)))
  const rxOrdersAll = openOrders
    .map((o) => ({
      _id: o._id as string,
      _creationTime: o._creationTime,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      fulfillment: o.fulfillment,
      status: o.status,
      rxItems: o.items.filter((it) => rxIds.has(String(it.medicineId))).map((it) => it.name),
    }))
    .filter((o) => o.rxItems.length > 0)

  const visitors = d.visitors ?? []

  return {
    todayOrders: todayOrders.length,
    todaySales,
    open,
    pendingOrders: open.delivery.placed + open.pickup.placed,
    inventory: {
      threshold: d.threshold,
      lowCount: lowAll.length,
      outCount: outAll.length,
      low: lowAll.slice(0, LIST_CAP).map(slim),
      out: outAll.slice(0, LIST_CAP).map(slim),
    },
    rx: {
      medicineCount: meds.filter((m) => m.requiresPrescription).length,
      openOrderCount: rxOrdersAll.length,
      orders: rxOrdersAll.slice(0, 25),
    },
    customers: {
      available: d.visitors !== null,
      total: visitors.length,
      activeLast7Days: visitors.filter((v) => v.lastLogin >= now - 7 * DAY).length,
    },
    recentOrders: d.orders.slice(0, 8).map((o) => ({
      _id: o._id as string,
      _creationTime: o._creationTime,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      fulfillment: o.fulfillment,
      paymentStatus: o.paymentStatus,
      status: o.status,
      total: o.total,
      itemCount: o.items.reduce((s, it) => s + it.quantity, 0),
      itemNames: o.items.slice(0, 2).map((it) => it.name),
      moreItems: Math.max(0, o.items.length - 2),
    })),
  }
}

// ---------------------------------------------------------------------------
// Sales report (Today / 7 days / 30 days)
// ---------------------------------------------------------------------------

export function useSalesReport(days: number) {
  const d = useAdminData()
  assertSources(d, ['orders'])
  return useMemo(() => (d.ordersReady ? computeSales(d.orders, days, d.ordersCapped) : undefined), [d, days])
}

function computeSales(allOrders: Order[], days: number, truncated: boolean) {
  const span = Math.min(Math.max(Math.floor(days), 1), 90)
  const since = startOfISTDay(Date.now()) - (span - 1) * DAY
  const orders = allOrders.filter((o) => o._creationTime >= since && o.status !== 'cancelled')

  const daily = new Map<string, { sales: number; orders: number }>()
  for (let i = 0; i < span; i++) daily.set(istDateKey(since + i * DAY), { sales: 0, orders: 0 })

  const byFulfillment = {
    delivery: { sales: 0, orders: 0 },
    pickup: { sales: 0, orders: 0 },
  }
  const products = new Map<string, { name: string; units: number; revenue: number }>()
  let total = 0

  for (const o of orders) {
    total += o.total
    byFulfillment[o.fulfillment].sales += o.total
    byFulfillment[o.fulfillment].orders += 1
    const day = daily.get(istDateKey(o._creationTime))
    if (day) {
      day.sales += o.total
      day.orders += 1
    }
    for (const it of o.items) {
      const key = String(it.medicineId)
      const p = products.get(key) ?? { name: it.name, units: 0, revenue: 0 }
      p.units += it.quantity
      p.revenue += it.price * it.quantity
      products.set(key, p)
    }
  }

  return {
    days: span,
    total,
    orderCount: orders.length,
    averageOrderValue: orders.length > 0 ? total / orders.length : 0,
    byFulfillment,
    daily: Array.from(daily.entries()).map(([date, v]) => ({ date, ...v })),
    topProducts: Array.from(products.values())
      .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
      .slice(0, 5),
    truncated,
  }
}

// ---------------------------------------------------------------------------
// Customers (people who signed in recently, with their order counts)
// ---------------------------------------------------------------------------

export function useCustomersOverview() {
  const d = useAdminData()
  assertSources(d, ['orders', 'visitors'])
  return useMemo(() => {
    if (!d.ordersReady || d.visitors === null) return undefined
    const byEmail = new Map<string, { count: number; spent: number }>()
    for (const o of d.orders) {
      if (!o.customerEmail) continue
      const key = o.customerEmail.toLowerCase()
      const cur = byEmail.get(key) ?? { count: 0, spent: 0 }
      cur.count += 1
      if (o.status !== 'cancelled') cur.spent += o.total
      byEmail.set(key, cur)
    }
    const recent = d.visitors.slice(0, 8).map((v) => {
      const stats = byEmail.get(v.email.toLowerCase())
      return {
        _id: v.userId,
        email: v.email,
        lastLogin: v.lastLogin,
        orderCount: stats?.count ?? 0,
        totalSpent: stats?.spent ?? 0,
      }
    })
    return { recent }
  }, [d])
}
