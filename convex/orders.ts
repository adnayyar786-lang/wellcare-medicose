import {
  paginationOptsValidator,
  paginationResultValidator,
} from 'convex/server'
import { v } from 'convex/values'
import { getAppUserId } from './appAuth'

import { mutation, query } from './_generated/server'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'

const paymentMethodValidator = v.union(
  v.literal('cash'),
  v.literal('online'),
  v.literal('upi'),
  v.literal('card'),
  v.literal('cod'),
  v.literal('wallet'),
)

const orderItemValidator = v.object({
  medicineId: v.id('medicines'),
  name: v.string(),
  price: v.number(),
  mrpPrice: v.optional(v.number()),
  quantity: v.number(),
})

const legacyOrderValidator = v.object({
  _id: v.id('orders'),
  _creationTime: v.number(),
  customerName: v.string(),
  customerPhone: v.string(),
  fulfillment: v.union(v.literal('pickup'), v.literal('delivery')),
  deliveryAddress: v.optional(v.string()),
  paymentMethod: v.union(v.literal('cash'), v.literal('online')),
  paymentStatus: v.union(
    v.literal('pending'),
    v.literal('paid'),
    v.literal('cash_on_fulfillment'),
  ),
  status: v.union(
    v.literal('placed'),
    v.literal('preparing'),
    v.literal('ready_or_out'),
    v.literal('completed'),
    v.literal('cancelled'),
  ),
  items: v.array(
    v.object({
      medicineId: v.id('medicines'),
      name: v.string(),
      price: v.number(),
      quantity: v.number(),
    }),
  ),
  total: v.number(),
  notes: v.optional(v.string()),
})

const orderValidatorV2 = v.object({
  _id: v.id('orders'),
  _creationTime: v.number(),
  customerName: v.string(),
  customerPhone: v.string(),
  fulfillment: v.union(v.literal('pickup'), v.literal('delivery')),
  deliveryAddress: v.optional(v.string()),
  paymentMethod: v.union(
    v.literal('cash'),
    v.literal('online'),
    v.literal('upi'),
    v.literal('card'),
    v.literal('cod'),
  ),
  paymentStatus: v.union(
    v.literal('pending'),
    v.literal('paid'),
    v.literal('cash_on_fulfillment'),
  ),
  status: v.union(
    v.literal('placed'),
    v.literal('preparing'),
    v.literal('ready_or_out'),
    v.literal('completed'),
    v.literal('cancelled'),
  ),
  items: v.array(
    v.object({
      medicineId: v.id('medicines'),
      name: v.string(),
      price: v.number(),
      quantity: v.number(),
    }),
  ),
  total: v.number(),
  notes: v.optional(v.string()),
})

// Full current shape, used by functions with no prior published contract:
// getById, findByPhone, listV3.
const orderValidator = v.object({
  _id: v.id('orders'),
  _creationTime: v.number(),
  customerName: v.string(),
  customerPhone: v.string(),
  customerEmail: v.optional(v.string()),
  fulfillment: v.union(v.literal('pickup'), v.literal('delivery')),
  deliveryAddress: v.optional(v.string()),
  deliveryTimePref: v.optional(v.string()),
  paymentMethod: paymentMethodValidator,
  paymentStatus: v.union(
    v.literal('pending'),
    v.literal('paid'),
    v.literal('cash_on_fulfillment'),
  ),
  status: v.union(
    v.literal('placed'),
    v.literal('preparing'),
    v.literal('ready_or_out'),
    v.literal('completed'),
    v.literal('cancelled'),
  ),
  items: v.array(orderItemValidator),
  subtotal: v.optional(v.number()),
  discount: v.optional(v.number()),
  couponCode: v.optional(v.string()),
  deliveryCharge: v.optional(v.number()),
  total: v.number(),
  notes: v.optional(v.string()),
})

type OrderItem = {
  medicineId: Id<'medicines'>
  name: string
  price: number
  mrpPrice?: number
  quantity: number
}

const FALLBACK_COUPONS: Record<string, { type: 'flat' | 'percent'; value: number; minOrder: number; maxOff?: number }> = {
  FIRST100: { type: 'flat', value: 100, minOrder: 499 },
  FIRST25: { type: 'percent', value: 25, minOrder: 199, maxOff: 150 },
}

