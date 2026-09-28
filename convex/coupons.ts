import { v } from 'convex/values'

import { mutation, query } from './_generated/server'

const couponValidator = v.object({
  _id: v.id('coupons'),
  _creationTime: v.number(),
  code: v.string(),
  type: v.union(v.literal('flat'), v.literal('percent')),
  value: v.number(),
  minOrder: v.number(),
  maxOff: v.optional(v.number()),
  active: v.boolean(),
})

export const list = query({
  args: {},
  returns: v.array(couponValidator),
  handler: async (ctx) => ctx.db.query('coupons').order('desc').collect(),
})

export const create = mutation({
  args: {
    code: v.string(),
    type: v.union(v.literal('flat'), v.literal('percent')),
    value: v.number(),
    minOrder: v.number(),
    maxOff: v.optional(v.number()),
  },
  returns: v.id('coupons'),
  handler: async (ctx, args) => {
    const code = args.code.trim().toUpperCase()
    if (!code) throw new Error('Coupon code is required')
    if (args.value <= 0) throw new Error('Value must be positive')
    const existing = await ctx.db
      .query('coupons')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first()
    if (existing) throw new Error('A coupon with this code already exists')
    return ctx.db.insert('coupons', {
      code,
      type: args.type,
      value: args.value,
      minOrder: args.minOrder,
      maxOff: args.maxOff,
      active: true,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('coupons'),
    value: v.optional(v.number()),
    minOrder: v.optional(v.number()),
    maxOff: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, { id, ...patch }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error('Coupon not found')
    await ctx.db.patch(id, patch)
    return null
  },
})

export const remove = mutation({
  args: { id: v.id('coupons') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id)
    return null
  },
})
