import { getAuthUserId } from '@convex-dev/auth/server'
import type { Id } from './_generated/dataModel'

export async function getAppUserId(ctx: any): Promise<Id<'users'> | null> {
  const legacyId = await getAuthUserId(ctx)
  if (legacyId) return legacyId

  const identity = await ctx.auth.getUserIdentity()
  if (!identity) return null

  const user = await ctx.db
    .query('users')
    .withIndex('by_auth_token', (q: any) => q.eq('authTokenIdentifier', identity.tokenIdentifier))
    .unique()

  return user?._id ?? null
}