function computeDeliveryCharge(fulfillment: 'pickup' | 'delivery', subtotal: number) {
  if (fulfillment === 'pickup') return 0
  return subtotal >= 499 ? 0 : 40
}

export const place = mutation({
  args: {
    customerName: v.string(),
    customerPhone: v.string(),
    fulfillment: v.union(v.literal('pickup'), v.literal('delivery')),
    deliveryAddress: v.optional(v.string()),
    paymentMethod: paymentMethodValidator,
    items: v.array(
      v.object({ medicineId: v.id('medicines'), quantity: v.number() }),
    ),
    notes: v.optional(v.string()),
  },
  returns: v.id('orders'),
  handler: async (ctx, args) => {
    const authUserId = await getAppUserId(ctx)
    if (!authUserId) throw new Error('Please sign in before placing an order')
    const name = args.customerName.trim()
    const phone = args.customerPhone.trim()
    if (!name) throw new Error('Name is required')
    if (!phone) throw new Error('Phone number is required')
    if (args.items.length === 0) throw new Error('Cart is empty')
    if (args.fulfillment === 'delivery' && !args.deliveryAddress?.trim())
      throw new Error('Delivery address is required')

    let total = 0
    const items: OrderItem[] = []
    for (const line of args.items) {
      if (line.quantity <= 0) throw new Error('Quantity must be positive')
      const med = await ctx.db.get(line.medicineId)
      if (!med || !med.active) throw new Error('A medicine in your cart is no longer available')
      if (med.stock < line.quantity)
        throw new Error(`Not enough stock for ${med.name}`)
      total += med.price * line.quantity
      items.push({
        medicineId: med._id,
        name: med.name,
        price: med.price,
        quantity: line.quantity,
      })
      await ctx.db.patch(med._id, { stock: med.stock - line.quantity })
    }

    const isCashLike = args.paymentMethod === 'cash' || args.paymentMethod === 'cod'

    const orderId = await ctx.db.insert('orders', {
      customerName: name,
      customerPhone: phone,
      fulfillment: args.fulfillment,
      deliveryAddress: args.fulfillment === 'delivery' ? args.deliveryAddress?.trim() : undefined,
      paymentMethod: args.paymentMethod,
      paymentStatus: isCashLike ? 'cash_on_fulfillment' : 'pending',
      status: 'placed',
      items,
      total,
      notes: args.notes?.trim() || undefined,
    })

    const itemsSummary = items.map((it) => `${it.quantity} × ${it.name}`).join('\n')
    await ctx.scheduler.runAfter(0, internal.emails.notifyNewOrder, {
      orderId,
      customerName: name,
      customerPhone: phone,
      fulfillment: args.fulfillment,
      deliveryAddress: args.fulfillment === 'delivery' ? args.deliveryAddress?.trim() : undefined,
      paymentMethod: args.paymentMethod,
      total,
      itemsSummary,
    })

    return orderId
  },
})

