import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { createPortal } from 'react-dom'
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Heart,
  Info,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Truck,
} from 'lucide-react'

import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useCart } from '@/hooks/use-cart'
import { useWishlist } from '@/hooks/use-wishlist'
import { trackRecentlyViewed } from '@/hooks/use-recently-viewed'
import { fireCartToast } from '@/components/cart-confirmation-toast'
import { BrandLogo } from '@/components/brand'
import { ProductCard, ProductImage, discountOf, formatINR, type ProductCardMed } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/medicine/$id')({
  head: () => ({ meta: [{ title: 'Product — Wellcare Medicose' }] }),
  component: MedicinePage,
})

function estimatedDelivery() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

const DEFAULT_SHOP_CATEGORY = 'Medicines (Branded)'

function PurchaseActionBar({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-x-0 bottom-16 z-[90] border-t border-white/80 bg-white/80 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-18px_45px_-28px_rgba(15,23,42,.65)] backdrop-blur-2xl lg:bottom-0">
      <div className="mx-auto flex w-full max-w-7xl gap-2 sm:gap-3">
        {children}
      </div>
    </div>,
    document.body,
  )
}

function MedicinePage() {
  const { id } = useParams({ from: '/medicine/$id' })
  const med = useQuery(api.medicines.getById, { id: id as Id<'medicines'> })
  const { results: allMedicines } = usePaginatedQuery(api.medicines.list, {}, { initialNumItems: 250 })
  const { addToCart } = useCart()
  const { isSaved, toggle } = useWishlist()
  const navigate = useNavigate()
  const recordView = useMutation(api.activity.recordProductView)
  const viewedRef = useRef<string | null>(null)
  const [qty, setQty] = useState(1)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (id) trackRecentlyViewed(id)
    if (id && viewedRef.current !== id) {
      viewedRef.current = id
      recordView({ medicineId: id as Id<'medicines'> }).catch(() => {})
    }
  }, [id, recordView])

  useEffect(() => setQty(1), [id])

  const related = useMemo(() => {
    if (!med) return []
    const sameCategory = allMedicines.filter(
      (m) =>
        m._id !== med._id &&
        m.active &&
        m.category === med.category &&
        (m.shopCategory ?? DEFAULT_SHOP_CATEGORY) === (med.shopCategory ?? DEFAULT_SHOP_CATEGORY),
    )
    const sameShop = allMedicines.filter(
      (m) =>
        m._id !== med._id &&
        m.active &&
        (m.shopCategory ?? DEFAULT_SHOP_CATEGORY) === (med.shopCategory ?? DEFAULT_SHOP_CATEGORY),
    )
    return [...sameCategory, ...sameShop].filter((item, index, list) => list.findIndex((x) => x._id === item._id) === index).slice(0, 8)
  }, [allMedicines, med])

  if (med === undefined) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="mb-5 h-8 w-28 rounded-full" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-[2rem]" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (med === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">This product isn't available anymore.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary underline">Back to home</Link>
      </div>
    )
  }

  const info = med as typeof med & {
    brand?: string
    saltComposition?: string
    salt?: string
    composition?: string
    strength?: string
    packSize?: string
    rating?: number
    reviewCount?: number
  }

  const { mrp, pct: discountPct } = discountOf(med.price, med.mrpPrice)
  const saved = isSaved(med._id)
  const out = med.stock <= 0
  const maxQty = Math.max(1, Math.min(med.stock, 10))
  const shopCategory = med.shopCategory ?? DEFAULT_SHOP_CATEGORY
  const brand = info.brand?.trim() || med.manufacturer?.trim() || 'Wellcare Medicose'
  const salt = info.saltComposition?.trim() || info.salt?.trim() || info.composition?.trim() || 'Not listed'
  const strength = info.strength?.trim() || 'Not listed'
  const packSize = info.packSize?.trim() || (med.tabletsPerPack ? `${med.tabletsPerPack} units` : 'Not listed')
  const rating = typeof info.rating === 'number' ? info.rating : null
  const reviewCount = typeof info.reviewCount === 'number' ? info.reviewCount : 0

  const sameSalt = salt !== 'Not listed'
    ? allMedicines.filter(
        (m: any) =>
          m._id !== med._id &&
          m.active &&
          String(m.saltComposition ?? m.salt ?? m.composition ?? '').trim().toLowerCase() === salt.toLowerCase(),
      ).slice(0, 6)
    : []

  const alternatives = sameSalt.length ? sameSalt : related.slice(0, 6)
  const frequentlyBought = [...sameSalt, ...related.filter((r) => !sameSalt.some((s) => s._id === r._id))].slice(0, 3)

  function handleAddToCart() {
    let failed = false
    for (let i = 0; i < qty; i++) {
      addToCart(med, (message) => {
        if (!failed) {
          failed = true
          fireCartToast(message)
        }
      })
      if (failed) break
    }
    if (!failed) fireCartToast(`✓ Added to Cart — ${qty > 1 ? `${qty} × ` : ''}${med.name}`)
    return !failed
  }

  function handleBuyNow() {
    if (handleAddToCart()) navigate({ to: '/checkout' })
  }

  function addRelated(item: ProductCardMed) {
    let failed = false
    addToCart(item, (message) => {
      failed = true
      fireCartToast(message)
    })
    if (!failed) fireCartToast(`✓ Added to Cart — ${item.name}`)
  }

  const purchaseButtons = (
    <>
      <Button variant="outline" size="lg" className="h-12 flex-1 rounded-2xl border-primary/25 bg-white/80 font-bold shadow-sm" disabled={out} onClick={handleAddToCart}>
        <ShoppingBag className="mr-2 size-4" /> Add to Cart
      </Button>
      <Button size="lg" className="h-12 flex-1 rounded-2xl bg-primary font-bold shadow-lg shadow-primary/20" disabled={out} onClick={handleBuyNow}>
        Buy Now <ArrowRight className="ml-2 size-4" />
      </Button>
    </>
  )

  const tabs = [
    ['overview', 'Overview'],
    ['composition', 'Composition'],
    ['uses', 'Uses & Benefits'],
    ['reviews', 'Reviews'],
    ['similar', 'Similar'],
  ] as const

  const trustItems = [
    [ShieldCheck, 'Genuine medicine', 'Verified catalogue'],
    [Store, 'Licensed pharmacy', 'Trusted dispensing'],
    [Lock, 'Secure payments', 'Protected checkout'],
    [Truck, 'Fast delivery', `From nearby stores`],
  ] as const

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#eef7f6] text-slate-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 size-80 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute -right-24 top-96 size-96 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-72 rounded-full bg-blue-300/15 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/65 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-3 py-2 text-sm font-semibold shadow-sm backdrop-blur-xl transition hover:bg-white">
            <ChevronLeft className="size-4" /> Back
          </Link>
          <BrandLogo />
          <button
            type="button"
            onClick={() => toggle(med._id)}
            aria-label="Save to wishlist"
            className="flex size-10 items-center justify-center rounded-full border border-white/80 bg-white/65 shadow-sm backdrop-blur-xl"
          >
            <Heart className={cn('size-5', saved ? 'fill-highlight text-highlight' : 'text-slate-500')} />
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-44 pt-5 sm:px-6 lg:pb-16">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span>{shopCategory}</span>
          <span>/</span>
          <span className="font-semibold text-slate-800">{med.name}</span>
        </nav>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/80 bg-white/60 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-primary shadow-sm backdrop-blur-xl">Product details</span>
          <span className="rounded-full border border-emerald-200/70 bg-emerald-50/75 px-3 py-1.5 text-[11px] font-bold text-emerald-700">Genuine & pharmacy verified</span>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/55 p-3 shadow-[0_30px_90px_-45px_rgba(15,118,110,.55)] backdrop-blur-2xl sm:p-5 lg:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,.9),transparent_30%),linear-gradient(135deg,rgba(255,255,255,.5),rgba(255,255,255,.12))]" />

          <div className="relative grid gap-7 lg:grid-cols-[minmax(0,.95fr)_minmax(0,1.05fr)] lg:gap-10">
            <motion.div className="min-w-0 lg:sticky lg:top-24 lg:self-start" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/90 bg-white/75 p-3 shadow-inner backdrop-blur-xl">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(20,184,166,.13),transparent_38%)]" />
                <div className="relative flex min-h-[360px] items-center justify-center rounded-[1.35rem] border border-white/90 bg-gradient-to-br from-white via-white/80 to-emerald-50/60 p-5 sm:min-h-[470px]">
                  <div className="pointer-events-none absolute left-5 top-5 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 backdrop-blur">
                    100% genuine
                  </div>
                  <div className="pointer-events-none absolute right-5 top-5 flex size-12 items-center justify-center rounded-2xl border border-white bg-white/70 shadow-lg backdrop-blur-xl">
                    <ShieldCheck className="size-6 text-primary" />
                  </div>
                  <motion.div
                    className="absolute size-64 rounded-full border border-emerald-200/60"
                    animate={{ scale: [1, 1.04, 1], opacity: [0.55, 0.8, 0.55] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="relative w-full max-w-[420px]">
                    <ProductImage category={med.category} shopCategory={med.shopCategory} imageUrl={med.imageUrl} alt={med.name} className="rounded-3xl drop-shadow-[0_24px_30px_rgba(15,23,42,.18)]" />
                  </div>
                  <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/90 bg-white/70 px-4 py-3 shadow-lg backdrop-blur-xl">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pharmacy grade</p>
                      <p className="text-xs font-black text-slate-800">Quality checked</p>
                    </div>
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Check className="size-5" /></div>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {trustItems.map(([Icon, title, subtitle]) => (
                  <div key={title} className="rounded-2xl border border-white/90 bg-white/60 p-3 text-center shadow-sm backdrop-blur-xl">
                    <div className="mx-auto flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></div>
                    <p className="mt-2 text-[10px] font-black leading-tight text-slate-700">{title}</p>
                    <p className="mt-1 text-[9px] font-medium leading-tight text-slate-400">{subtitle}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div className="min-w-0" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl border border-white bg-gradient-to-br from-primary/15 to-cyan-100/70 text-sm font-black text-primary shadow-sm">{brand.slice(0, 2).toUpperCase()}</span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{brand}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{med.manufacturer || 'Verified pharmacy catalogue'}</p>
                </div>
              </div>

              <h1 className="mt-4 max-w-3xl text-3xl font-black leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">{med.name}</h1>
              <p className="mt-3 text-sm font-medium text-slate-500">{med.category} · {shopCategory}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {med.requiresPrescription && <Badge variant="outline" className="rounded-full border-rose-200 bg-rose-50/80 px-3 py-1 text-rose-700">Prescription Required</Badge>}
                <span className="rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-bold text-emerald-700">{out ? 'Out of stock' : 'In stock'}</span>
                {rating !== null && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/80 px-3 py-1 text-xs font-bold text-amber-700">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" /> {rating.toFixed(1)} {reviewCount ? `· ${reviewCount} reviews` : ''}
                  </span>
                )}
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-white/90 bg-white/65 p-5 shadow-sm backdrop-blur-xl">
                <div className="flex flex-wrap items-end gap-3">
                  <span className="text-4xl font-black tracking-tight text-primary">{formatINR(med.price)}</span>
                  {mrp && <span className="pb-1 text-sm font-medium text-slate-400 line-through">MRP {formatINR(mrp)}</span>}
                  {discountPct !== null && <span className="mb-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-black text-white">{discountPct}% OFF</span>}
                </div>
                <p className={cn('mt-2 text-xs font-bold', out ? 'text-destructive' : 'text-emerald-700')}>
                  {out ? 'Currently unavailable' : med.stock <= 5 ? `Only ${med.stock} left in stock` : 'Available for delivery and pickup'}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['Brand', brand],
                  ['Salt / composition', salt],
                  ['Strength', strength],
                  ['Pack size', packSize],
                ].map(([label, value]) => (
                  <div key={label} className="min-h-[94px] rounded-2xl border border-white/90 bg-white/55 p-3 shadow-sm backdrop-blur-xl">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="mt-2 line-clamp-4 text-xs font-bold leading-snug text-slate-800">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-primary/10 bg-primary/5 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Truck className="size-5" /></div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800">Fast local delivery</p>
                    <p className="mt-1 text-xs text-slate-500">Expected delivery by {estimatedDelivery()} · Pickup available where supported</p>
                  </div>
                </div>
              </div>

              {!out && (
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/90 bg-white/55 p-3 shadow-sm backdrop-blur-xl">
                  <span className="text-sm font-black">Quantity</span>
                  <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white/80 shadow-sm">
                    <button type="button" aria-label="Decrease quantity" className="flex size-10 items-center justify-center disabled:opacity-40" disabled={qty <= 1} onClick={() => setQty((value) => Math.max(1, value - 1))}><Minus className="size-4" /></button>
                    <span className="w-10 text-center text-sm font-black">{qty}</span>
                    <button type="button" aria-label="Increase quantity" className="flex size-10 items-center justify-center disabled:opacity-40" disabled={qty >= maxQty} onClick={() => setQty((value) => Math.min(maxQty, value + 1))}><Plus className="size-4" /></button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        </section>

        <div className="sticky top-16 z-30 mt-5 overflow-x-auto rounded-2xl border border-white/80 bg-white/65 p-1.5 shadow-lg backdrop-blur-2xl">
          <div className="flex min-w-max gap-1">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveTab(key)
                  document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className={cn(
                  'rounded-xl px-4 py-2.5 text-xs font-black transition sm:px-5',
                  activeTab === key ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:bg-white/80 hover:text-slate-800',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <section id="section-overview" className="scroll-mt-28 mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,.65fr)]">
          <div className="space-y-5">
            <article className="rounded-[1.75rem] border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-2xl sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Info className="size-5" /></div>
                <div><p className="text-[10px] font-black uppercase tracking-wider text-primary">Overview</p><h2 className="text-xl font-black">About this medicine</h2></div>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-600">{med.description || 'Product information will be updated by the pharmacy team.'}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ['Category', med.category],
                  ['Manufacturer', med.manufacturer || 'Not listed'],
                  ['Prescription', med.requiresPrescription ? 'Required' : 'Not required'],
                  ['Availability', out ? 'Currently unavailable' : 'Available'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white bg-white/55 p-4 backdrop-blur-xl">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="mt-1.5 text-sm font-bold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            </article>

            <article id="section-composition" className="scroll-mt-28 rounded-[1.75rem] border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-2xl sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700"><CheckCircle2 className="size-5" /></div>
                <div><p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Composition</p><h2 className="text-xl font-black">Key medicine details</h2></div>
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-white bg-white/55">
                {[
                  ['Salt / composition', salt],
                  ['Strength', strength],
                  ['Dosage form', med.category || 'Not listed'],
                  ['Pack size', packSize],
                  ['Brand', brand],
                ].map(([label, value], index) => (
                  <div key={label} className={cn('grid gap-2 px-4 py-3.5 sm:grid-cols-[180px_1fr]', index ? 'border-t border-slate-200/60' : '')}>
                    <span className="text-xs font-bold text-slate-400">{label}</span>
                    <span className="text-sm font-black text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
            </article>

            <article id="section-uses" className="scroll-mt-28 rounded-[1.75rem] border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-2xl sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-700"><Info className="size-5" /></div>
                  <div><p className="text-[10px] font-black uppercase tracking-wider text-cyan-700">Guidance</p><h2 className="text-xl font-black">Uses & benefits</h2></div>
                </div>
                <ChevronDown className="size-5 text-slate-400" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  'Follow the dosage and directions on the label.',
                  'Use only for the indication advised by a qualified professional.',
                  'Ask a pharmacist about interactions or precautions.',
                  'Keep medicines stored according to the package instructions.',
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-white bg-white/55 p-4">
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700"><Check className="size-3.5" /></div>
                    <p className="text-xs font-semibold leading-5 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-2xl bg-amber-50/70 p-4 text-xs leading-5 text-amber-800">For dosage, interactions, pregnancy, allergies, or condition-specific advice, consult a qualified doctor or pharmacist.</p>
            </article>

            <article id="section-similar" className="scroll-mt-28 rounded-[1.75rem] border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-2xl sm:p-6">
              <div className="flex items-end justify-between gap-3">
                <div><p className="text-[10px] font-black uppercase tracking-wider text-primary">Smart alternatives</p><h2 className="text-xl font-black">{sameSalt.length ? 'Same salt medicines' : 'Related medicines'}</h2><p className="mt-1 text-xs text-slate-500">{sameSalt.length ? 'Other brands with the same composition.' : 'More products from the same catalogue category.'}</p></div>
                <ArrowRight className="size-5 text-primary" />
              </div>
              {alternatives.length ? (
                <div className="mt-5 flex min-w-0 gap-3 overflow-x-auto pb-2">
                  {alternatives.map((item) => <div key={item._id} className="w-52 shrink-0"><ProductCard med={item} onAdd={addRelated} variant="carousel" /></div>)}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl bg-white/60 p-4 text-sm text-slate-500">No alternatives are listed yet.</p>
              )}
            </article>
          </div>

          <aside className="space-y-5">
            <article id="section-reviews" className="scroll-mt-28 rounded-[1.75rem] border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-wider text-primary">Customer reviews</p>
              <h2 className="mt-1 text-xl font-black">Ratings & reviews</h2>
              <div className="mt-5 flex items-center gap-4 rounded-2xl border border-white bg-white/55 p-4">
                <div className="text-4xl font-black">{rating !== null ? rating.toFixed(1) : '—'}</div>
                <div>
                  <div className="flex gap-0.5">{[1,2,3,4,5].map((n) => <Star key={n} className={cn('size-4', rating !== null && n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />)}</div>
                  <p className="mt-1 text-xs text-slate-500">{reviewCount ? `${reviewCount} verified reviews` : 'No reviews yet'}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/40 p-4 text-xs leading-5 text-slate-500">Reviews are kept product-specific and can be connected to completed customer orders.</div>
            </article>

            <article className="rounded-[1.75rem] border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-2xl">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Frequently bought</p>
              <h2 className="mt-1 text-xl font-black">Often paired with</h2>
              {frequentlyBought.length ? (
                <div className="mt-4 space-y-3">
                  {frequentlyBought.map((item) => (
                    <div key={item._id} className="flex items-center gap-3 rounded-2xl border border-white bg-white/55 p-2.5">
                      <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-white"><ProductImage category={item.category} shopCategory={item.shopCategory} imageUrl={item.imageUrl} alt="" /></div>
                      <div className="min-w-0 flex-1"><p className="line-clamp-2 text-xs font-bold">{item.name}</p><p className="mt-1 text-xs font-black text-primary">{formatINR(item.price)}</p></div>
                      <Button size="sm" className="rounded-xl" disabled={item.stock <= 0} onClick={() => addRelated(item)}>Add</Button>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-4 text-sm text-slate-500">Pairing suggestions will appear as the catalogue grows.</p>}
            </article>

            <article className="rounded-[1.75rem] border border-white/80 bg-gradient-to-br from-primary/10 via-white/60 to-cyan-50/70 p-5 shadow-sm backdrop-blur-2xl">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20"><ShieldCheck className="size-6" /></div>
                <div><p className="text-xs font-black uppercase tracking-wider text-primary">Wellcare promise</p><h2 className="mt-1 text-lg font-black">Shop with confidence</h2></div>
              </div>
              <div className="mt-4 space-y-2">
                {['Genuine medicine catalogue', 'Secure checkout', 'Pharmacy-assisted support', 'Clear delivery information'].map((item) => <div key={item} className="flex items-center gap-2 rounded-xl bg-white/55 px-3 py-2.5 text-xs font-bold text-slate-700"><Check className="size-4 text-emerald-600" />{item}</div>)}
              </div>
            </article>
          </aside>
        </section>

        {related.length > 0 && (
          <section className="mt-5 rounded-[1.75rem] border border-white/80 bg-white/55 p-5 shadow-sm backdrop-blur-2xl sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-wider text-primary">More for you</p>
            <h2 className="mt-1 text-xl font-black">You may also like</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{related.map((item) => <ProductCard key={item._id} med={item} onAdd={addRelated} />)}</div>
          </section>
        )}
      </main>

      <PurchaseActionBar>{purchaseButtons}</PurchaseActionBar>
    </div>
  )
}
