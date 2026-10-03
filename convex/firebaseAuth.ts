import { v } from 'convex/values'
import { mutation } from './_generated/server'
import type { Id } from './_generated/dataModel'

export const ensureUser = mutation({
  args: {},
  returns: v.id('users'),
  handler: async (ctx): Promise<Id<'users'>> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Authentication required')

    const byToken = await ctx.db
      .query('users')
      .withIndex('by_auth_token', (q) => q.eq('authTokenIdentifier', identity.tokenIdentifier))
      .unique()
    if (byToken) return byToken._id

    const email = identity.email?.trim().toLowerCase()
    const phone = identity.phoneNumber?.trim()
    let existing = email
      ? await ctx.db.query('users').withIndex('email', (q) => q.eq('email', email)).first()
      : null

    if (!existing && phone) {
      existing = await ctx.db.query('users').withIndex('phone', (q) => q.eq('phone', phone)).first()
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        authTokenIdentifier: identity.tokenIdentifier,
        ...(email && !existing.email ? { email } : {}),
        ...(phone && !existing.phone ? { phone } : {}),
        ...(identity.name && !existing.name ? { name: identity.name } : {}),
        ...(identity.pictureUrl && !existing.image ? { image: identity.pictureUrl } : {}),
      })
      return existing._id
    }

    return await ctx.db.insert('users', {
      authTokenIdentifier: identity.tokenIdentifier,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(identity.name ? { name: identity.name } : {}),
      ...(identity.pictureUrl ? { image: identity.pictureUrl } : {}),
    })
  },
})