// Checkout v2: supports coupon codes, per-item MRP, delivery charge, and a
// delivery time preference. Captures the logged-in user's email (if any) so
// admin can link browsing history to orders. Used by /checkout.
export const placeV2 = mutation({
  args: {
    customerName: v.string(),
    customerPhone: v.string(),
    fulfillment: v.union(v.literal('pickup'), v.literal('delivery')),
    deliveryAddress: v.optional(v.string()),
    deliveryTimePref: v.optional(v.string()),
    paymentMethod: paymentMethodValidator,
    couponCode: v.optional(v.string()),
    items: v.array(
      v.object({ medicineId: v.id('medicines'), quantity: v.number() }),
    ),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    orderId: v.id('orders'),
    subtotal: v.number(),
    discount: v.number(),
    deliveryCharge: v.number(),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const authUserId = await getAppUserId(ctx)
    if (!authUserId) throw new Error('Please sign in before placing an order')
    const name = args.customerName.trim()
    const phone = args.customerPhone.trim()
    if (!name) throw new Error('Name is required')
    if (!phone) throw new Error('Phone number is required')
    if (args.items.length === 0) throw new Error('Cart is empty')
    if (args.fulfillment === 'delivery' && !args.deliveryAddress?.trim())
      throw new Error('Delivery address is required')

    let subtotal = 0
    const items: OrderItem[] = []
    for (const line of args.items) {
      if (line.quantity <= 0) throw new Error('Quantity must be positive')
      const med = await ctx.db.get(line.medicineId)
      if (!med || !med.active) throw new Error('A medicine in your cart is no longer available')
      if (med.stock < line.quantity)
        throw new Error(`Not enough stock for ${med.name}`)
      subtotal += med.price * line.quantity
      items.push({
        medicineId: med._id,
        name: med.name,
        price: med.price,
        mrpPrice: med.mrpPrice,
        quantity: line.quantity,
      })
      await ctx.db.patch(med._id, { stock: med.stock - line.quantity })
    }

    let discount = 0
    const code = args.couponCode?.trim().toUpperCase()
    if (code) {
      const dbCoupon = await ctx.db
        .query('coupons')
        .withIndex('by_code', (q) => q.eq('code', code))
        .first()
      const coupon = dbCoupon && dbCoupon.active ? dbCoupon : FALLBACK_COUPONS[code]
      if (!coupon) throw new Error('Invalid coupon code')
      if (subtotal < coupon.minOrder)
        throw new Error(`Add items worth ₹${coupon.minOrder} to use ${code}`)
      discount = coupon.type === 'flat' ? coupon.value : Math.round((subtotal * coupon.value) / 100)
      if (coupon.maxOff) discount = Math.min(discount, coupon.maxOff)
      discount = Math.min(discount, subtotal)
    }

    const deliveryCharge = computeDeliveryCharge(args.fulfillment, subtotal)
    const total = Math.max(0, subtotal - discount + deliveryCharge)
    const isCashLike = args.paymentMethod === 'cash' || args.paymentMethod === 'cod'

    const user = await ctx.db.get(authUserId)
    const customerEmail = user?.email

    const orderId = await ctx.db.insert('orders', {
      customerName: name,
      customerPhone: phone,
      customerEmail,
      fulfillment: args.fulfillment,
      deliveryAddress: args.fulfillment === 'delivery' ? args.deliveryAddress?.trim() : undefined,
      deliveryTimePref: args.deliveryTimePref?.trim() || undefined,
      paymentMethod: args.paymentMethod,
      paymentStatus: isCashLike ? 'cash_on_fulfillment' : 'pending',
      status: 'placed',
      items,
      subtotal,
      discount,
      couponCode: code,
      deliveryCharge,
      total,
      notes: args.notes?.trim() || undefined,
    })

    const itemsSummary = items.map((it) => `${it.quantity} × ${it.name}`).join('\n')
    await ctx.scheduler.runAfter(0, internal.emails.notifyNewOrder, {
      orderId,
      customerName: name,
      customerPhone: phone,
      fulfillment: args.fulfillment,
      deliveryAddress: args.fulfillment === 'delivery' ? args.deliveryAddress?.trim() : undefined,
      paymentMethod: args.paymentMethod,
      total,
      itemsSummary,
    })

    return { orderId, subtotal, discount, deliveryCharge, total }
  },
})

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(legacyOrderValidator),
  handler: async (ctx, args) => {
    const result = await ctx.db.query('orders').order('desc').paginate(args.paginationOpts)
    return {
      ...result,
      page: result.page.map((order) => ({
        _id: order._id,
        _creationTime: order._creationTime,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        fulfillment: order.fulfillment,
        deliveryAddress: order.deliveryAddress,
        paymentMethod: order.paymentMethod === 'online' || order.paymentMethod === 'cash'
          ? order.paymentMethod
          : (order.paymentMethod === 'cod' ? ('cash' as const) : ('online' as const)),
        paymentStatus: order.paymentStatus,
        status: order.status,
        items: order.items.map((it) => ({
          medicineId: it.medicineId,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
        })),
        total: order.total,
        notes: order.notes,
      })),
    }
  },
})

export const listV2 = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(orderValidatorV2),
  handler: async (ctx, args) => {
    const result = await ctx.db.query('orders').order('desc').paginate(args.paginationOpts)
    return {
      ...result,
      page: result.page.map((order) => ({
        _id: order._id,
        _creationTime: order._creationTime,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        fulfillment: order.fulfillment,
        deliveryAddress: order.deliveryAddress,
        paymentMethod: order.paymentMethod === 'wallet' ? ('card' as const) : order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: order.status,
        items: order.items.map((it) => ({
          medicineId: it.medicineId,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
        })),
        total: order.total,
        notes: order.notes,
      })),
    }
  },
})

