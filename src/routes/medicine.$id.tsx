import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Heart, Lock, Minus, Plus, ShieldCheck, Store, Truck } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
          <Link to="/" className="inline-flex items-center gap-1 py-2 pr-3 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-4" /> Back
          </Link>
          <BrandLogo />
          <button onClick={() => toggle(med._id)} aria-label="Save to wishlist" className="flex size-10 items-center justify-center rounded-full hover:bg-secondary">
            <Heart className={cn('size-5', saved ? 'fill-highlight text-highlight' : 'text-muted-foreground')} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pb-44 pt-4 lg:pb-12">
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="py-1.5 hover:text-foreground">
            Home
          </Link>
          <span aria-hidden="true">›</span>
          <span>{shopCategory}</span>
          <span aria-hidden="true">›</span>
          <span className="line-clamp-1 font-medium text-foreground">{med.name}</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:sticky lg:top-20 lg:self-start"
          >
            <ProductImage
              category={med.category}
              shopCategory={med.shopCategory}
              imageUrl={med.imageUrl}
              alt={med.name}
              className="rounded-2xl"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.06 }}>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold leading-snug sm:text-2xl">{med.name}</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {med.category} · {shopCategory}
            </p>
            {med.requiresPrescription && (
              <Badge
                variant="outline"
                className="mt-2 border-highlight/50 bg-highlight/10 text-highlight-foreground"
              >
                Prescription Required
              </Badge>
            )}

            <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-3xl font-bold text-primary">{formatINR(med.price)}</span>
              {mrp && (
                <>
                  <span className="text-sm text-muted-foreground line-through">MRP {formatINR(mrp)}</span>
                  <span className="rounded-md bg-brand-teal px-2 py-0.5 text-xs font-bold text-white">
                    {discountPct}% OFF
                  </span>
                </>
              )}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-sm">
              <span className={cn('size-2 rounded-full', out ? 'bg-destructive' : 'bg-emerald-500')} aria-hidden="true" />
              <span className={out ? 'font-medium text-destructive' : 'font-medium text-emerald-700'}>
                {out ? 'Out of stock' : med.stock <= 5 ? `Only ${med.stock} left` : 'In stock'}
              </span>
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5 text-xs text-secondary-foreground">
              <Truck className="size-4 shrink-0" />
              Pickup ready today · Delivery by {estimatedDelivery('delivery')}
            </div>

            {!out && (
              <div className="mt-5 flex items-center gap-3">
                <span className="text-sm font-medium">Quantity</span>
                <div className="inline-flex items-center rounded-xl border border-border bg-card">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                    disabled={qty <= 1}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
                    {qty}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                    disabled={qty >= maxQty}
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 hidden gap-3 lg:flex">{purchaseButtons}</div>

            <ul className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-muted-foreground">
              <li className="rounded-xl border border-border bg-card px-2 py-2.5">
                <ShieldCheck className="mx-auto mb-1 size-4 text-brand-teal" /> Licensed Pharmacy
              </li>
              <li className="rounded-xl border border-border bg-card px-2 py-2.5">
                <Store className="mx-auto mb-1 size-4 text-brand-teal" /> Pickup or Delivery
              </li>
              <li className="rounded-xl border border-border bg-card px-2 py-2.5">
                <Lock className="mx-auto mb-1 size-4 text-brand-teal" /> Secure Payments
              </li>
            </ul>

            {med.description && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold">About this product</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{med.description}</p>
              </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              For dosage, usage and interactions, please consult our pharmacist or your doctor.
            </p>
          </motion.div>
        </div>

        {related.length > 0 && (
          <section className="mt-10" aria-label="You may also like">
            <SectionHeading title="You may also like" subtitle={`More from ${shopCategory}`} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((r) => (
                <ProductCard key={r._id} med={r} onAdd={addRelated} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-16 z-10 border-t border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-5xl gap-3">{purchaseButtons}</div>
      </div>

      <div className="bg-navy pb-20 lg:pb-0">
        <SiteFooter />
      </div>
    </div>
  )
}
