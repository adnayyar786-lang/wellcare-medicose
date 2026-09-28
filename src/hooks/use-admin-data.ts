import { usePaginatedQuery, useQuery } from 'convex/react'
import { useMemo } from 'react'

import { api } from '../../convex/_generated/api'

export function useAdminData() {
  const ordersQ = usePaginatedQuery(api.orders.listV3, {}, { initialNumItems: 500 })
  const medicinesQ = usePaginatedQuery(api.medicines.listAll, {}, { initialNumItems: 500 })
  const customers = useQuery(api.customers.list)
  const coupons = useQuery(api.coupons.list)
  const visitors = useQuery(api.activity.listVisitors)

  const orders = ordersQ.results
  const medicines = medicinesQ.results

  const stats = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

    const todaysOrders = orders.filter((o) => o._creationTime >= startOfToday)
    const todaysSales = todaysOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0)
    const pendingOrders = orders.filter((o) => o.status === 'placed' || o.status === 'preparing')
    const lowStock = medicines.filter((m) => m.active && m.stock > 0 && m.stock <= 10)
    const outOfStock = medicines.filter((m) => m.active && m.stock <= 0)

    const deliveryCount = orders.filter((o) => o.fulfillment === 'delivery').length
    const pickupCount = orders.filter((o) => o.fulfillment === 'pickup').length

    const totalRevenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
    const validOrderCount = orders.filter((o) => o.status !== 'cancelled').length
    const avgOrderValue = validOrderCount > 0 ? totalRevenue / validOrderCount : 0

    const productQty = new Map<string, { name: string; qty: number }>()
    for (const o of orders) {
      if (o.status === 'cancelled') continue
      for (const it of o.items) {
        const existing = productQty.get(it.name)
        if (existing) existing.qty += it.quantity
        else productQty.set(it.name, { name: it.name, qty: it.quantity })
      }
    }
    const topProducts = Array.from(productQty.values()).sort((a, b) => b.qty - a.qty).slice(0, 5)

    // Last 7 days sales trend (real, from order creation timestamps)
    const days: { label: string; value: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = startOfToday - i * 86400000
      const dayEnd = dayStart + 86400000
      const daySales = orders
        .filter((o) => o._creationTime >= dayStart && o._creationTime < dayEnd && o.status !== 'cancelled')
        .reduce((s, o) => s + o.total, 0)
      days.push({
        label: new Date(dayStart).toLocaleDateString('en-IN', { weekday: 'short' }),
        value: daySales,
      })
    }

    return {
      todaysOrderCount: todaysOrders.length,
      todaysSales,
      pendingOrderCount: pendingOrders.length,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      totalCustomers: customers?.length ?? 0,
      deliveryCount,
      pickupCount,
      totalRevenue,
      validOrderCount,
      avgOrderValue,
      topProducts,
      salesTrend: days,
      lowStockItems: lowStock,
    }
  }, [orders, medicines, customers])

  return {
    orders,
    ordersStatus: ordersQ.status,
    loadMoreOrders: ordersQ.loadMore,
    medicines,
    medicinesStatus: medicinesQ.status,
    loadMoreMedicines: medicinesQ.loadMore,
    customers,
    coupons,
    visitors,
    stats,
  }
}
