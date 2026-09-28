import { createFileRoute, Link } from '@tanstack/react-router'
import { usePaginatedQuery } from 'convex/react'
import { useMemo } from 'react'
import { Heart } from 'lucide-react'

import { api } from '../../convex/_generated/api'
import { useWishlist } from '@/hooks/use-wishlist'
import { useCart } from '@/hooks/use-cart'
import { fireCartToast } from '@/components/cart-confirmation-toast'
import { BrandLogo, SectionHeading, SiteFooter } from '@/components/brand'
import { ProductCard, ProductCardSkeleton, type ProductCardMed } from '@/components/product-card'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/wishlist')({
  head: () => ({ meta: [{ title: 'Wishlist — Wellcare Medicose' }] }),
  component: WishlistPage,
})

function WishlistPage() {
  const { ids, toggle } = useWishlist()
  const { addToCart } = useCart()
  const { results: medicines, status } = usePaginatedQuery(api.medicines.list, {}, { initialNumItems: 300 })
  const saved = useMemo(() => medicines.filter((m) => ids.includes(m._id)), [medicines, ids])

  function handleAdd(med: ProductCardMed) {
    let failed = false
    addToCart(med, (m) => {
      failed = true
      fireCartToast(m)
    })
    if (!failed) fireCartToast(`✓ Added to Cart — ${med.name}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <BrandLogo />
          <Link to="/" className="inline-block py-2 text-sm font-medium text-primary hover:underline">
            Continue shopping
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <SectionHeading level="h1" title="My Wishlist" subtitle="Products you saved for later." icon={<Heart className="size-5" />} />
        {status === 'LoadingFirstPage' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : saved.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
              <Heart className="size-6" />
            </span>
            <p className="text-sm font-medium">Nothing saved yet</p>
            <p className="text-xs text-muted-foreground">Tap the heart on a product to save it here.</p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link to="/">Browse products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {saved.map((med) => (
              <div key={med._id} className="flex flex-col gap-1.5">
                <ProductCard med={med} onAdd={handleAdd} />
                <button
                  onClick={() => toggle(med._id)}
                  className="text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
                >
                  Remove from wishlist
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
