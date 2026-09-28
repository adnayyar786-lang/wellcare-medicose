// Customer-facing wording for the EXISTING order statuses
// (placed | preparing | ready_or_out | completed | cancelled).
// No new statuses: only the label changes depending on Home Delivery vs Store Pickup.

export type Fulfillment = 'pickup' | 'delivery'

export function orderStatusLabel(status: string, fulfillment: Fulfillment) {
  switch (status) {
    case 'placed':
      return 'Order Placed'
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

export const ORDER_STATUS_BADGE: Record<string, string> = {
  placed: 'bg-amber-100 text-amber-900',
  preparing: 'bg-sky-100 text-sky-900',
  ready_or_out: 'bg-teal-100 text-teal-900',
  completed: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-red-100 text-red-800',
}

export const FULFILLMENT_LABEL: Record<Fulfillment, string> = {
  delivery: 'Home Delivery',
  pickup: 'Store Pickup',
}
