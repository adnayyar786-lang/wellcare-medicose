import type { Id } from './_generated/dataModel'

/**
 * Resolve the application user for Firebase custom-JWT sessions.
 *
 * The project no longer uses @convex-dev/auth sessions for customer auth.
 * Calling getAuthUserId() here makes profile queries depend on the legacy
 * auth tables and can throw a server error after a valid Firebase login.
 */
export async function getAppUserId(ctx: any): Promise<Id<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) return null

  const byToken = await ctx.db
    .query('users')
    .withIndex('by_auth_token', (q: any) => q.eq('authTokenIdentifier', identity.tokenIdentifier))
    .unique()

  if (byToken) return byToken._id

  const email = identity.email?.trim().toLowerCase()
  if (email) {
    const byEmail = await ctx.db
      .query('users')
      .withIndex('email', (q: any) => q.eq('email', email))
      .first()
    if (byEmail) return byEmail._id
  }

  const phone = identity.phoneNumber?.trim()
  if (phone) {
    const byPhone = await ctx.db
      .query('users')
      .withIndex('phone', (q: any) => q.eq('phone', phone))
      .first()
    if (byPhone) return byPhone._id
  }

  return null
}
