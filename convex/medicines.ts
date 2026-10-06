import {
  paginationOptsValidator,
  paginationResultValidator,
} from 'convex/server'
import { v } from 'convex/values'

import { mutation, query, internalMutation } from './_generated/server'

// Catalogue seed batches are executed by the production CI workflow.

const medicineValidator = v.object({
  _id: v.id('medicines'),
  _creationTime: v.number(),
  name: v.string(),
  manufacturer: v.optional(v.string()),
  category: v.string(),
  description: v.string(),
  price: v.number(),
  mrpPrice: v.optional(v.number()),
  stock: v.number(),
  requiresPrescription: v.boolean(),
  imageUrl: v.optional(v.string()),
  active: v.boolean(),
  shopCategory: v.optional(v.string()),
  featured: v.optional(v.boolean()),
  updatedAt: v.optional(v.number()),
  barcode: v.optional(v.string()),
})

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(medicineValidator),
  handler: async (ctx, args) =>
    ctx.db
      .query('medicines')
      .withIndex('by_active', (q) => q.eq('active', true))
      .order('desc')
      .paginate(args.paginationOpts),
})

export const listAll = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(medicineValidator),
  handler: async (ctx, args) =>
    ctx.db.query('medicines').order('desc').paginate(args.paginationOpts),
})

export const search = query({
  args: { query: v.string() },
  returns: v.array(medicineValidator),
  handler: async (ctx, args) => {
    const q = args.query.trim()
    if (!q) return []
    return await ctx.db
      .query('medicines')
      .withSearchIndex('search_name', (search) => search.search('name', q).eq('active', true))
      .take(50)
  },
})


export const getByBarcode = query({
  args: { barcode: v.string() },
  returns: v.union(medicineValidator, v.null()),
  handler: async (ctx, { barcode }) => {
    const code = barcode.trim()
    if (!code) return null
    return await ctx.db
      .query('medicines')
      .withIndex('by_barcode', (q) => q.eq('barcode', code))
      .filter((q) => q.eq(q.field('active'), true))
      .first()
  },
})

export const getById = query({
  args: { id: v.id('medicines') },
  returns: v.union(medicineValidator, v.null()),
  handler: async (ctx, { id }) => ctx.db.get(id),
})

export const create = mutation({
  args: {
    name: v.string(),
    manufacturer: v.optional(v.string()),
    category: v.string(),
    description: v.string(),
    price: v.number(),
    mrpPrice: v.optional(v.number()),
    stock: v.number(),
    requiresPrescription: v.boolean(),
    imageUrl: v.optional(v.string()),
    shopCategory: v.optional(v.string()),
    barcode: v.optional(v.string()),
  },
  returns: v.id('medicines'),
  handler: async (ctx, args) => {
    const name = args.name.trim()
    if (!name) throw new Error('Medicine name is required')
    if (args.price < 0) throw new Error('Price cannot be negative')
    if (args.stock < 0) throw new Error('Stock cannot be negative')
    return ctx.db.insert('medicines', {
      name,
      manufacturer: args.manufacturer?.trim() || undefined,
      category: args.category.trim() || 'General',
      description: args.description.trim(),
      price: args.price,
      mrpPrice: args.mrpPrice,
      stock: args.stock,
      requiresPrescription: args.requiresPrescription,
      imageUrl: args.imageUrl,
      active: true,
      shopCategory: args.shopCategory || 'Medicines (Branded)',
      barcode: args.barcode?.trim() || undefined,
      updatedAt: Date.now(),
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('medicines'),
    name: v.optional(v.string()),
    manufacturer: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    mrpPrice: v.optional(v.number()),
    stock: v.optional(v.number()),
    requiresPrescription: v.optional(v.boolean()),
    imageUrl: v.optional(v.string()),
    active: v.optional(v.boolean()),
    shopCategory: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    barcode: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { id, ...patch }) => {
    const existing = await ctx.db.get(id)
    if (!existing) throw new Error('Medicine not found')
    if (patch.price !== undefined && patch.price < 0)
      throw new Error('Price cannot be negative')
    if (patch.stock !== undefined && patch.stock < 0)
      throw new Error('Stock cannot be negative')
    const normalizedPatch = { ...patch, barcode: patch.barcode?.trim() || undefined }
    await ctx.db.patch(id, { ...normalizedPatch, updatedAt: Date.now() })
    return null
  },
})

export const setImageUrl = internalMutation({
  args: { id: v.id('medicines'), imageUrl: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, { id, imageUrl }) => {
    await ctx.db.patch(id, { imageUrl, updatedAt: Date.now() })
    return null
  },
})

export const remove = mutation({
  args: { id: v.id('medicines') },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id)
    return null
  },
})

