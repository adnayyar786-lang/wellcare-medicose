import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'

import { mutation, query } from './_generated/server'
import type { Id } from './_generated/dataModel'

export const recordLogin = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    const user = await ctx.db.get(userId)
    const email = user?.email
    if (!email) return null

    const priorLogins = await ctx.db
      .query('loginEvents')
      .withIndex('by_email', (q) => q.eq('email', email))
      .collect()
    const isRepeat = priorLogins.length > 0

    await ctx.db.insert('loginEvents', { userId, email, time: Date.now() })

    if (isRepeat) {
      await ctx.db.insert('adminNotifications', {
        message: `Customer ${email} has returned and logged in again.`,
        time: Date.now(),
        read: false,
      })
    }
    return null
  },
})

export const recordProductView = mutation({
  args: { medicineId: v.id('medicines') },
  returns: v.null(),
  handler: async (ctx, { medicineId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    const user = await ctx.db.get(userId)
    const email = user?.email
    if (!email) return null
    const med = await ctx.db.get(medicineId)
    if (!med) return null

    await ctx.db.insert('productViews', {
      userId,
      email,
      medicineId,
      medicineName: med.name,
      time: Date.now(),
    })

    // Repeat-visitor alert: has this email logged in on more than one
    // calendar day? Avoid spamming by not re-notifying within 5 minutes.
    const logins = await ctx.db
      .query('loginEvents')
      .withIndex('by_email', (q) => q.eq('email', email))
      .collect()
    const distinctDays = new Set(logins.map((l) => new Date(l.time).toDateString()))
    if (distinctDays.size > 1) {
      const recentNotif = await ctx.db.query('adminNotifications').withIndex('by_time').order('desc').take(5)
      const alreadyNotifiedRecently = recentNotif.some(
        (n) => n.message.includes(email) && Date.now() - n.time < 5 * 60 * 1000,
      )
      if (!alreadyNotifiedRecently) {
        await ctx.db.insert('adminNotifications', {
          message: `Customer ${email} has returned and is viewing ${med.name}.`,
          time: Date.now(),
          read: false,
        })
      }
    }
    return null
  },
})

const visitorValidator = v.object({
  email: v.string(),
  userId: v.id('users'),
  lastLogin: v.number(),
  loginCount: v.number(),
})

export const listVisitors = query({
  args: {},
  returns: v.array(visitorValidator),
  handler: async (ctx) => {
    const logins = await ctx.db.query('loginEvents').order('desc').take(500)
    const byEmail = new Map<string, { userId: Id<'users'>; lastLogin: number; loginCount: number }>()
    for (const l of logins) {
      const existing = byEmail.get(l.email)
      if (existing) {
        existing.loginCount += 1
        if (l.time > existing.lastLogin) existing.lastLogin = l.time
      } else {
        byEmail.set(l.email, { userId: l.userId, lastLogin: l.time, loginCount: 1 })
      }
    }
    return Array.from(byEmail.entries())
      .map(([email, val]) => ({ email, ...val }))
      .sort((a, b) => b.lastLogin - a.lastLogin)
  },
})

export const listLiveActivity = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('productViews'),
      email: v.string(),
      medicineName: v.string(),
      time: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const views = await ctx.db.query('productViews').order('desc').take(50)
    return views.map((v) => ({ _id: v._id, email: v.email, medicineName: v.medicineName, time: v.time }))
  },
})

export const getCustomerHistory = query({
  args: { email: v.string() },
  returns: v.object({
    logins: v.array(v.object({ time: v.number() })),
    views: v.array(v.object({ medicineName: v.string(), time: v.number() })),
    orders: v.array(
      v.object({
        _id: v.id('orders'),
        status: v.string(),
        total: v.number(),
        _creationTime: v.number(),
      }),
    ),
  }),
  handler: async (ctx, { email }) => {
    const logins = await ctx.db
      .query('loginEvents')
      .withIndex('by_email', (q) => q.eq('email', email))
      .order('desc')
      .take(100)
    const views = await ctx.db
      .query('productViews')
      .withIndex('by_email', (q) => q.eq('email', email))
      .order('desc')
      .take(100)
    const orders = await ctx.db
      .query('orders')
      .withIndex('by_email', (q) => q.eq('customerEmail', email))
      .order('desc')
      .take(50)
    return {
      logins: logins.map((l) => ({ time: l.time })),
      views: views.map((v) => ({ medicineName: v.medicineName, time: v.time })),
      orders: orders.map((o) => ({ _id: o._id, status: o.status, total: o.total, _creationTime: o._creationTime })),
    }
  },
})

export const listNotifications = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('adminNotifications'),
      _creationTime: v.number(),
      message: v.string(),
      time: v.number(),
      read: v.boolean(),
    }),
  ),
  handler: async (ctx) => ctx.db.query('adminNotifications').order('desc').take(30),
})

export const unreadNotificationCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const all = await ctx.db.query('adminNotifications').order('desc').take(100)
    return all.filter((n) => !n.read).length
  },
})

export const markAllNotificationsRead = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const unread = await ctx.db.query('adminNotifications').order('desc').take(100)
    for (const n of unread) {
      if (!n.read) await ctx.db.patch(n._id, { read: true })
    }
    return null
  },
})
