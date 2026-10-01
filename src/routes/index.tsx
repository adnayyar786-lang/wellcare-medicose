import { createFileRoute, Link } from '@tanstack/react-router'
import { usePaginatedQuery, useQuery } from 'convex/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  Baby,
  Bell,
  HeartPulse, Dumbbell, Stethoscope, Leaf,
  Camera,
  FlaskConical,
  Languages,
  Lock,
  MapPin,
  Menu,
  Mic,
  PawPrint,
  Pill,
  PillBottle,
  Search,
  ShieldCheck,
  ShoppingBasket,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  Wind,
  Syringe,
} from 'lucide-react'

import { api } from '../../convex/_generated/api'
import { useCart } from '@/hooks/use-cart'
import { useLanguage } from '@/hooks/use-language'
import { getLastPhone, getRecentlyViewed } from '@/hooks/use-recently-viewed'
import { HERO_BACKGROUND_IMAGE } from '@/config/hero-image'
import { STORE_LOCATION } from '@/config/store-location'
import { OPEN_CART_EVENT } from '@/components/cart-drawer'
import { ProfileDrawer } from '@/components/profile-drawer'
import { DeliveryLocationBar } from '@/components/delivery-location-bar'
import { fireCartToast } from '@/components/cart-confirmation-toast'
import { BrandLogo, SectionHeading, SiteFooter, StoreInfoCards } from '@/components/brand'
import {
  ProductCard,
  ProductCardSkeleton,
  ProductImage,
  formatINR,
  type ProductCardMed,
} from '@/components/product-card'
import { ProductsErrorBoundary } from '@/components/products-error-boundary'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import siteMetadata from '../metadata.json'
import { allManufacturers, companyLogo, manufacturerOf } from '@/config/brand-folders'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: siteMetadata['/'].title },
      { name: 'description', content: siteMetadata['/'].description },
    ],
  }),
  component: Home,
})

// One page of 300 covers the whole catalogue today (262 products); "Load more"
// stays for when it grows.
const PAGE_SIZE = 300
const DEFAULT_SHOP_CATEGORY = 'Medicines (Branded)'

const SHOP_CATEGORIES: Array<{ name: string; icon: typeof Pill; mark: string }> = [
  { name: 'Medicines (Branded)', icon: Pill, mark: 'Rx' },
  { name: 'Generic Medicines', icon: FlaskConical, mark: 'GM' },
  { name: 'Mankind Products', icon: ShieldCheck, mark: 'MK' },
  { name: "Dr. Reddy's Products", icon: ShieldCheck, mark: 'DR' },
  { name: 'Pet Care', icon: PawPrint, mark: 'PET' },
  { name: 'Grocery / Health Supplements', icon: ShoppingBasket, mark: 'H+' },
  { name: 'Baby Care', icon: Baby, mark: 'BABY' },
  { name: 'Personal Care', icon: Sparkles, mark: 'PC' },
  { name: 'Medical Devices', icon: Stethoscope, mark: 'MD' },
  { name: 'Nutrition & Fitness', icon: Dumbbell, mark: 'NF' },
  { name: 'Mother & Child Care', icon: HeartPulse, mark: 'MC' },
  { name: 'Home Health Care', icon: ShieldCheck, mark: 'HC' },
  { name: 'Ayurveda & Herbal', icon: Leaf, mark: 'AH' },
]

export const BANNERS = [
  { title: 'Flat ₹100 off on first order', sub: 'Use code FIRST100 · min order ₹499', code: 'FIRST100' },
  { title: 'Free delivery above ₹499', sub: 'On every home delivery order', code: null },
  { title: '25% off with FIRST25', sub: 'Up to ₹150 off on orders above ₹199', code: 'FIRST25' },
]

const OFFER_TONES = ['from-primary to-brand-teal', 'from-brand-teal to-primary', 'from-navy to-primary']

function Carousel({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  )
}

