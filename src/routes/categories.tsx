import { createFileRoute, Link } from '@tanstack/react-router'
import { usePaginatedQuery } from 'convex/react'
import { useMemo, useState } from 'react'
import { Pill, FlaskConical, ShieldCheck, PawPrint, ShoppingBasket, Baby, Sparkles, ChevronLeft, HeartPulse, Stethoscope, Leaf, ArrowUpRight, type LucideIcon } from 'lucide-react'

import { api } from '../../convex/_generated/api'
import { useCart } from '@/hooks/use-cart'
import { fireCartToast } from '@/components/cart-confirmation-toast'
import { BrandLogo, SectionHeading, SiteFooter } from '@/components/brand'
import { ProductCard, ProductCardSkeleton, type ProductCardMed } from '@/components/product-card'
import { ProductsErrorBoundary } from '@/components/products-error-boundary'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { manufacturerOf } from '@/config/brand-folders'

export const Route = createFileRoute('/categories')({
  head: () => ({ meta: [{ title: 'Browse Categories — Wellcare Medicose' }] }),
  component: CategoriesPage,
})

const DEFAULT_SHOP_CATEGORY = 'Medicines (Branded)'
const SHOP_CATEGORIES: Array<{ name: string; icon: LucideIcon; mark: string; blurb: string; gradient: string; ink: string; company?: string }> = [
  { name: 'Medicines (Branded)', icon: Pill, mark: 'Rx', blurb: 'Trusted branded tablets, capsules & syrups', gradient: 'from-blue-100 via-sky-50 to-cyan-100', ink: 'text-blue-800' },
  { name: 'Generic Medicines', icon: FlaskConical, mark: 'GM', blurb: 'Everyday generic medicine options', gradient: 'from-emerald-100 via-green-50 to-lime-100', ink: 'text-emerald-800' },
  { name: 'Mankind Products', icon: ShieldCheck, mark: 'MK', company: 'Mankind', blurb: 'Explore the Mankind Pharma range', gradient: 'from-violet-100 via-purple-50 to-fuchsia-100', ink: 'text-violet-800' },
  { name: "Dr. Reddy's Products", icon: HeartPulse, mark: 'DR', company: "Dr. Reddy's", blurb: "Browse Dr. Reddy's products", gradient: 'from-rose-100 via-pink-50 to-orange-100', ink: 'text-rose-800' },
  { name: 'Apollo Products', icon: ShieldCheck, mark: 'A', company: 'Apollo', blurb: 'Browse Apollo healthcare products', gradient: 'from-sky-100 via-cyan-50 to-blue-100', ink: 'text-sky-800' },
  { name: 'Cipla Products', icon: FlaskConical, mark: 'C', company: 'Cipla', blurb: 'Browse Cipla medicines and healthcare products', gradient: 'from-blue-100 via-indigo-50 to-cyan-100', ink: 'text-blue-800' },
  { name: 'Sun Pharma Products', icon: Pill, mark: 'SUN', company: 'Sun Pharma', blurb: 'Browse Sun Pharma medicines', gradient: 'from-orange-100 via-amber-50 to-yellow-100', ink: 'text-orange-800' },
  { name: 'Abbott Products', icon: HeartPulse, mark: 'A', company: 'Abbott', blurb: 'Browse Abbott healthcare products', gradient: 'from-sky-100 via-blue-50 to-indigo-100', ink: 'text-sky-800' },
  { name: 'Lupin Products', icon: Leaf, mark: 'L', company: 'Lupin', blurb: 'Browse Lupin medicines', gradient: 'from-emerald-100 via-teal-50 to-cyan-100', ink: 'text-emerald-800' },
  { name: 'Himalaya Products', icon: Leaf, mark: 'H', company: 'Himalaya', blurb: 'Browse Himalaya wellness products', gradient: 'from-green-100 via-emerald-50 to-lime-100', ink: 'text-green-800' },
  { name: 'Torrent Products', icon: ShieldCheck, mark: 'T', company: 'Torrent', blurb: 'Browse Torrent medicines', gradient: 'from-violet-100 via-purple-50 to-blue-100', ink: 'text-violet-800' },
  { name: 'Pfizer Products', icon: HeartPulse, mark: 'Pf', company: 'Pfizer', blurb: 'Browse Pfizer medicines', gradient: 'from-blue-100 via-sky-50 to-indigo-100', ink: 'text-blue-800' },
  { name: 'Glenmark Products', icon: ShieldCheck, mark: 'G', company: 'Glenmark', blurb: 'Browse Glenmark medicines', gradient: 'from-rose-100 via-red-50 to-orange-100', ink: 'text-rose-800' },
  { name: 'Zydus Products', icon: FlaskConical, mark: 'Z', company: 'Zydus', blurb: 'Browse Zydus medicines', gradient: 'from-purple-100 via-fuchsia-50 to-pink-100', ink: 'text-purple-800' },
  { name: 'Pet Care', icon: PawPrint, mark: 'PET', blurb: 'Food, veterinary medicines & accessories', gradient: 'from-amber-100 via-orange-50 to-yellow-100', ink: 'text-amber-900' },
  { name: 'Grocery / Health Supplements', icon: ShoppingBasket, mark: 'H+', blurb: 'Nutrition and daily wellness essentials', gradient: 'from-lime-100 via-green-50 to-teal-100', ink: 'text-green-900' },
  { name: 'Baby Care', icon: Baby, mark: 'BABY', blurb: 'Gentle care for babies and little ones', gradient: 'from-pink-100 via-rose-50 to-purple-100', ink: 'text-pink-800' },
  { name: 'Personal Care', icon: Sparkles, mark: 'PC', blurb: 'Skin, hair, hygiene & personal essentials', gradient: 'from-fuchsia-100 via-pink-50 to-sky-100', ink: 'text-fuchsia-800' },
]