export const seedMany = mutation({
  args: {
    items: v.array(
      v.object({
        name: v.string(),
        category: v.string(),
        description: v.string(),
        price: v.number(),
        stock: v.number(),
        requiresPrescription: v.boolean(),
      }),
    ),
  },
  returns: v.number(),
  handler: async (ctx, { items }) => {
    let inserted = 0
    for (const item of items) {
      const existing = await ctx.db
        .query('medicines')
        .withIndex('by_category', (q) => q.eq('category', item.category))
        .collect()
      const alreadyThere = existing.some((m) => m.name === item.name)
      if (alreadyThere) continue
      await ctx.db.insert('medicines', {
        name: item.name,
        category: item.category,
        description: item.description,
        price: item.price,
        stock: item.stock,
        requiresPrescription: item.requiresPrescription,
        active: true,
        shopCategory: item.category.toLowerCase().includes('pet') ? 'Pet Care' : 'Medicines (Branded)',
      })
      inserted += 1
    }
    return inserted
  },
})

// Full-featured bulk insert supporting explicit shopCategory + mrpPrice, used
// for curated real-brand catalog additions (e.g. multivitamins/nutrition).
export const seedManyV2 = mutation({
  args: {
    items: v.array(
      v.object({
        name: v.string(),
        category: v.string(),
        shopCategory: v.string(),
        description: v.string(),
        price: v.number(),
        mrpPrice: v.optional(v.number()),
        stock: v.number(),
        requiresPrescription: v.boolean(),
        manufacturer: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
      }),
    ),
  },
  returns: v.number(),
  handler: async (ctx, { items }) => {
    let inserted = 0
    for (const item of items) {
      const existing = await ctx.db
        .query('medicines')
        .withIndex('by_category', (q) => q.eq('category', item.category))
        .collect()
      const alreadyThere = existing.some((m) => m.name === item.name)
      if (alreadyThere) continue
      await ctx.db.insert('medicines', {
        name: item.name,
        category: item.category,
        shopCategory: item.shopCategory,
        description: item.description,
        price: item.price,
        mrpPrice: item.mrpPrice,
        stock: item.stock,
        requiresPrescription: item.requiresPrescription,
        manufacturer: item.manufacturer,
        imageUrl: item.imageUrl,
        active: true,
        updatedAt: Date.now(),
      })
      inserted += 1
    }
    return inserted
  },
})

// One-time backfill: assign a Flipkart-style shopCategory and a notional MRP
// (so the product page can show a strikethrough price + % off) to any
// medicine that doesn't have them yet. Safe to re-run; it only touches rows
// missing the fields.
export const backfillShopFields = mutation({
  args: { cursor: v.optional(v.string()) },
  returns: v.object({ processed: v.number(), continueCursor: v.union(v.string(), v.null()), isDone: v.boolean() }),
  handler: async (ctx, args) => {
    const page = await ctx.db.query('medicines').paginate({
      cursor: args.cursor ?? null,
      numItems: 100,
    })
    let processed = 0
    for (const med of page.page) {
      const patch: Record<string, unknown> = {}
      if (!med.shopCategory) {
        patch.shopCategory = med.description.toLowerCase().includes('mankind')
          ? 'Mankind Products'
          : 'Medicines (Branded)'
      }
      if (med.mrpPrice === undefined) {
        patch.mrpPrice = Math.round(med.price * 1.18 * 100) / 100
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(med._id, patch)
        processed += 1
      }
    }
    return {
      processed,
      continueCursor: page.isDone ? null : page.continueCursor,
      isDone: page.isDone,
    }
  },
})
