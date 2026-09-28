import { v } from 'convex/values'

import { mutation, query } from './_generated/server'

const KEY = 'store'

const settingsValidator = v.object({
  storeName: v.string(),
  address: v.string(),
  phone: v.string(),
  hours: v.string(),
})

// NOTE: this is an admin-only record for reference/future use. The live
// customer-facing site currently reads its store info from
// src/config/store-location.ts, not from this table — updating settings
// here does not change the customer website in this phase.
export const get = query({
  args: {},
  returns: settingsValidator,
  handler: async (ctx) => {
    const row = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', KEY))
      .first()
    return {
      storeName: row?.storeName ?? 'Wellcare Medicose',
      address: row?.address ?? 'Satti Mohalla, near Badshah Hotel, Roorkee, Haridwar, Uttarakhand',
      phone: row?.phone ?? '+91 7088252556',
      hours: row?.hours ?? 'Open 24×7',
    }
  },
})

export const update = mutation({
  args: {
    storeName: v.string(),
    address: v.string(),
    phone: v.string(),
    hours: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('settings')
      .withIndex('by_key', (q) => q.eq('key', KEY))
      .first()
    if (row) {
      await ctx.db.patch(row._id, args)
    } else {
      await ctx.db.insert('settings', { key: KEY, ...args })
    }
    return null
  },
})