export const listV3 = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(orderValidator),
  handler: async (ctx, args) =>
    ctx.db.query('orders').order('desc').paginate(args.paginationOpts),
})

export const getById = query({
  args: { id: v.id('orders') },
  returns: v.union(orderValidator, v.null()),
  handler: async (ctx, { id }) => ctx.db.get(id),
})

export const findByPhone = query({
  args: { phone: v.string() },
  returns: v.array(orderValidator),
  handler: async (ctx, { phone }) => {
    const cleaned = phone.trim()
    if (!cleaned) return []
    const results = await ctx.db
      .query('orders')
      .withIndex('by_phone', (q) => q.eq('customerPhone', cleaned))
      .order('desc')
      .take(20)
    return results
  },
})

export const setStatus = mutation({
  args: {
    id: v.id('orders'),
    status: v.union(
      v.literal('placed'),
      v.literal('preparing'),
      v.literal('ready_or_out'),
      v.literal('completed'),
      v.literal('cancelled'),
    ),
  },
  returns: v.null(),
  handler: async (ctx, { id, status }) => {
    const order = await ctx.db.get(id)
    if (!order) throw new Error('Order not found')
    if (order.status !== status) {
      await ctx.db.patch(id, { status })
      if (status === 'cancelled') {
        await ctx.scheduler.runAfter(0, internal.emails.notifyOrderCancelled, {
          orderId: id,
          customerName: order.customerName,
          total: order.total,
        })
      }
    }
    return null
  },
})

export const markPaid = mutation({
  args: { id: v.id('orders') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    const order = await ctx.db.get(id)
    if (!order) throw new Error('Order not found')
    if (order.paymentStatus !== 'paid') await ctx.db.patch(id, { paymentStatus: 'paid' })
    return null
  },
})

// Customer-facing cancellation. Only allowed while the order hasn't started
// being prepared for pickup/dispatch. Restocks every cancelled line and
// notifies the admin.
export const cancelItems = mutation({
  args: {
    id: v.id('orders'),
    medicineIds: v.array(v.id('medicines')),
  },
  returns: v.null(),
  handler: async (ctx, { id, medicineIds }) => {
    const order = await ctx.db.get(id)
    if (!order) throw new Error('Order not found')
    if (order.status !== 'placed' && order.status !== 'preparing') {
      throw new Error('This order can no longer be cancelled — it is already being fulfilled')
    }
    if (medicineIds.length === 0) throw new Error('Select at least one item to cancel')

    const toCancel = new Set(medicineIds.map(String))
    const remaining = order.items.filter((it) => !toCancel.has(String(it.medicineId)))
    const cancelled = order.items.filter((it) => toCancel.has(String(it.medicineId)))

    for (const it of cancelled) {
      const med = await ctx.db.get(it.medicineId)
      if (med) await ctx.db.patch(med._id, { stock: med.stock + it.quantity })
    }

    const cancelledSummary = cancelled.map((it) => `${it.quantity} × ${it.name}`).join(', ')

    if (remaining.length === 0) {
      await ctx.db.patch(id, { status: 'cancelled', items: remaining })
      await ctx.scheduler.runAfter(0, internal.emails.notifyOrderCancelled, {
        orderId: id,
        customerName: order.customerName,
        total: order.total,
      })
      return null
    }

    const newSubtotal = remaining.reduce((sum, it) => sum + it.price * it.quantity, 0)
    const discount = Math.min(order.discount ?? 0, newSubtotal)
    const deliveryCharge = computeDeliveryCharge(order.fulfillment, newSubtotal)
    const newTotal = Math.max(0, newSubtotal - discount + deliveryCharge)

    await ctx.db.patch(id, {
      items: remaining,
      subtotal: newSubtotal,
      discount,
      deliveryCharge,
      total: newTotal,
    })
    await ctx.scheduler.runAfter(0, internal.emails.notifyOrderCancelled, {
      orderId: id,
      customerName: order.customerName,
      total: order.total - newTotal,
      partial: cancelledSummary,
    })
    return null
  },
})
