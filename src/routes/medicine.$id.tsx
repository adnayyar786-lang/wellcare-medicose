import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ChevronLeft, Heart, Info, Lock, Minus, Plus, ShieldCheck, ShoppingBag, Star, Store, Truck } from 'lucide-react'

import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useCart } from '@/hooks/use-cart'
import { useWishlist } from '@/hooks/use-wishlist'
import { trackRecentlyViewed } from '@/hooks/use-recently-viewed'
import { fireCartToast } from '@/components/cart-confirmation-toast'
import { BrandLogo, SectionHeading, SiteFooter } from '@/components/brand'
import { ProductCard, ProductImage, discountOf, formatINR, type ProductCardMed } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { HERO_BACKGROUND_IMAGE } from '@/config/hero-image'

export const Route = createFileRoute('/medicine/$id')({
  head: () => ({ meta: [{ title: 'Product — Wellcare Medicose' }] }),
  component: MedicinePage,
})

function estimatedDelivery(fulfillment: 'pickup' | 'delivery') {
  const days = fulfillment === 'pickup' ? 0 : 1
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

const DEFAULT_SHOP_CATEGORY = 'Medicines (Branded)'

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

  useEffect(() => {
    if (id) trackRecentlyViewed(id)
    if (id && viewedRef.current !== id) {
      viewedRef.current = id
      recordView({ medicineId: id as Id<'medicines'> }).catch(() => {})
    }
  }, [id, recordView])

  useEffect(() => {
    setQty(1)
  }, [id])

  const related = useMemo(() => {
    if (!med) return []
    const sameForm = allMedicines.filter(
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
        (m.shopCategory ?? DEFAULT_SHOP_CATEGORY) === (med.shopCategory ?? DEFAULT_SHOP_CATEGORY) &&
        m.category !== med.category,
    )
    return [...sameForm, ...sameShop].slice(0, 8)
  }, [allMedicines, med])

  function addRelated(r: ProductCardMed) {
    let failed = false
    addToCart(r, (m) => {
      failed = true
      fireCartToast(m)
    })
    if (!failed) fireCartToast(`✓ Added to Cart — ${r.name}`)
  }

  if (med === undefined) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Skeleton className="mb-4 h-6 w-24" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div>
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="mt-3 h-4 w-1/2" />
            <Skeleton className="mt-6 h-9 w-1/3" />
            <Skeleton className="mt-6 h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (med === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">This product isn't available anymore.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-primary underline">
          Back to home
        </Link>
      </div>
    )
  }

  const { mrp, pct: discountPct } = discountOf(med.price, med.mrpPrice)
  const saved = isSaved(med._id)
  const shopCategory = med.shopCategory ?? DEFAULT_SHOP_CATEGORY
  const out = med.stock <= 0
  const maxQty = Math.max(1, Math.min(med.stock, 10))

  function handleAddToCart() {
    let failed = false
    for (let i = 0; i < qty; i++) {
      addToCart(med!, (m) => {
        if (!failed) {
          failed = true
          fireCartToast(m)
        }
      })
      if (failed) break
    }
    if (!failed) fireCartToast(`✓ Added to Cart — ${qty > 1 ? `${qty} × ` : ''}${med!.name}`)
    return !failed
  }

  function handleBuyNow() {
    if (handleAddToCart()) {
      navigate({ to: '/checkout' })
    }
  }

  const purchaseButtons = (
    <>
      <Button variant="outline" size="lg" className="flex-1" disabled={out} onClick={handleAddToCart}>
        Add to Cart
      </Button>
      <Button size="lg" className="flex-1" disabled={out} onClick={handleBuyNow}>
        Buy Now
      </Button>
    </>
  )

  const info = med as typeof med & { brand?: string; saltComposition?: string; salt?: string; composition?: string; strength?: string; packSize?: string; rating?: number; reviewCount?: number }
  const brand = info.brand?.trim() || med.manufacturer?.trim() || 'Wellcare Medicose'
  const salt = info.saltComposition?.trim() || info.salt?.trim() || info.composition?.trim() || 'Not listed'
  const strength = info.strength?.trim() || 'Not listed'
  const packSize = info.packSize?.trim() || (med.tabletsPerPack ? `${med.tabletsPerPack} units` : 'Not listed')
  const rating = typeof info.rating === 'number' ? info.rating : null
  const reviewCount = typeof info.reviewCount === 'number' ? info.reviewCount : 0
  const sameSalt = salt !== 'Not listed'
    ? allMedicines.filter((m: any) => m._id !== med._id && m.active && String(m.saltComposition ?? m.salt ?? m.composition ?? '').trim().toLowerCase() === salt.toLowerCase()).slice(0, 6)
    : []
  const alternatives = sameSalt.length ? sameSalt : related.slice(0, 6)
  const frequentlyBought = [
    ...sameSalt,
    ...related.filter((r) => !sameSalt.some((s) => s._id === r._id)),
  ].slice(0, 3)
  const pairingLabel = sameSalt.length
    ? 'Same salt / composition options for the same treatment category'
    : 'Related options from the same treatment category'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ backgroundImage: `linear-gradient(rgba(248,250,252,0.91),rgba(248,250,252,0.97)),url(${HERO_BACKGROUND_IMAGE})`, backgroundAttachment: 'fixed', backgroundSize: 'cover', backgroundPosition: 'center top' }}>
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
          <Link to="/" className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm text-slate-600 hover:bg-white"><ChevronLeft className="size-4"/> Back</Link>
          <BrandLogo/>
          <button onClick={() => toggle(med._id)} aria-label="Save to wishlist" className="flex size-10 items-center justify-center rounded-full bg-white/80 shadow-sm ring-1 ring-slate-200"><Heart className={cn('size-5',saved?'fill-highlight text-highlight':'text-slate-500')}/></button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-44 pt-5 lg:pb-14">
        <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500"><Link to="/" className="hover:text-primary">Home</Link><span>›</span><span>{shopCategory}</span><span>›</span><span className="font-semibold text-slate-800">{med.name}</span></nav>

        <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 p-4 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-6 lg:p-8">
          <div className="grid gap-7 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
            <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border border-white bg-white/85 p-3 shadow-sm"><ProductImage category={med.category} shopCategory={med.shopCategory} imageUrl={med.imageUrl} alt={med.name} className="rounded-2xl"/></div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[[ 'Genuine Product',ShieldCheck ],[ 'Easy to Buy',ShoppingBag ],[ 'Pharma Assist',CheckCircle2 ],[ 'Secure Checkout',Lock ]].map(([label,Icon])=><div key={String(label)} className="rounded-2xl border border-white bg-white/75 px-2 py-3 text-center shadow-sm"><Icon className="mx-auto size-4 text-brand-teal"/><span className="mt-1 block text-[10px] font-bold leading-tight text-slate-600">{String(label)}</span></div>)}
              </div>
            </motion.div>

            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.05}}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-primary"><span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-black">{brand.slice(0,2).toUpperCase()}</span>{brand}</div>
              <h1 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">{med.name}</h1>
              <p className="mt-1.5 text-sm text-slate-500">{med.category} · {shopCategory}</p>
              {med.requiresPrescription && <Badge variant="outline" className="mt-3 border-highlight/50 bg-highlight/10 text-highlight-foreground">Prescription Required</Badge>}
              <div className="mt-5 flex flex-wrap items-end gap-3"><span className="text-3xl font-black text-primary">{formatINR(med.price)}</span>{mrp&&<span className="text-sm text-slate-500 line-through">MRP {formatINR(mrp)}</span>}{discountPct!==null&&<span className="rounded-lg bg-brand-teal px-2 py-1 text-xs font-black text-white">{discountPct}% OFF</span>}</div>
              <p className={cn('mt-2 text-sm font-semibold',out?'text-destructive':'text-emerald-700')}><span className={cn('mr-2 inline-block size-2 rounded-full',out?'bg-destructive':'bg-emerald-500')}/>{out?'Out of stock':med.stock<=5?`Only ${med.stock} left`:'In stock'}</p>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[[ 'Brand',brand ],[ 'Salt Composition',salt ],[ 'Strength',strength ],[ 'Pack Size',packSize ]].map(([label,value])=><div key={label} className="min-h-[82px] rounded-2xl border border-white/90 bg-white/65 p-3 shadow-sm backdrop-blur"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 line-clamp-3 text-xs font-bold leading-snug text-slate-800">{value}</p></div>)}
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-xs font-semibold text-slate-700"><Truck className="size-4 text-primary"/>Pickup ready today · Delivery by {estimatedDelivery('delivery')}</div>
              {!out&&<div className="mt-5 flex items-center gap-3"><span className="text-sm font-bold">Quantity</span><div className="inline-flex items-center rounded-xl border border-slate-200 bg-white"><button type="button" aria-label="Decrease quantity" className="flex size-10 items-center justify-center disabled:opacity-40" disabled={qty<=1} onClick={()=>setQty(q=>Math.max(1,q-1))}><Minus className="size-4"/></button><span className="w-8 text-center text-sm font-bold">{qty}</span><button type="button" aria-label="Increase quantity" className="flex size-10 items-center justify-center disabled:opacity-40" disabled={qty>=maxQty} onClick={()=>setQty(q=>Math.min(maxQty,q+1))}><Plus className="size-4"/></button></div></div>}
            </motion.div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          <div className="space-y-5">
            <article className="rounded-3xl border border-primary/10 bg-white/80 p-4 shadow-md backdrop-blur-xl sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">Ready to order?</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">Add this medicine to your cart or buy it now.</p>
                </div>
                <div className="flex w-full gap-2 sm:w-auto sm:min-w-[360px]">{purchaseButtons}</div>
              </div>
            </article>

            <article className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl sm:p-6">
              <div className="flex items-center gap-2">
                <Info className="size-5 text-primary" />
                <h2 className="text-lg font-black">Medicine Information</h2>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-extrabold">Description</h3>
                  <p className="mt-1.5 text-sm leading-7 text-slate-600">{med.description || 'Product information will be updated by the pharmacy team.'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">Key Information</h3>
                  <ul className="mt-1.5 space-y-2 text-sm leading-6 text-slate-600">
                    <li>• Category: {med.category}</li>
                    <li>• Brand: {brand}</li>
                    <li>• Prescription: {med.requiresPrescription ? 'Required' : 'Not required'}</li>
                    <li>• Stock: {out ? 'Currently unavailable' : 'Available'}</li>
                  </ul>
                </div>
              </div>
              <div className="mt-5 rounded-2xl bg-slate-50/80 p-4 text-sm leading-6 text-slate-600">
                <span className="font-bold text-slate-800">Uses & guidance:</span> Use only as directed on the label or by your doctor/pharmacist. For dosage, interactions or condition-specific advice, consult a qualified healthcare professional.
              </div>
            </article>

            <article className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl sm:p-6">
              <SectionHeading title="Same Salt Alternatives" subtitle={sameSalt.length ? 'Other products with the same composition' : 'Related options from the same medicine category'} />
              {alternatives.length ? (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                  {alternatives.map((r) => (
                    <div key={r._id} className="w-52 shrink-0">
                      <ProductCard med={r} onAdd={addRelated} variant="carousel" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No alternatives are listed yet.</p>
              )}
            </article>
          </div>

          <aside className="space-y-5">
            <article className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
              <SectionHeading title="Ratings & Reviews" subtitle={reviewCount ? `${reviewCount} customer reviews` : 'Customer feedback will appear here'} />
              <div className="mt-4 flex items-center gap-4 rounded-2xl bg-white/75 p-4">
                <div className="text-3xl font-black">{rating !== null ? rating.toFixed(1) : '—'}</div>
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={cn('size-4', rating !== null && n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{reviewCount ? `${reviewCount} verified reviews` : 'No reviews yet'}</p>
                </div>
              </div>
              <div className="mt-3 rounded-2xl border border-dashed border-slate-200 p-4 text-xs leading-5 text-slate-500">
                Reviews will be linked to completed customer orders so feedback stays product-specific.
              </div>
            </article>

            <article className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
              <SectionHeading title="Frequently Bought Together" subtitle={pairingLabel} />
              {frequentlyBought.length ? (
                <div className="mt-4 space-y-3">
                  {frequentlyBought.map((r) => (
                    <div key={r._id} className="flex items-center gap-3 rounded-2xl bg-white/75 p-2">
                      <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                        <ProductImage category={r.category} shopCategory={r.shopCategory} imageUrl={r.imageUrl} alt="" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-xs font-bold">{r.name}</p>
                        <p className="mt-1 text-xs font-black text-primary">{formatINR(r.price)}</p>
                      </div>
                      <Button size="sm" className="rounded-xl" disabled={r.stock <= 0} onClick={() => addRelated(r)}>Add</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Pairing suggestions will appear as the catalogue grows.</p>
              )}
            </article>
          </aside>
        </section>

        {related.length > 0 && (
          <section className="mt-6 rounded-3xl border border-white/80 bg-white/65 p-5 shadow-sm backdrop-blur-xl sm:p-6">
            <SectionHeading title="You may also like" subtitle={`More from ${shopCategory}`} />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((r) => <ProductCard key={r._id} med={r} onAdd={addRelated} />)}
            </div>
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-white/70 bg-white/90 px-4 py-3 shadow-[0_-12px_30px_-20px_rgba(15,23,42,0.5)] backdrop-blur-xl lg:hidden"><div className="mx-auto flex max-w-6xl gap-3">{purchaseButtons}</div></div>
      <div className="bg-navy pb-20 lg:pb-0"><SiteFooter/></div>
    </div>
  </div>
  )}
