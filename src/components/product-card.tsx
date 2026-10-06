import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Bandage,
  Droplet,
  Droplets,
  FlaskConical,
  Heart,
  Package,
  PawPrint,
  Pill,
  SprayCan,
  Syringe,
  Wind,
} from 'lucide-react'

import type { Id } from '../../convex/_generated/dataModel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguage } from '@/hooks/use-language'
import { useWishlist } from '@/hooks/use-wishlist'
import { cn } from '@/lib/utils'

// ONE product card used everywhere (home, sections, carousels, related products).

export type ProductCardMed = {
  _id: Id<'medicines'>
  name: string
  category: string
  shopCategory?: string
  price: number
  mrpPrice?: number
  stock: number
  imageUrl?: string
  requiresPrescription: boolean
}

export function formatINR(n: number) {
  return `₹${n.toFixed(2)}`
}

export function discountOf(price: number, mrpPrice?: number) {
  const mrp = mrpPrice && mrpPrice > price ? mrpPrice : null
  return { mrp, pct: mrp ? Math.round(((mrp - price) / mrp) * 100) : null }
}

const CATEGORY_ICON: Record<string, typeof Pill> = {
  Tablet: Pill,
  Capsule: Pill,
  Syrup: FlaskConical,
  Solution: FlaskConical,
  Suspension: FlaskConical,
  Gel: Droplets,
  Cream: Droplets,
  Ointment: Bandage,
  Drops: Droplet,
  Oil: Droplet,
  Injection: Syringe,
  Powder: Package,
  Inhaler: Wind,
  Spray: SprayCan,
  Lozenges: Pill,
  Suppository: Package,
}

// Product photo on a clean white surface (never cropped or tinted), or a
// category icon when the product has no photo yet.
export function ProductImage({
  category,
  shopCategory,
  imageUrl,
  alt,
  className,
}: {
  category: string
  shopCategory?: string
  imageUrl?: string
  alt: string
  className?: string
}) {
  const [loaded, setLoaded] = useState(false)
  if (imageUrl) {
    return (
      <div className={cn('relative aspect-square w-full overflow-hidden rounded-xl bg-white ring-1 ring-border', className)}>
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={cn('h-full w-full object-contain p-2 transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
        />
      </div>
    )
  }
  const Icon = shopCategory === 'Pet Care' ? PawPrint : (CATEGORY_ICON[category] ?? Pill)
  return (
    <div
      className={cn(
        'flex aspect-square w-full items-center justify-center rounded-xl bg-gradient-to-br from-secondary to-accent ring-1 ring-border',
        className,
      )}
    >
      <Icon className="size-10 text-primary/60" strokeWidth={1.5} aria-hidden="true" />
    </div>
  )
}

export function ProductCardSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'carousel' }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-3',
        variant === 'carousel' && 'w-44 shrink-0 sm:w-52',
      )}
    >
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
      <Skeleton className="mt-3 h-9 w-full" />
    </div>
  )
}

export function ProductCard({
  med,
  onAdd,
  variant = 'grid',
  label,
}: {
  med: ProductCardMed
  onAdd: (med: ProductCardMed) => void
  variant?: 'grid' | 'carousel'
  label?: string
}) {
  const { t } = useLanguage()
  const { isSaved, toggle } = useWishlist()
  const saved = isSaved(med._id)
  const { mrp, pct } = discountOf(med.price, med.mrpPrice)
  const out = med.stock <= 0

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out [transform:perspective(1000px)_translateZ(0)] hover:-translate-y-1 hover:rotate-x-[1deg] hover:rotate-y-[-1deg] hover:border-primary/40 hover:shadow-[0_16px_34px_-18px_rgba(15,60,75,0.42)] motion-reduce:transform-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:rotate-0',
        variant === 'carousel' && 'w-44 shrink-0 snap-start sm:w-52',
      )}
    >
      <Link to="/medicine/$id" params={{ id: med._id }} className="relative block p-2.5 pb-0">
        <ProductImage category={med.category} shopCategory={med.shopCategory} imageUrl={med.imageUrl} alt={med.name} />
        {pct !== null && (
          <span className="absolute left-4 top-4 rounded-md bg-brand-teal px-1.5 py-0.5 text-[10px] font-bold text-white">
            {pct}% OFF
          </span>
        )}
        {label && (
          <span className="absolute bottom-1 left-4 rounded-md bg-navy px-1.5 py-0.5 text-[10px] font-semibold text-navy-foreground">
            {label}
          </span>
        )}
      </Link>
      <button
        type="button"
        aria-label={saved ? `Remove ${med.name} from wishlist` : `Save ${med.name} to wishlist`}
        aria-pressed={saved}
        onClick={() => toggle(med._id)}
        className="absolute right-3.5 top-3.5 flex size-9 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-border transition duration-200 hover:scale-105 hover:bg-white active:scale-95 motion-reduce:transform-none"
      >
        <Heart className={cn('size-4', saved ? 'fill-highlight text-highlight' : 'text-muted-foreground')} />
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link to="/medicine/$id" params={{ id: med._id }}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
            {med.name}
          </h3>
        </Link>
        <p className="truncate text-xs text-muted-foreground">{med.category}</p>
        {med.requiresPrescription && (
          <Badge
            variant="outline"
            className="w-fit border-highlight/50 bg-highlight/10 text-[10px] font-medium text-highlight-foreground"
          >
            Prescription Required
          </Badge>
        )}

        <div className="mt-auto flex flex-wrap items-baseline gap-x-1.5 pt-1">
          <span className="text-base font-bold text-primary">{formatINR(med.price)}</span>
          {mrp && <span className="text-xs text-muted-foreground line-through">{formatINR(mrp)}</span>}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn('size-1.5 rounded-full', out ? 'bg-destructive' : 'bg-emerald-500')} aria-hidden="true" />
          {out ? t('out_of_stock') : med.stock <= 5 ? `Only ${med.stock} left` : 'In stock'}
        </p>
        <Button size="sm" className="mt-1 w-full rounded-xl bg-gradient-to-r from-primary to-brand-teal font-extrabold shadow-[0_8px_18px_-10px_rgba(15,118,110,0.75)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_22px_-10px_rgba(15,118,110,0.85)] active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none" disabled={out} onClick={() => onAdd(med)}>
          {out ? t('out_of_stock') : t('add_to_cart')}
        </Button>
      </div>
    </article>
  )
}