type Sort = 'newest' | 'price-low' | 'price-high' | 'discount'

function CategoriesPage() {
  const { results: medicines, status } = usePaginatedQuery(api.medicines.list, {}, { initialNumItems: 300 })
  const { addToCart } = useCart()
  const [active, setActive] = useState<string | null>(null)
  const [form, setForm] = useState('All')
  const [sort, setSort] = useState<Sort>('newest')
  const counts = useMemo(() => {
    const c = new Map<string, number>()
    medicines.forEach((m) => {
      if (!m.active) return
      const shop = m.shopCategory ?? DEFAULT_SHOP_CATEGORY
      c.set(shop, (c.get(shop) ?? 0) + 1)
      const company = manufacturerOf(m)
      if (company) c.set(company, (c.get(company) ?? 0) + 1)
    })
    return c
  }, [medicines])
  const inCategory = useMemo(() => {
    if (!active) return []
    const definition = SHOP_CATEGORIES.find((category) => category.name === active)
    if (definition?.company) return medicines.filter((m) => m.active && manufacturerOf(m) === definition.company)
    return medicines.filter((m) => m.active && (m.shopCategory ?? DEFAULT_SHOP_CATEGORY) === active)
  }, [medicines, active])
  const forms = useMemo(() => ['All', ...Array.from(new Set(inCategory.map((m) => m.category))).sort()], [inCategory])
  const filtered = useMemo(() => {
    const list = inCategory.filter((m) => form === 'All' || m.category === form)
    const disc = (m: (typeof list)[number]) => (m.mrpPrice && m.mrpPrice > m.price ? (m.mrpPrice - m.price) / m.mrpPrice : 0)
    if (sort === 'price-low') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-high') return [...list].sort((a, b) => b.price - a.price)
    if (sort === 'discount') return [...list].sort((a, b) => disc(b) - disc(a))
    return list
  }, [inCategory, form, sort])
  function handleAdd(med: ProductCardMed) {
    let failed = false
    addToCart(med, (msg) => { failed = true; fireCartToast(msg) })
    if (!failed) fireCartToast(`✓ Added to Cart — ${med.name}`)
  }
  function openCategory(name: string) { setActive(name); setForm('All'); setSort('newest') }

  return <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        {active ? <button onClick={() => setActive(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="size-4" /> All categories</button> : <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="size-4" /> Home</Link>}
        <BrandLogo />
      </div>
    </header>

    {!active ? <main className="mx-auto max-w-6xl px-4 py-6 sm:py-9">
      <div className="mb-6 overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-5 shadow-sm sm:mb-8 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-teal"><HeartPulse className="size-4" /> Wellcare Medicose · Explore</div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Browse by category</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">Find the healthcare essentials you need, organized into clear departments for a smoother shopping experience.</p>
        <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full border border-white bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700"><ShieldCheck className="mr-1 inline size-3.5 text-emerald-600" /> Trusted selection</span><span className="rounded-full border border-white bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700"><Stethoscope className="mr-1 inline size-3.5 text-blue-700" /> Health & wellness</span><span className="rounded-full border border-white bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700"><Leaf className="mr-1 inline size-3.5 text-green-700" /> Everyday care</span></div>
      </div>
      <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">Shop departments</h2><p className="mt-1 text-xs text-muted-foreground sm:text-sm">Choose a department to view available products.</p></div><span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">{SHOP_CATEGORIES.length} categories</span></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {status === 'LoadingFirstPage' ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />) : SHOP_CATEGORIES.map(({ name, icon: Icon, mark, blurb, gradient, ink }) => <button key={name} onClick={() => openCategory(name)} className="group relative flex min-h-44 flex-col overflow-hidden rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-52 sm:p-5">
          <div className={cn('relative mb-3 flex h-24 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br sm:h-28', gradient)}>
            <span className="absolute -right-3 -top-6 size-24 rounded-full bg-white/45 blur-md" />
            <span className={cn('absolute left-3 top-3 rounded-lg border border-white/70 bg-white/75 px-2 py-1 text-[10px] font-black tracking-widest shadow-sm', ink)}>{mark}</span>
            <Icon className={cn('relative size-12 drop-shadow-sm transition-transform duration-200 group-hover:scale-110 sm:size-14', ink)} strokeWidth={1.6} aria-hidden="true" />
            <span className="absolute bottom-2 right-2 rounded-full bg-white/80 p-1.5 text-slate-700 shadow-sm"><ArrowUpRight className="size-4" /></span>
          </div>
          <div className="flex w-full items-start justify-between gap-2"><span className="text-sm font-bold leading-snug text-foreground sm:text-base">{name}</span><span className="mt-0.5 shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{counts.get(name) ?? 0}</span></div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">{blurb}</p>
          <span className="mt-auto pt-3 text-xs font-semibold text-primary">Explore category <span aria-hidden="true">→</span></span>
        </button>)}
      </div>
    </main> : <main className="mx-auto max-w-6xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-xs text-muted-foreground"><Link to="/" className="hover:text-foreground">Home</Link><span aria-hidden="true">›</span><button onClick={() => setActive(null)} className="hover:text-foreground">Categories</button><span aria-hidden="true">›</span><span className="font-medium text-foreground">{active}</span></nav>
      <SectionHeading level="h1" title={active} subtitle={status === 'LoadingFirstPage' ? undefined : `${filtered.length} product${filtered.length === 1 ? '' : 's'}`} action={<label className="flex items-center gap-2 text-xs text-muted-foreground">Sort by <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-9 rounded-lg border border-input bg-card px-2 text-xs text-foreground"><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="discount">Biggest discount</option></select></label>} />
      {forms.length > 2 && <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">{forms.map((f) => <button key={f} onClick={() => setForm(f)} aria-pressed={form === f} className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors', form === f ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/40')}>{f}</button>)}</div>}
      <ProductsErrorBoundary>{status === 'LoadingFirstPage' ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div> : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">No products in this category yet.</div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{filtered.map((med) => <ProductCard key={med._id} med={med} label={med.shopCategory === 'Pet Care' ? 'Veterinary' : undefined} onAdd={handleAdd} />)}</div>}</ProductsErrorBoundary>
    </main>}
    <SiteFooter />
  </div>
}
