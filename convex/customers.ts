import { v } from 'convex/values'

import { query } from './_generated/server'

// Customers are derived entirely from real order records — there is no
// separate customer-account table (orders are placed by name/phone, with
// Google sign-in optional). "Total spend" and "orders" below are computed
// live from actual order data, never fabricated.
const customerValidator = v.object({
  phone: v.string(),
  name: v.string(),
  email: v.optional(v.string()),
  orderCount: v.number(),
  totalSpend: v.number(),
  lastOrderAt: v.number(),
  cancelledCount: v.number(),
})

export const list = query({
  args: {},
  returns: v.array(customerValidator),
  handler: async (ctx) => {
    const orders = await ctx.db.query('orders').order('desc').take(1000)
    const byPhone = new Map<
      string,
      { name: string; email?: string; orderCount: number; totalSpend: number; lastOrderAt: number; cancelledCount: number }
    >()
    for (const o of orders) {
      const existing = byPhone.get(o.customerPhone)
      const isCancelled = o.status === 'cancelled'
      if (existing) {
        existing.orderCount += 1
        if (!isCancelled) existing.totalSpend += o.total
        if (isCancelled) existing.cancelledCount += 1
        if (o._creationTime > existing.lastOrderAt) existing.lastOrderAt = o._creationTime
        if (o.customerEmail) existing.email = o.customerEmail
      } else {
        byPhone.set(o.customerPhone, {
          name: o.customerName,
          email: o.customerEmail,
          orderCount: 1,
          totalSpend: isCancelled ? 0 : o.total,
          lastOrderAt: o._creationTime,
          cancelledCount: isCancelled ? 1 : 0,
        })
      }
    }
    return Array.from(byPhone.entries())
      .map(([phone, v]) => ({ phone, ...v }))
      .sort((a, b) => b.lastOrderAt - a.lastOrderAt)
  },
})
