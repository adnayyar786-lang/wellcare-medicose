// Shared labels and formatting for the admin dashboard.
// Order data model (unchanged): fulfillment = 'pickup' | 'delivery',
// status = placed | preparing | ready_or_out | completed | cancelled.

export type Fulfillment = 'pickup' | 'delivery'
export type OrderStatus = 'placed' | 'preparing' | 'ready_or_out' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'cash_on_fulfillment'

export const ALL_STATUSES: OrderStatus[] = ['placed', 'preparing', 'ready_or_out', 'completed', 'cancelled']

export const FULFILLMENT_LABEL: Record<Fulfillment, string> = {
  delivery: 'Home Delivery',
  pickup: 'Store Pickup',
}

export const FULFILLMENT_EMOJI: Record<Fulfillment, string> = {
  delivery: '🏠',
  pickup: '🏪',
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  upi: 'UPI',
  card: 'Card',
  cod: 'Cash on Delivery',
  wallet: 'Wallet',
  cash: 'Cash',
  online: 'Online',
}

export function formatINR(n: number) {
  const hasPaise = Math.abs(n % 1) > 0.0001
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}

export function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatShortDate(ms: number) {
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function formatChartDate(key: string) {
  // key is YYYY-MM-DD (IST day)
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

export function orderCode(id: string) {
  return `#${id.slice(-8).toUpperCase()}`
}

export function statusLabel(status: string, fulfillment: Fulfillment) {
  switch (status) {
    case 'placed':
      return 'New'
    case 'preparing':
      return 'Preparing'
    case 'ready_or_out':
      return fulfillment === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup'
    case 'completed':
      return fulfillment === 'delivery' ? 'Delivered' : 'Picked Up'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status
  }
}

export function paymentLabel(paymentStatus: string, fulfillment: Fulfillment) {
  if (paymentStatus === 'paid') return 'Paid'
  if (paymentStatus === 'cash_on_fulfillment') {
    return fulfillment === 'delivery' ? 'Pay on delivery' : 'Pay at store'
  }
  return 'Payment pending'
}

export function nextStep(
  status: string,
  fulfillment: Fulfillment,
): { status: OrderStatus; label: string } | null {
  if (status === 'placed') return { status: 'preparing', label: 'Confirm & prepare' }
  if (status === 'preparing') {
    return fulfillment === 'delivery'
      ? { status: 'ready_or_out', label: 'Out for delivery' }
      : { status: 'ready_or_out', label: 'Ready for pickup' }
  }
  if (status === 'ready_or_out') {
    return fulfillment === 'delivery'
      ? { status: 'completed', label: 'Mark delivered' }
      : { status: 'completed', label: 'Mark picked up' }
  }
  return null
}

// ---- Orders filters -------------------------------------------------------

export type OrderGroup =
  | 'all'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'preparing'
  | 'ready_or_out'

export type OrderRange = 'all' | 'today' | '7d' | '30d'

export type OrdersFilter = {
  fulfillment: Fulfillment | 'all'
  group: OrderGroup
  range?: OrderRange
}

export const DEFAULT_ORDERS_FILTER: OrdersFilter = { fulfillment: 'all', group: 'all', range: 'all' }

export function groupToStatuses(group: OrderGroup): OrderStatus[] | undefined {
  switch (group) {
    case 'pending':
      return ['placed']
    case 'processing':
      return ['preparing', 'ready_or_out']
    case 'preparing':
      return ['preparing']
    case 'ready_or_out':
      return ['ready_or_out']
    case 'completed':
      return ['completed']
    case 'cancelled':
      return ['cancelled']
    default:
      return undefined
  }
}

// ---- Navigation -----------------------------------------------------------

export type SectionId =
  | 'dashboard'
  | 'orders'
  | 'medicines'
  | 'inventory'
  | 'prescriptions'
  | 'customers'
  | 'marketing'
  | 'reports'
  | 'shops'
  | 'settings'

export type InventoryTab = 'stock' | 'low' | 'out'

export type NavTarget = {
  section: SectionId
  orders?: OrdersFilter
  inventoryTab?: InventoryTab
  openOrderId?: string
  scrollTo?: string
  search?: string
}
