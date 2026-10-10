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
  additionalImages: v.optional(v.array(v.string())),
  active: v.boolean(),
  shopCategory: v.optional(v.string()),
  featured: v.optional(v.boolean()),
  updatedAt: v.optional(v.number()),
  barcode: v.optional(v.string()),
  batchNumber: v.optional(v.string()),
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
    batchNumber: v.optional(v.string()),
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
      batchNumber: args.batchNumber?.trim() || undefined,
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
    batchNumber: v.optional(v.string()),
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

export const appendMedicineImage = internalMutation({
  args: { id: v.id('medicines'), imageUrl: v.string() },
  returns: v.null(),
  handler: async (ctx, { id, imageUrl }) => {
    const medicine = await ctx.db.get(id)
    if (!medicine) throw new Error('Medicine not found')
    const url = imageUrl.trim()
    if (!url) throw new Error('Image URL is empty')
    const current = medicine.additionalImages ?? []
    if (medicine.imageUrl !== url && !current.includes(url)) {
      if (!medicine.imageUrl) {
        await ctx.db.patch(id, { imageUrl: url, updatedAt: Date.now() })
      } else {
        await ctx.db.patch(id, { additionalImages: [...current, url], updatedAt: Date.now() })
      }
    }
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

export const setImageUrlAndRegister = internalMutation({
  args: { id: v.id('medicines'), imageUrl: v.optional(v.string()), source: v.string() },
  returns: v.null(),
  handler: async (ctx, { id, imageUrl, source }) => {
    await ctx.db.patch(id, { imageUrl, updatedAt: Date.now() })
    const existing = await ctx.db.query('imageRegistry').withIndex('by_medicine', (q) => q.eq('medicineId', id)).first()
    if (!imageUrl) {
      if (existing) await ctx.db.patch(existing._id, { imageUrl: '', source, verifiedAt: Date.now(), status: 'revoked' })
      return null
    }
    const medicine = await ctx.db.get(id)
    if (!medicine) throw new Error('Medicine not found')
    const record = { medicineId: id, medicineName: medicine.name, imageUrl, source, verifiedAt: Date.now(), status: 'verified' as const }
    if (existing) await ctx.db.patch(existing._id, record)
    else await ctx.db.insert('imageRegistry', record)
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
      const alreadyThere = existing.find((m) => m.name === item.name)
      if (alreadyThere) {
        if (item.imageUrl && alreadyThere.imageUrl !== item.imageUrl) {
          await ctx.db.patch(alreadyThere._id, {
            imageUrl: item.imageUrl,
            updatedAt: Date.now(),
          })
        }
        continue
      }
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
        batchNumber: v.optional(v.string()),
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
        batchNumber: item.batchNumber,
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
export const verifyCatalogue = query({
  args: { names: v.array(v.string()) },
  returns: v.object({
    expected: v.number(),
    found: v.number(),
    missing: v.array(v.string()),
    duplicates: v.array(v.string()),
    inactive: v.array(v.string()),
  }),
  handler: async (ctx, { names }) => {
    const uniqueNames = [...new Set(names.map((n) => n.trim()).filter(Boolean))]
    const missing: string[] = []
    const duplicates: string[] = []
    const inactive: string[] = []
    let found = 0
    for (const name of uniqueNames) {
      const rows = await ctx.db.query('medicines').withIndex('by_name', (q) => q.eq('name', name)).collect()
      if (rows.length === 0) {
        missing.push(name)
        continue
      }
      found += 1
      if (rows.length > 1) duplicates.push(name)
      if (rows.every((row) => !row.active)) inactive.push(name)
    }
    return { expected: uniqueNames.length, found, missing, duplicates, inactive }
  },
})


export const verifyCatalogueImages = query({
  args: {
    items: v.array(
      v.object({
        name: v.string(),
        imageUrl: v.string(),
      }),
    ),
  },
  returns: v.object({
    expected: v.number(),
    matched: v.number(),
    missing: v.array(v.string()),
    missingImage: v.array(v.string()),
    mismatchedImage: v.array(v.string()),
    inactive: v.array(v.string()),
    duplicates: v.array(v.string()),
  }),
  handler: async (ctx, { items }) => {
    const expected = new Map<string, string>()
    const duplicates: string[] = []
    for (const item of items) {
      const name = item.name.trim()
      if (!name) continue
      if (expected.has(name)) duplicates.push(name)
      expected.set(name, item.imageUrl.trim())
    }

    const missing: string[] = []
    const missingImage: string[] = []
    const mismatchedImage: string[] = []
    const inactive: string[] = []
    let matched = 0

    for (const [name, imageUrl] of expected) {
      const rows = await ctx.db
        .query('medicines')
        .withIndex('by_name', (q) => q.eq('name', name))
        .collect()

      if (rows.length === 0) {
        missing.push(name)
        continue
      }
      if (rows.length > 1) duplicates.push(name)
      if (rows.every((row) => !row.active)) inactive.push(name)

      const row = rows.find((entry) => entry.active) ?? rows[0]
      if (!row.imageUrl) {
        missingImage.push(name)
        continue
      }
      if (row.imageUrl !== imageUrl) {
        mismatchedImage.push(name)
        continue
      }
      matched += 1
    }

    return {
      expected: expected.size,
      matched,
      missing,
      missingImage,
      mismatchedImage,
      inactive,
      duplicates: [...new Set(duplicates)],
    }
  },
})


export const registerVerifiedCatalogueImages = mutation({
  args: { items: v.array(v.object({ name: v.string(), imageUrl: v.string(), source: v.string() })) },
  returns: v.object({ registered: v.number(), rejected: v.array(v.string()) }),
  handler: async (ctx, { items }) => {
    let registered = 0
    const rejected: string[] = []
    for (const item of items) {
      const name = item.name.trim(), imageUrl = item.imageUrl.trim(), source = item.source.trim()
      const rows = await ctx.db.query('medicines').withIndex('by_name', (q) => q.eq('name', name)).collect()
      const activeRows = rows.filter((row) => row.active)
      if (activeRows.length !== 1 || !imageUrl || !source || activeRows[0].imageUrl !== imageUrl) {
        rejected.push(name)
        continue
      }
      const medicine = activeRows[0]
      const existing = await ctx.db.query('imageRegistry').withIndex('by_medicine', (q) => q.eq('medicineId', medicine._id)).first()
      const record = { medicineId: medicine._id, medicineName: medicine.name, imageUrl, source, verifiedAt: Date.now(), status: 'verified' as const }
      if (existing) await ctx.db.patch(existing._id, record)
      else await ctx.db.insert('imageRegistry', record)
      registered += 1
    }
    return { registered, rejected }
  },
})

export const verifyVerifiedImageRegistry = query({
  args: { items: v.array(v.object({ name: v.string(), imageUrl: v.string() })) },
  returns: v.object({ expected: v.number(), verified: v.number(), missingRegistry: v.array(v.string()), registryMismatch: v.array(v.string()), revoked: v.array(v.string()) }),
  handler: async (ctx, { items }) => {
    const unique = new Map<string, string>()
    for (const item of items) unique.set(item.name.trim(), item.imageUrl.trim())
    const missingRegistry: string[] = [], registryMismatch: string[] = [], revoked: string[] = []
    let verified = 0
    for (const [name, imageUrl] of unique) {
      const medicine = await ctx.db.query('medicines').withIndex('by_name', (q) => q.eq('name', name)).filter((q) => q.eq(q.field('active'), true)).first()
      if (!medicine) { missingRegistry.push(name); continue }
      const registry = await ctx.db.query('imageRegistry').withIndex('by_medicine', (q) => q.eq('medicineId', medicine._id)).first()
      if (!registry) { missingRegistry.push(name); continue }
      if (registry.status === 'revoked') { revoked.push(name); continue }
      if (registry.imageUrl !== imageUrl || medicine.imageUrl !== registry.imageUrl) { registryMismatch.push(name); continue }
      verified += 1
    }
    return { expected: unique.size, verified, missingRegistry, registryMismatch, revoked }
  },
})

export const assertVerifiedImageRegistry = query({
  args: { items: v.array(v.object({ name: v.string(), imageUrl: v.string() })) },
  returns: v.null(),
  handler: async (ctx, { items }) => {
    const unique = new Map<string, string>()
    for (const item of items) unique.set(item.name.trim(), item.imageUrl.trim())
    const failures: string[] = []
    for (const [name, imageUrl] of unique) {
      const medicine = await ctx.db
        .query('medicines')
        .withIndex('by_name', (q) => q.eq('name', name))
        .filter((q) => q.eq(q.field('active'), true))
        .first()
      if (!medicine) { failures.push(name + ': missing active medicine'); continue }
      if (!medicine.imageUrl) { failures.push(name + ': missing medicine image'); continue }
      if (medicine.imageUrl !== imageUrl) { failures.push(name + ': medicine image mismatch'); continue }
      const registry = await ctx.db.query('imageRegistry').withIndex('by_medicine', (q) => q.eq('medicineId', medicine._id)).first()
      if (!registry) { failures.push(name + ': missing registry'); continue }
      if (registry.status !== 'verified') { failures.push(name + ': registry not verified'); continue }
      if (registry.imageUrl !== imageUrl || registry.imageUrl !== medicine.imageUrl) failures.push(name + ': registry image mismatch')
    }
    if (failures.length) throw new Error('Production image gate failed: ' + failures.join('; '))
    return null
  },
})

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