function OfferCards() {
  const [banners, setBanners] = useState(BANNERS)
  useEffect(() => {
    try { const raw = window.localStorage.getItem('wellcare-promo-banners'); if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length === BANNERS.length && parsed.every((b) => typeof b.title === 'string' && typeof b.sub === 'string')) setBanners(parsed) } } catch { /* use built-in offers */ }
  }, [])
  function handleClick(code: string | null) {
    if (!code) return
    try {
      window.localStorage.setItem('wellcare-coupon', code)
    } catch {
      // ignore
    }
    toast.success(`Coupon ${code} saved — apply it in your cart`)
  }

  return (
    <section aria-label="Offers" className="mx-auto max-w-[1600px] px-4 py-6">
      <SectionHeading title="Offers for you" subtitle="Tap a coupon to save it, then apply it in your cart." />
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        {banners.map((b, i) => (
          <motion.button
            key={b.title}
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => handleClick(b.code)}
            className={cn(
              'w-72 shrink-0 snap-start rounded-2xl bg-gradient-to-br p-4 text-left text-white shadow-sm',
              OFFER_TONES[i % OFFER_TONES.length],
              !b.code && 'cursor-default',
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/75">{b.code ? 'Coupon offer' : 'Delivery offer'}</p>
            <p className="mt-1 text-base font-bold leading-snug">{b.title}</p>
            <p className="mt-1 text-xs text-white/85">{b.sub}</p>
            {b.code && <span className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wider ring-1 ring-white/30">Tap to save {b.code}</span>}
          </motion.button>
        ))}
      </div>
    </section>
  )
}

const TRUST_ITEMS = [
  { icon: ShieldCheck, title: 'Licensed Pharmacy', sub: 'Your trusted local store' },
  { icon: Truck, title: 'Home Delivery & Store Pickup', sub: 'Your choice at checkout' },
  { icon: PillBottle, title: 'Prescription medicines', sub: 'Clearly marked on each product' },
  { icon: Lock, title: 'Safe & Secure Payments', sub: 'Pay the way you prefer' },
]

const COMPANY_LOGO_STYLES: Record<string, string> = {
  "dr. reddy's": 'bg-violet-50 text-violet-700',
  'sun pharma': 'bg-orange-50 text-orange-600',
  cipla: 'bg-blue-50 text-blue-700',
  mankind: 'bg-indigo-50 text-indigo-700',
  abbott: 'bg-sky-50 text-sky-700',
  glenmark: 'bg-red-50 text-red-600',
  pfizer: 'bg-blue-50 text-blue-700',
  zydus: 'bg-purple-50 text-purple-700',
  alembic: 'bg-cyan-50 text-cyan-700',
  torrent: 'bg-violet-50 text-violet-800',
  himalaya: 'bg-emerald-50 text-emerald-700',
}

function companyLogoStyle(company: string) {
  return COMPANY_LOGO_STYLES[company.toLowerCase()] ?? 'bg-teal-50 text-teal-800'
}


function Home() {
  const { results: medicines, status, loadMore } = usePaginatedQuery(api.medicines.list, {}, { initialNumItems: PAGE_SIZE })
  const { count, addToCart } = useCart()
  const { t, lang, toggle: toggleLang } = useLanguage()
  const [search, setSearch] = useState('')
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const searchedMedicines = useQuery(
    api.medicines.search,
    search.trim().length >= 2 ? { query: search.trim() } : 'skip',
  )
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [activeShopCategory, setActiveShopCategory] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [visible, setVisible] = useState(24)
  const gridRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastPhone = getLastPhone()
  const lastOrder = useQuery(api.orders.findByPhone, lastPhone ? { phone: lastPhone } : 'skip')
  const recentIds = getRecentlyViewed()
  const shopOf = (m: { shopCategory?: string }) => m.shopCategory ?? DEFAULT_SHOP_CATEGORY

  // Prefer an explicitly documented salt/composition. If a catalogue entry only
  // has a generic medicine name, use its significant name token as a fallback
  // for finding related brands without claiming an unverified salt match.
  const extractComposition = (m: (typeof medicines)[number]) => {
    const text = `${m.description} ${m.name}`
    const labeled = text.match(/(?:salt|composition|active ingredient|active ingredients|contains)\\s*[:\\-]\\s*([^.;\\n]+)/i)?.[1]
    return labeled?.trim().toLowerCase() || null
  }

  const compositionKey = (m: (typeof medicines)[number]) => {
    const value = extractComposition(m)
    return value ? value.replace(/\\s+/g, ' ').trim() : null
  }

  const categories = useMemo(() => {
    const set = new Set<string>()
    medicines.forEach((m) => set.add(m.category))
    return ['All', ...Array.from(set).sort()]
  }, [medicines])

  const rankSearchResults = (items: typeof medicines, query: string) => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    const terms = q.split(/\s+/).filter(Boolean)
    return [...items].sort((a, b) => {
      const score = (m: (typeof medicines)[number]) => {
        const name = m.name.toLowerCase()
        const desc = m.description.toLowerCase()
        const allTerms = terms.every((term) => name.includes(term))
        const prefix = name.startsWith(q)
        const exact = name === q
        const phrase = name.includes(q)
        const wordStarts = terms.every((term) => name.split(/\s+/).some((word) => word.startsWith(term)))
        return (exact ? 1000 : 0) + (prefix ? 700 : 0) + (phrase ? 450 : 0) + (allTerms ? 300 : 0) + (wordStarts ? 180 : 0) + (desc.includes(q) ? 40 : 0) + (m.stock > 0 ? 5 : 0)
      }
      return score(b) - score(a)
    })
  }

  const filteredMedicines = useMemo(() => {
    const q = search.trim().toLowerCase()
    const source = q.length >= 2 ? (searchedMedicines ?? []) : medicines
    const items = source.filter((m) => {
      const matchesCategory = activeCategory === 'All' || m.category === activeCategory
      const matchesShop = !activeShopCategory || (m.shopCategory ?? DEFAULT_SHOP_CATEGORY) === activeShopCategory
      const matchesSearch = !q || m.name.toLowerCase().includes(q) || (m.manufacturer ?? '').toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
      return matchesCategory && matchesShop && matchesSearch
    })
    return rankSearchResults(items, q)
  }, [medicines, searchedMedicines, search, activeCategory, activeShopCategory])

  const sameComposition = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q || filteredMedicines.length === 0) return []
    const best = filteredMedicines[0]
    const key = compositionKey(best)
    if (!key) return []
    const keyWords = key.split(' ').filter((word) => word.length > 2)
    const source = searchedMedicines ?? medicines
    return source
      .filter((m) => m._id !== best._id && m.active)
      .filter((m) => {
        const other = compositionKey(m)
        if (!other) return false
        return other === key || keyWords.every((word) => other.includes(word))
      })
      .slice(0, 6)
  }, [medicines, searchedMedicines, search, filteredMedicines])

  const searchSuggestions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q.length < 2) return []
    const source = q.length >= 2 ? (searchedMedicines ?? []) : medicines
    const matches = source.filter((m) => {
      const name = m.name.toLowerCase()
      return name.includes(q) || q.split(/\s+/).every((term) => name.includes(term))
    })
    return rankSearchResults(matches, q).slice(0, 7)
  }, [medicines, searchedMedicines, search])

  const recentlyViewed = useMemo(() => recentIds.map((id) => medicines.find((m) => m._id === id)).filter(Boolean) as typeof medicines, [recentIds, medicines])
  const shopCounts = useMemo(() => {
    const counts = new Map<string, number>()
    medicines.forEach((m) => { if (m.active) counts.set(shopOf(m), (counts.get(shopOf(m)) ?? 0) + 1) })
    return counts
  }, [medicines])
  const featured = useMemo(() => {
    const pool = medicines.filter((m) => m.active && shopOf(m) !== 'Pet Care')
    return [...pool.filter((m) => m.imageUrl), ...pool.filter((m) => !m.imageUrl)].slice(0, 20)
  }, [medicines])
  const companyProducts = useMemo(() => medicines.filter((m) => m.active && shopOf(m) !== 'Pet Care'), [medicines])
  const manufacturers = useMemo(() => allManufacturers(companyProducts), [companyProducts])
  const manufacturerCounts = useMemo(() => {
    const counts = new Map<string, number>()
    companyProducts.forEach((m) => {
      const company = manufacturerOf(m)
      if (company) counts.set(company, (counts.get(company) ?? 0) + 1)
    })
    return counts
  }, [companyProducts])
  const heroProducts = useMemo(() => featured.filter((m) => m.imageUrl).slice(0, 3), [featured])
  const petProducts = useMemo(() => medicines.filter((m) => m.active && m.shopCategory === 'Pet Care').slice(0, 12), [medicines])
  const visibleShopCategories = SHOP_CATEGORIES
  const companyRailRef = useRef<HTMLDivElement>(null)
  const [companyAutoPaused, setCompanyAutoPaused] = useState(false)
  const AMAZON_NAV_ITEMS = ['Pharmacy', 'Latest', 'Petcare', 'Consult', 'Adult', 'Health', 'Health Plan'] as const
  const [activeAmazonNav, setActiveAmazonNav] = useState<(typeof AMAZON_NAV_ITEMS)[number]>('Pharmacy')

  useEffect(() => { setVisible(24) }, [search, activeCategory, activeShopCategory])

  useEffect(() => {
    if (manufacturers.length < 2 || companyAutoPaused) return
    const rail = companyRailRef.current
    if (!rail) return
    const timer = window.setInterval(() => {
      if (!rail.matches(':hover') && !companyAutoPaused && !rail.hasPointerCapture(1)) {
        rail.scrollLeft += 0.2
        const half = rail.scrollWidth / 2
        if (half > 0 && rail.scrollLeft >= half) rail.scrollLeft -= half
      }
    }, 50)
    return () => window.clearInterval(timer)
  }, [manufacturers.length, companyAutoPaused])
  const browsing = search.trim() !== '' || activeShopCategory !== null || activeCategory !== 'All'

  function selectShopCategory(name: string) {
    setActiveShopCategory((prev) => (prev === name ? null : name))
    setActiveCategory('All')
    requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  function clearFilters() { setSearch(''); setShowSearchSuggestions(false); setActiveCategory('All'); setActiveShopCategory(null) }
  function handleAmazonNav(item: (typeof AMAZON_NAV_ITEMS)[number]) {
    setActiveAmazonNav(item)
    if (item === 'Pharmacy') {
      clearFilters()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (item === 'Latest') {
      clearFilters()
      requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      return
    }
    if (item === 'Petcare') {
      setSearch('')
      setShowSearchSuggestions(false)
      setActiveCategory('All')
      setActiveShopCategory('Pet Care')
      requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      return
    }
    toast.info(item === 'Consult' ? 'Consultation section is coming soon.' : item === 'Adult' ? 'Adult Health section is coming soon.' : item === 'Health' ? 'Health section is coming soon.' : 'Health Plan section is coming soon.')
  }
  function scrollToProducts() { gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  function handleAddToCart(med: ProductCardMed) {
    let failed = false
    addToCart(med, (msg) => { failed = true; fireCartToast(msg) })
    if (!failed) fireCartToast(`✓ Added to Cart — ${med.name}`)
  }
  function handleCameraClick() { fileInputRef.current?.click() }
  function handlePhotoChosen() { toast.info('Photo search is coming soon — try typing the medicine name for now.') }
  function handleMicClick() {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) { toast.error('Voice search is not supported on this device/browser'); return }
    const recognition = new SpeechRecognition()
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = (e: any) => { const text = e.results?.[0]?.[0]?.transcript; if (text) setSearch(text) }
    recognition.onerror = () => setListening(false)
    recognition.start()
  }
  function renderSearch(id: string) {
    return (
      <div className="relative z-[210]">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <label htmlFor={id} className="sr-only">Search medicines and products</label>
        <Input
          id={id}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setShowSearchSuggestions(true) }}
          onFocus={() => { if (search.trim().length >= 2) setShowSearchSuggestions(true) }}
          onKeyDown={(e) => { if (e.key === 'Enter' && searchSuggestions[0]) { setSearch(searchSuggestions[0].name); setShowSearchSuggestions(false) } }}
          placeholder={t('search_placeholder')}
          className="h-11 rounded-xl bg-background pl-10 pr-24 text-sm"
          autoComplete="off"
        />
        <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
          <button onClick={handleMicClick} className={`flex size-10 items-center justify-center rounded-md transition-colors ${listening ? 'text-brand-teal' : 'text-muted-foreground'} hover:bg-secondary`} aria-label="Search by voice"><Mic className="size-4" /></button>
          <button onClick={handleCameraClick} className="flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary" aria-label="Search by photo"><Camera className="size-4" /></button>
        </div>
        {showSearchSuggestions && searchSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[9999] overflow-hidden rounded-2xl border border-border bg-white shadow-2xl dark:bg-slate-950">
            <div className="border-b border-border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Suggested medicines</div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {searchSuggestions.map((med, index) => (
                <button key={med._id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setSearch(med.name); setShowSearchSuggestions(false); requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })) }} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-secondary">
                  <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    <ProductImage category={med.category} shopCategory={med.shopCategory} imageUrl={med.imageUrl} alt="" className="rounded-lg ring-0" />
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{med.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{med.category} · {med.shopCategory ?? DEFAULT_SHOP_CATEGORY}</span>
                  </span>
                  {index === 0 && <span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold text-primary">Best match</span>}
                </button>
              ))}
            </div>
            <button type="button" onClick={scrollToProducts} className="w-full border-t border-border px-4 py-2.5 text-center text-xs font-semibold text-primary hover:bg-secondary">View all results for “{search.trim()}”</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="relative z-[200] isolate border-b border-border bg-card backdrop-blur md:sticky md:top-0">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3">
          <div className="flex shrink-0 items-center gap-2"><ProfileDrawer /><BrandLogo /></div>
          <div className="hidden flex-1 md:block">{renderSearch('site-search-desktop')}</div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button onClick={toggleLang} className="flex items-center gap-1 rounded-full border border-border px-3 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground" aria-label="Switch language"><Languages className="size-3.5" />{lang === 'en' ? 'हिंदी' : 'English'}</button>
            <Popover><PopoverTrigger asChild><button className="flex size-9 items-center justify-center rounded-full bg-secondary text-foreground transition-transform hover:scale-105" aria-label="Notifications"><Bell className="size-4" /></button></PopoverTrigger><PopoverContent className="w-64 text-sm text-muted-foreground">No new notifications right now.</PopoverContent></Popover>
            <Button variant="default" className="relative gap-2" onClick={() => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))} data-testid="cart-button" aria-label="Open cart"><ShoppingCart className="size-4" />{count > 0 && <Badge className="ml-0.5 bg-highlight text-highlight-foreground">{count}</Badge>}</Button>
          </div>
        </div>
        <div className="mx-auto max-w-[1600px] px-4 pt-2 md:hidden">
          <nav aria-label="Quick sections" className="-mx-1 flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {AMAZON_NAV_ITEMS.map((item) => (
              <button key={item} type="button" onClick={() => handleAmazonNav(item)} aria-pressed={activeAmazonNav === item} className={cn('shrink-0 snap-start rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors', activeAmazonNav === item ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-card text-foreground hover:border-primary/40')}>
                {item}
              </button>
            ))}
          </nav>
          {renderSearch('site-search')}
          <div className="mt-2"><DeliveryLocationBar /></div>
        </div>
        <nav aria-label="Shop by category" className="hidden border-t border-border md:block">
          <div className="mx-auto flex max-w-[1600px] min-w-0 items-center gap-1 overflow-x-auto px-4 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link to="/categories" className="mr-2 inline-flex items-center gap-1.5 py-2.5 pr-2 font-semibold text-primary hover:underline"><Menu className="size-4" /> Shop by Category</Link>
            <button onClick={() => { clearFilters(); scrollToProducts() }} className="border-b-2 border-transparent px-3 py-2.5 text-muted-foreground transition-colors hover:text-foreground">All Products</button>
            {visibleShopCategories.map(({ name }) => <button key={name} onClick={() => selectShopCategory(name)} aria-pressed={activeShopCategory === name} className={cn('border-b-2 px-3 py-2.5 transition-colors', activeShopCategory === name ? 'border-primary font-medium text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>{name}</button>)}
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3.5" /> Deliver to: <span className="font-medium text-foreground">Roorkee {STORE_LOCATION.pincode}</span></span>
          </div>
        </nav>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChosen} />
      </header>

      {!browsing && <>
        <section className="mx-auto max-w-[1600px] px-4 pt-4" aria-label="Wellcare pharmacy banner"><img src={HERO_BACKGROUND_IMAGE} alt="Wellcare Medicose — order medicines and healthcare products online" className="block h-auto w-full rounded-2xl object-contain shadow-sm" fetchPriority="high" /></section>
        <section className="mx-auto mt-4 max-w-[1600px] px-4" aria-label="Why shop with us"><ul className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 lg:grid-cols-4">{TRUST_ITEMS.map(({ icon: Icon, title, sub }) => <li key={title} className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="size-5" /></span><span><span className="block text-sm font-semibold leading-tight">{title}</span><span className="block text-xs text-muted-foreground">{sub}</span></span></li>)}</ul></section>
      </>}

      {!browsing && <section className="mx-auto max-w-[1600px] px-4 py-6" aria-label="Medicines and healthcare"><SectionHeading title="Medicines & Healthcare" subtitle="Trusted brands, better health." icon={<Pill className="size-5" />} action={<Button variant="ghost" size="sm" className="text-primary" onClick={scrollToProducts}>View all</Button>} /><ProductsErrorBoundary>{status === 'LoadingFirstPage' ? <Carousel>{Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} variant="carousel" />)}</Carousel> : featured.length === 0 ? <p className="text-sm text-muted-foreground">Products will appear here soon.</p> : <Carousel>{featured.slice(0, 20).map((med) => <ProductCard key={med._id} med={med} variant="carousel" onAdd={handleAddToCart} />)}</Carousel>}</ProductsErrorBoundary></section>}

      {!browsing && manufacturers.length > 0 && <section className="w-full overflow-hidden px-4 py-6 sm:px-6 lg:px-8" aria-label="Shop by medicine company">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-teal">Explore trusted names</p><h2 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">Shop by Company</h2><p className="mt-1 text-sm text-muted-foreground">Company folders are automatic — swipe, drag or tap any brand mark.</p></div><span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">{manufacturers.length} companies</span></div>
        <div className="relative w-full rounded-2xl border border-border bg-card shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-8 rounded-l-2xl bg-gradient-to-r from-card to-transparent sm:w-12" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-8 rounded-r-2xl bg-gradient-to-l from-card to-transparent sm:w-12" />
          <div
            ref={companyRailRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onMouseEnter={() => setCompanyAutoPaused(true)}
            onMouseLeave={() => setCompanyAutoPaused(false)}
            onPointerDown={() => setCompanyAutoPaused(true)}
            onPointerUp={() => window.setTimeout(() => setCompanyAutoPaused(false), 1200)}
            onPointerCancel={() => window.setTimeout(() => setCompanyAutoPaused(false), 1200)}
            onTouchStart={() => setCompanyAutoPaused(true)}
            onTouchEnd={() => window.setTimeout(() => setCompanyAutoPaused(false), 1200)}
            aria-label="Company brand slider"
          >
            {[...manufacturers, ...manufacturers].map((company, index) => <button key={company + "-" + index} type="button" onClick={() => { setActiveShopCategory(null); setActiveCategory("All"); setSearch(company); setShowSearchSuggestions(false); requestAnimationFrame(scrollToProducts) }} className="group flex w-40 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-background p-3 text-center transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/[0.03] hover:shadow-md sm:w-44" aria-label={"Open " + company + " company folder"}>
              <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-sm transition group-hover:scale-105" aria-hidden="true">{companyLogo(company) ? <img src={companyLogo(company)} alt="" className="max-h-full max-w-full object-contain" loading="lazy" /> : <span className={cn('text-center text-sm font-black tracking-tight', companyLogoStyle(company))}>{company}</span>}</span>
              <span className="block truncate max-w-full text-xs font-bold">{company}</span>
              <span className="text-[10px] text-muted-foreground">{manufacturerCounts.get(company) ?? 0} products</span>
            </button>)}
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">Auto-scroll is on. Pause by touching/hovering, then swipe or tap a company to select it.</p>
      </section>}
      {!browsing && <OfferCards />}

      {!browsing && <section className="mx-auto max-w-[1600px] px-4 py-6" aria-label="Medicine formats">
        <SectionHeading title="Shop by Medicine Type" subtitle="Quick visual shortcuts for common medicine forms." />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {[
            { name: 'Tablets', icon: Pill, mark: 'TAB', tone: 'from-blue-100 to-cyan-50 text-blue-700' },
            { name: 'Syrups', icon: PillBottle, mark: 'SYR', tone: 'from-amber-100 to-yellow-50 text-amber-700' },
            { name: 'Capsules', icon: Pill, mark: 'CAP', tone: 'from-violet-100 to-fuchsia-50 text-violet-700' },
            { name: 'Drops', icon: FlaskConical, mark: 'DROP', tone: 'from-emerald-100 to-teal-50 text-emerald-700' },
            { name: 'Creams & Gels', icon: Sparkles, mark: 'CRM', tone: 'from-pink-100 to-rose-50 text-pink-700' },
            { name: 'Inhalers', icon: Wind, mark: 'INH', tone: 'from-sky-100 to-blue-50 text-sky-700' },
            { name: 'Injections', icon: Syringe, mark: 'INJ', tone: 'from-orange-100 to-amber-50 text-orange-700' },
          ].map(({ name, icon: Icon, mark, tone }) => (
            <button key={name} type="button" onClick={() => { setSearch(name); setShowSearchSuggestions(false); requestAnimationFrame(scrollToProducts) }} className="group rounded-2xl border border-border bg-card p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md">
              <span className={cn('relative flex h-20 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br', tone)}><span className="absolute left-2 top-2 rounded-md bg-white/85 px-1.5 py-0.5 text-[9px] font-black shadow-sm">{mark}</span><Icon className="size-10 transition-transform group-hover:scale-110" strokeWidth={1.5} /></span>
              <span className="mt-2 block text-xs font-bold">{name}</span>
            </button>
          ))}
        </div>
      </section>}
      {!browsing && <section className="border-y border-border bg-card" aria-label="Shop by category"><div className="mx-auto max-w-[1600px] px-4 py-6"><SectionHeading title={t('shop_by_category')} /><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{status === 'LoadingFirstPage' ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />) : visibleShopCategories.map(({ name, icon: Icon, mark }) => <button key={name} type="button" onClick={() => selectShopCategory(name)} aria-pressed={activeShopCategory === name} className={cn('group flex flex-col items-center gap-3 rounded-2xl border p-4 text-center transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0', activeShopCategory === name ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/40')}><span className={cn('relative flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-white/70 shadow-sm transition-transform duration-200 group-hover:scale-105', name === 'Medicines (Branded)' && 'bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100 text-blue-700', name === 'Generic Medicines' && 'bg-gradient-to-br from-emerald-100 via-green-50 to-lime-100 text-emerald-700', name === 'Mankind Products' && 'bg-gradient-to-br from-violet-100 via-fuchsia-50 to-pink-100 text-violet-700', name === "Dr. Reddy's Products" && 'bg-gradient-to-br from-rose-100 via-red-50 to-orange-100 text-rose-700', name === 'Pet Care' && 'bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 text-amber-700', name === 'Grocery / Health Supplements' && 'bg-gradient-to-br from-lime-100 via-green-50 to-teal-100 text-green-700', name === 'Baby Care' && 'bg-gradient-to-br from-pink-100 via-rose-50 to-purple-100 text-pink-700', name === 'Personal Care' && 'bg-gradient-to-br from-fuchsia-100 via-pink-50 to-sky-100 text-fuchsia-700', name === 'Medical Devices' && 'bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-100 text-sky-700', name === 'Nutrition & Fitness' && 'bg-gradient-to-br from-lime-100 via-emerald-50 to-teal-100 text-emerald-700', name === 'Mother & Child Care' && 'bg-gradient-to-br from-pink-100 via-rose-50 to-orange-100 text-rose-700', name === 'Home Health Care' && 'bg-gradient-to-br from-blue-100 via-indigo-50 to-cyan-100 text-blue-700', name === 'Ayurveda & Herbal' && 'bg-gradient-to-br from-green-100 via-lime-50 to-amber-100 text-green-700')}><span className="absolute -right-3 -top-4 size-14 rounded-full bg-white/50 blur-sm" /><span className="absolute left-1.5 top-1.5 rounded-md border border-white/80 bg-white/80 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-slate-700 shadow-sm">{mark}</span><Icon className="relative size-10 drop-shadow-sm transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} aria-hidden="true" /></span><span className="text-xs font-semibold leading-tight">{name}</span>{status === 'Exhausted' && <span className="text-[10px] text-muted-foreground">{shopCounts.get(name) ?? 0} products</span>}</button>)}</div></div></section>}

      {!browsing && <section className="relative isolate overflow-hidden border-y border-teal-100 bg-gradient-to-br from-slate-50 via-cyan-50/70 to-emerald-50" aria-label="Browse medicines"><div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-teal-200/30 blur-3xl" /><div className="pointer-events-none absolute -bottom-24 left-1/4 size-72 rounded-full bg-blue-200/30 blur-3xl" /><div className="relative mx-auto max-w-[1600px] px-4 py-8 sm:py-10"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal-700">Your health, just a few taps away</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Browse Medicines</h2><p className="mt-1 text-sm text-slate-600">Explore available products from our medicine catalogue.</p></div><Button onClick={scrollToProducts} className="rounded-full shadow-lg shadow-teal-900/10">View all medicines <span aria-hidden="true">→</span></Button></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{featured.slice(0, 5).map((med, index) => <motion.div key={med._id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.42, delay: index * 0.07 }} whileHover={{ y: -6, rotateX: 2, rotateY: -2 }} style={{ transformStyle: 'preserve-3d' }} className="rounded-2xl"><ProductCard med={med} onAdd={handleAddToCart} /></motion.div>)}</div>{featured.length === 0 && <p className="rounded-xl border border-dashed border-teal-200 bg-white/70 p-5 text-sm text-slate-600">Medicines will appear here as products are added to the catalogue.</p>}</div></section>}

      {!browsing && <section className="bg-gradient-to-b from-brand-teal/10 to-transparent" aria-label="Veterinary care"><div className="mx-auto max-w-[1600px] px-4 py-6"><div className="relative mb-4 flex items-center justify-between gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-teal to-primary p-6 text-white sm:p-8"><PawPrint className="pointer-events-none absolute -right-4 -top-4 size-40 rotate-12 text-white/10" aria-hidden="true" /><PawPrint className="pointer-events-none absolute bottom-2 right-24 size-16 -rotate-12 text-white/10" aria-hidden="true" /><div className="relative max-w-lg"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">Healthy Pets • Happier Lives</p><h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Veterinary Care</h2><p className="mt-2 text-sm text-white/85">Pet food, veterinary medicines, grooming and everyday care for your pets.</p>{petProducts.length > 0 ? <Button className="mt-4 bg-white text-primary hover:bg-white/90" onClick={() => selectShopCategory('Pet Care')}>Shop Pet Care</Button> : <a href={`https://wa.me/917088252556?text=${encodeURIComponent('Hi Wellcare Medicose, I would like to know about your pet care / veterinary products.')}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary transition-opacity hover:opacity-90">Ask about pet products on WhatsApp</a>}</div><div className="relative hidden h-36 w-56 shrink-0 sm:block" aria-label="Dog and cat care" role="img"><img src="https://assets.macaly-user-data.dev/exm42o5pehv6v9ztijohgy2n/bvngjnb4cw1qdnud5e9kc4hd/RHFgl72fK37qsmkuLZWAW/pet-dog-care-banner-M_db318N.jpg" alt="" className="absolute right-16 top-1 h-32 w-32 rounded-2xl border-4 border-white/70 object-cover shadow-xl" /><img src="https://assets.macaly-user-data.dev/exm42o5pehv6v9ztijohgy2n/bvngjnb4cw1qdnud5e9kc4hd/Gxr02vcqTwxXRg_R3rSXd/pet-cat-care-banner-xweI-17p.jpg" alt="" className="absolute right-0 top-7 h-28 w-28 rounded-2xl border-4 border-white/70 object-cover shadow-xl" /></div></div><div className="mb-5 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => selectShopCategory('Pet Care')} className="group relative flex min-h-40 items-center justify-between overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-100 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><span className="relative z-10 max-w-[68%]"><span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">Made for your best friend</span><span className="mt-1 block text-xl font-bold text-slate-900">Dog Care</span><span className="mt-1 block text-xs text-slate-600">Food, treats, grooming & walking essentials</span><span className="mt-3 inline-flex rounded-full bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white">Explore dog essentials →</span></span><img src="https://assets.macaly-user-data.dev/exm42o5pehv6v9ztijohgy2n/bvngjnb4cw1qdnud5e9kc4hd/RHFgl72fK37qsmkuLZWAW/pet-dog-care-banner-M_db318N.jpg" alt="Happy dog" className="absolute right-0 top-0 h-full w-[38%] rounded-r-2xl object-cover opacity-90 transition-transform duration-300 group-hover:scale-[1.03]" /><span aria-hidden="true" className="absolute inset-y-0 right-[28%] w-16 bg-gradient-to-r from-amber-50/0 to-amber-50/90" /><span aria-hidden="true" className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-amber-800 shadow-sm">DOG ESSENTIALS</span></button><button type="button" onClick={() => selectShopCategory('Pet Care')} className="group relative flex min-h-40 items-center justify-between overflow-hidden rounded-2xl border border-violet-200/70 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-pink-100 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><span className="relative z-10 max-w-[68%]"><span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700">Comfort for every whisker</span><span className="mt-1 block text-xl font-bold text-slate-900">Cat Care</span><span className="mt-1 block text-xs text-slate-600">Cat food, litter, toys & daily care</span><span className="mt-3 inline-flex rounded-full bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white">Explore cat essentials →</span></span><img src="https://assets.macaly-user-data.dev/exm42o5pehv6v9ztijohgy2n/bvngjnb4cw1qdnud5e9kc4hd/Gxr02vcqTwxXRg_R3rSXd/pet-cat-care-banner-xweI-17p.jpg" alt="Cat" className="absolute right-0 top-0 h-full w-[38%] rounded-r-2xl object-cover opacity-90 transition-transform duration-300 group-hover:scale-[1.03]" /><span aria-hidden="true" className="absolute inset-y-0 right-[28%] w-16 bg-gradient-to-r from-violet-50/0 to-violet-50/90" /><span aria-hidden="true" className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-violet-800 shadow-sm">CAT ESSENTIALS</span></button></div>{petProducts.length > 0 && <><SectionHeading title="Featured Veterinary Products" /><ProductsErrorBoundary><Carousel>{petProducts.map((med) => <ProductCard key={med._id} med={med} variant="carousel" label="Veterinary" onAdd={handleAddToCart} />)}</Carousel></ProductsErrorBoundary></>}</div></section>}

      {!browsing && lastOrder && lastOrder.length > 0 && <section className="mx-auto max-w-[1600px] px-4 py-6" aria-label="Based on your previous orders"><SectionHeading title={t('reorder')} /><div className="flex gap-3 overflow-x-auto pb-1">{lastOrder.slice(0, 3).map((order) => <Card key={order._id} className="w-64 shrink-0 rounded-2xl"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Order #{order._id.slice(-6).toUpperCase()}</p><p className="mt-1 line-clamp-2 text-sm">{order.items.map((it) => it.name).join(', ')}</p><Button size="sm" className="mt-2 w-full" onClick={() => { order.items.forEach((it) => addToCart({ _id: it.medicineId, name: it.name, price: it.price, stock: 9999 }, () => {})); fireCartToast('✓ Items added to cart') }}>{t('reorder')}</Button></CardContent></Card>)}</div></section>}

      <main ref={gridRef} className="mx-auto max-w-[1600px] scroll-mt-40 px-4 py-6"><SectionHeading title={activeShopCategory ?? (search.trim() ? `Results for “${search.trim()}”` : t('all_products'))} subtitle={status === 'LoadingFirstPage' ? undefined : `${filteredMedicines.length} product${filteredMedicines.length === 1 ? '' : 's'}`} action={browsing ? <button onClick={clearFilters} className="text-xs font-medium text-primary underline-offset-2 hover:underline">Clear filters</button> : undefined} />
        {search.trim() && filteredMedicines.length > 0 && (
          <div className="mb-5 space-y-5">
            <section aria-label="Best match">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Best match</p>
              <div className="max-w-sm">
                <ProductCard med={filteredMedicines[0]} label={filteredMedicines[0].shopCategory === 'Pet Care' ? 'Veterinary' : undefined} onAdd={handleAddToCart} />
              </div>
            </section>

            {sameComposition.length > 0 && (
              <section aria-label="Other brands with the same salt or composition">
                <div className="mb-3">
                  <h3 className="text-base font-bold">Other brands with the same salt</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">Different brands with the same active composition found in our catalogue.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {sameComposition.map((med) => (
                    <ProductCard key={med._id} med={med} label={med.shopCategory === 'Pet Care' ? 'Veterinary' : undefined} onAdd={handleAddToCart} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
        {!search.trim() && <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">{categories.map((cat) => <button key={cat} onClick={() => setActiveCategory(cat)} aria-pressed={activeCategory === cat} className={cn('shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors', activeCategory === cat ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/40')}>{cat}</button>)}</div>}
        <ProductsErrorBoundary>{status === 'LoadingFirstPage' ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div> : filteredMedicines.length === 0 ? <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center"><p className="text-sm text-muted-foreground">No medicines or products found.</p><Button variant="outline" size="sm" onClick={clearFilters}>Browse all categories</Button></div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{(search.trim() ? filteredMedicines.slice(1) : filteredMedicines).slice(0, visible).map((med) => <ProductCard key={med._id} med={med} label={med.shopCategory === 'Pet Care' ? 'Veterinary' : undefined} onAdd={handleAddToCart} />)}</div>}</ProductsErrorBoundary>
        {filteredMedicines.length > visible && <div className="mt-6 flex justify-center"><Button variant="outline" onClick={() => setVisible((v) => v + 24)}>Show more ({filteredMedicines.length - visible} more)</Button></div>}{status === 'CanLoadMore' && <div className="mt-6 flex justify-center"><Button variant="outline" onClick={() => loadMore(PAGE_SIZE)}>Load more</Button></div>}
      </main>

      {!browsing && recentlyViewed.length > 0 && <section className="border-t border-border bg-card"><div className="mx-auto max-w-[1600px] px-4 py-6"><SectionHeading title={t('recently_viewed')} /><div className="flex gap-3 overflow-x-auto pb-1">{recentlyViewed.map((med) => <Link key={med._id} to="/medicine/$id" params={{ id: med._id }} className="w-32 shrink-0 transition-transform hover:-translate-y-0.5"><ProductImage category={med.category} shopCategory={med.shopCategory} imageUrl={med.imageUrl} alt={med.name} /><p className="mt-1.5 line-clamp-2 text-xs font-medium">{med.name}</p><p className="text-xs font-semibold text-primary">{formatINR(med.price)}</p></Link>)}</div></div></section>}
      <StoreInfoCards /><SiteFooter />
    </div>
  )
}
