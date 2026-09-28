import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

export const getMine = query({
  args: {},
  returns: v.union(v.null(), v.object({
    name: v.optional(v.string()), image: v.optional(v.string()), email: v.optional(v.string()), phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()), gender: v.optional(v.string()), addressLine: v.optional(v.string()),
    landmark: v.optional(v.string()), city: v.optional(v.string()), state: v.optional(v.string()),
    pincode: v.optional(v.string()), avatarKey: v.optional(v.string()), emergencyContact: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    const id = await getAuthUserId(ctx)
    if (!id) return null
    const u = await ctx.db.get(id)
    if (!u) return null
    return { name:u.name, image:u.image, email:u.email, phone:u.phone, dateOfBirth:u.dateOfBirth, gender:u.gender,
      addressLine:u.addressLine, landmark:u.landmark, city:u.city, state:u.state, pincode:u.pincode,
      avatarKey:u.avatarKey, emergencyContact:u.emergencyContact }
  },
})

export const updateMine = mutation({
  args: {
    name:v.string(), dateOfBirth:v.string(), gender:v.string(), addressLine:v.string(), landmark:v.string(),
    city:v.string(), state:v.string(), pincode:v.string(), avatarKey:v.string(), emergencyContact:v.string(),
  },
  returns: v.union(v.literal('saved'), v.literal('unauthenticated')),
  handler: async (ctx, args) => {
    const id = await getAuthUserId(ctx)
    if (!id) return 'unauthenticated'
    const user = await ctx.db.get(id)
    if (!user) return 'unauthenticated'
    const clean = Object.fromEntries(Object.entries(args).map(([k,val]) => [k, val.trim()])) as typeof args
    if (clean.pincode && !/^\d{6}$/.test(clean.pincode)) throw new Error('Enter a valid 6-digit PIN code')
    if (clean.emergencyContact && !/^[+\d\s()-]{7,20}$/.test(clean.emergencyContact)) throw new Error('Enter a valid emergency contact number')
    await ctx.db.patch(id, { name:clean.name || undefined, dateOfBirth:clean.dateOfBirth || undefined,
      gender:clean.gender || undefined, addressLine:clean.addressLine || undefined, landmark:clean.landmark || undefined,
      city:clean.city || undefined, state:clean.state || undefined, pincode:clean.pincode || undefined,
      avatarKey:clean.avatarKey || undefined, emergencyContact:clean.emergencyContact || undefined })
    return 'saved'
  },
})
