import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const ADMIN_EMAIL = 'adnayyar786@gmail.com'

async function currentRole(ctx: any) {
  const identity = await ctx.auth.getUserIdentity()
  const email = typeof identity?.email === 'string' ? identity.email.trim().toLowerCase() : ''
  if (!email) throw new Error('Please sign in with an authorized email account.')
  if (email === ADMIN_EMAIL) return { role: 'admin' as const, email }
  const staff = await ctx.db.query('staff').withIndex('by_email', q => q.eq('email', email)).first()
  if (staff?.active) return { role: 'staff' as const, email, name: staff.name }
  throw new Error('You do not have permission to access shop operations.')
}

async function requireShopAccess(ctx: any, shopId: any) {
  const actor = await currentRole(ctx)
  const shop = await ctx.db.get(shopId)
  if (!shop || !shop.active) throw new Error('Shop not found or inactive.')
  if (actor.role === 'staff' && !shop.staffNames.includes(actor.name)) throw new Error('You are not assigned to this branch.')
  return { actor, shop }
}

const shopValidator = v.object({
  _id: v.id('shops'),
  _creationTime: v.number(),
  name: v.string(),
  address: v.string(),
  active: v.boolean(),
  staffNames: v.array(v.string()),
  createdAt: v.number(),
})

const shopSaleValidator = v.object({
  _id: v.id('shopSales'),
  _creationTime: v.number(),
  shopId: v.id('shops'),
  medicineId: v.id('medicines'),
  medicineName: v.string(),
  quantityTablets: v.number(),
  tabletsPerPack: v.number(),
  packPrice: v.number(),
  unitPrice: v.number(),
  lineTotal: v.number(),
  staffName: v.string(),
  paymentMethod: v.union(v.literal('cash'), v.literal('upi'), v.literal('card'), v.literal('other')),
  soldAt: v.number(),
  saleDay: v.string(),
})

export const list = query({ args: {}, returns: v.array(shopValidator), handler: async (ctx) => {
  const actor = await currentRole(ctx)
  const shops = await ctx.db.query('shops').withIndex('by_active', q => q.eq('active', true)).collect()
  return actor.role === 'admin' ? shops : shops.filter(s => s.staffNames.includes(actor.name))
} })

export const create = mutation({ args: { name: v.string(), address: v.string(), staffNames: v.array(v.string()) }, returns: v.id('shops'), handler: async (ctx, args) => {
  const actor = await currentRole(ctx)
  if (actor.role !== 'admin') throw new Error('Only the admin can create or configure branches.')
  const name = args.name.trim(), address = args.address.trim()
  if (!name || !address) throw new Error('Shop name and address are required.')
  const staffRows = await ctx.db.query('staff').withIndex('by_active', q => q.eq('active', true)).collect()
  const allowedNames = staffRows.filter(s => s.role !== 'admin').map(s => s.name)
  const staffNames = [...new Set(args.staffNames.map(s => s.trim()).filter(s => allowedNames.includes(s as any)))]
  return await ctx.db.insert('shops', { name, address, staffNames, active: true, createdAt: Date.now() })
} })

export const addSale = mutation({ args: { shopId: v.id('shops'), medicineId: v.id('medicines'), quantityTablets: v.number(), staffName: v.string(), paymentMethod: v.union(v.literal('cash'), v.literal('upi'), v.literal('card'), v.literal('other')) }, returns: v.id('shopSales'), handler: async (ctx, args) => {
  const { actor, shop } = await requireShopAccess(ctx, args.shopId)
  if (actor.role === 'staff' && args.staffName !== actor.name) throw new Error('Staff can only record sales under their own account.')
  if (actor.role === 'admin' && !shop.staffNames.includes(args.staffName)) throw new Error('Choose a staff member assigned to this branch.')
  const med = await ctx.db.get(args.medicineId)
  if (!med) throw new Error('Medicine not found.')
  const count = med.tabletsPerPack
  if (!count || count <= 0) throw new Error('Set tablets per pack for this medicine first.')
  if (!Number.isInteger(args.quantityTablets) || args.quantityTablets <= 0) throw new Error('Enter a whole tablet quantity.')
  const unitPrice = med.price / count
  const now = Date.now(), d = new Date(now)
  const saleDay = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  return await ctx.db.insert('shopSales', { shopId: shop._id, medicineId: med._id, medicineName: med.name, quantityTablets: args.quantityTablets, tabletsPerPack: count, packPrice: med.price, unitPrice, lineTotal: Number((unitPrice * args.quantityTablets).toFixed(2)), staffName: actor.role === 'staff' ? actor.name : args.staffName.trim(), paymentMethod: args.paymentMethod, soldAt: now, saleDay })
} })

export const daySales = query({ args: { shopId: v.id('shops'), saleDay: v.string() }, returns: v.array(shopSaleValidator), handler: async (ctx, args) => {
  const { actor } = await requireShopAccess(ctx, args.shopId)
  const rows = await ctx.db.query('shopSales').withIndex('by_shop_day', q => q.eq('shopId', args.shopId).eq('saleDay', args.saleDay)).order('desc').collect()
  return actor.role === 'admin' ? rows : rows.filter(s => s.staffName === actor.name)
} })

export const setPackSize = mutation({ args: { medicineId: v.id('medicines'), tabletsPerPack: v.number() }, returns: v.null(), handler: async (ctx, args) => {
  const actor = await currentRole(ctx)
  if (actor.role !== 'admin') throw new Error('Only the admin can change medicine pack settings.')
  if (!Number.isInteger(args.tabletsPerPack) || args.tabletsPerPack <= 0) throw new Error('Tablet count must be a positive whole number.')
  const med = await ctx.db.get(args.medicineId)
  if (!med) throw new Error('Medicine not found.')
  await ctx.db.patch(args.medicineId, { tabletsPerPack: args.tabletsPerPack })
  return null
} })
