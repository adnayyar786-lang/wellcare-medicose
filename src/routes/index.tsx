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
  X,
  SlidersHorizontal,
  Clock3,
  Tag,
  PackageSearch,
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
import { allManufacturers, companyMonogram, manufacturerOf } from '@/config/brand-folders'

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
  { title: '15% OFF on medicines', sub: 'Save more on selected medicines · Limited-time offer', code: 'MED15' },
  { title: '20% OFF on wellness', sub: 'Extra savings on health & wellness products', code: 'HEALTH20' },
  { title: '10% OFF on first order', sub: 'New to Wellcare? Use your welcome offer', code: 'WELCOME10' },
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
  // Strictly separate user input from explicit suggestion selection.
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [searchBrandFilter, setSearchBrandFilter] = useState('All')
  const [searchAvailabilityFilter, setSearchAvailabilityFilter] = useState<'all' | 'in' | 'out'>('all')
  const [searchRxFilter, setSearchRxFilter] = useState<'all' | 'rx' | 'nonrx'>('all')
  const [searchPriceFilter, setSearchPriceFilter] = useState<'all' | 'under500' | '500to1000' | 'over1000'>('all')
  const searchedMedicines = useQuery(
    api.medicines.searchQuery,
    debouncedSearchQuery.length >= 2 ? { query: debouncedSearchQuery } : 'skip',
  )
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

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

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('wellcare-searchQuery-history')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setSearchHistory(parsed.filter((v): v is string => typeof v === 'string').slice(0, 8))
      }
    } catch { /* ignore invalid local searchQuery history */ }
  }, [])

  function saveSearchHistory(term: string) {
    const value = term.trim()
    if (!value) return
    setSearchHistory((prev) => {
      const next = [value, ...prev.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, 8)
      try { window.localStorage.setItem('wellcare-searchQuery-history', JSON.stringify(next)) } catch { /* ignore storage errors */ }
      return next
    })
  }

  function removeSearchHistory(term: string) {
    setSearchHistory((prev) => {
      const next = prev.filter((item) => item !== term)
      try { window.localStorage.setItem('wellcare-searchQuery-history', JSON.stringify(next)) } catch { /* ignore storage errors */ }
      return next
    })
  }

  function clearSearchHistory() {
    setSearchHistory([])
    try { window.localStorage.removeItem('wellcare-searchQuery-history') } catch { /* ignore storage errors */ }
  }

  const normalizeSearchText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const levenshtein = (a: string, b: string) => {
    if (a === b) return 0
    if (!a) return b.length
    if (!b) return a.length
    const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
    for (let i = 1; i <= a.length; i++) {
      let left = i
      for (let j = 1; j <= b.length; j++) {
        const next = Math.min(prev[j] + 1, left + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
        prev[j - 1] = left
        left = next
      }
      prev[b.length] = left
    }
    return prev[b.length]
  }

  const categories = useMemo(() => {
    const set = new Set<string>()
    medicines.forEach((m) => set.add(m.category))
    return ['All', ...Array.from(set).sort()]
  }, [medicines])

  const rankSearchResults = (items: typeof medicines, query: string) => {
    const q = normalizeSearchText(query)
    if (!q) return items
    const terms = q.split(/\s+/).filter(Boolean)
    const fuzzyTokenMatch = (term: string, token: string) => {
      if (token.startsWith(term) || term.startsWith(token)) return 1
      const maxDistance = term.length >= 7 ? 2 : term.length >= 4 ? 1 : 0
      return maxDistance > 0 && levenshtein(term, token) <= maxDistance ? 0.65 : 0
    }
    const scoreFor = (m: (typeof medicines)[number]) => {
      const name = normalizeSearchText(m.name)
      const brand = normalizeSearchText(m.manufacturer ?? '')
      const desc = normalizeSearchText(m.description)
      const nameTokens = name.split(/\s+/).filter(Boolean)
      const exactName = name === q
      const prefixName = name.startsWith(q)
      const phraseName = name.includes(q)
      const exactBrand = brand === q
      const prefixBrand = !!brand && brand.startsWith(q)
      const termScore = terms.reduce((sum, term) => sum + nameTokens.reduce((v, token) => Math.max(v, fuzzyTokenMatch(term, token)), 0), 0)
      const allTerms = termScore >= terms.length
      const descriptionHit = desc.includes(q)
      return (exactName ? 10000 : 0) + (prefixName ? 7000 : 0) + (phraseName ? 5000 : 0) + (exactBrand ? 4600 : 0) + (prefixBrand ? 3800 : 0) + (allTerms ? 2600 : 0) + Math.round(termScore * 600) + (descriptionHit ? 250 : 0) + (m.stock > 0 ? 25 : 0) - (m.shopCategory === 'Pet Care' && !/pet|dog|cat|veterinary|vet/.test(q) ? 1500 : 0)
    }
    return [...items].sort((a, b) => scoreFor(b) - scoreFor(a))
  }

  const searchSource = useMemo(() => {
    const map = new Map<string, (typeof medicines)[number]>()
    for (const item of medicines) map.set(item._id, item)
    for (const item of searchedMedicines ?? []) map.set(item._id, item)
    return Array.from(map.values())
  }, [medicines, searchedMedicines])

  const filteredMedicines = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const source = searchSource
    const terms = normalizeSearchText(q).split(/\s+/).filter(Boolean)
    const items = source.filter((m) => {
      const matchesCategory = activeCategory === 'All' || m.category === activeCategory
      const matchesShop = !activeShopCategory || (m.shopCategory ?? DEFAULT_SHOP_CATEGORY) === activeShopCategory
      const name = normalizeSearchText(m.name)
      const brand = normalizeSearchText(m.manufacturer ?? '')
      const desc = normalizeSearchText(m.description)
      const fuzzyMatch = !q || name.includes(normalizeSearchText(q)) || brand.includes(normalizeSearchText(q)) || desc.includes(normalizeSearchText(q)) || terms.every((term) => name.split(/\s+/).some((token) => token.startsWith(term) || (term.length >= 4 && levenshtein(term, token) <= (term.length >= 7 ? 2 : 1))))
      return matchesCategory && matchesShop && fuzzyMatch
    })
    return rankSearchResults(items, q)
  }, [medicines, searchedMedicines, searchQuery, activeCategory, activeShopCategory, searchSource])

  const sameComposition = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q || filteredMedicines.length === 0) return []
    const best = filteredMedicines[0]
    const key = compositionKey(best)
    if (!key) return []
    const keyWords = key.split(' ').filter((word) => word.length > 2)
    const source = searchSource
    return source
      .filter((m) => m._id !== best._id && m.active)
      .filter((m) => {
        const other = compositionKey(m)
        if (!other) return false
        return other === key || keyWords.every((word) => other.includes(word))
      })
      .slice(0, 6)
  }, [medicines, searchedMedicines, searchQuery, filteredMedicines, searchSource])

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim()
    if (q.length < 2) return []
    return rankSearchResults(filteredMedicines, q).slice(0, 8)
  }, [searchSource, searchQuery, filteredMedicines])

  const searchBrands = useMemo(() => {
    const q = normalizeSearchText(searchQuery)
    if (!q) return []
    return Array.from(new Set(searchSource.map((m) => m.manufacturer).filter(Boolean) as string[]))
      .filter((brand) => normalizeSearchText(brand).includes(q) || normalizeSearchText(brand).split(/\s+/).some((part) => part.startsWith(q)))
      .slice(0, 4)
  }, [searchSource, searchQuery])

  const searchCategories = useMemo(() => {
    const q = normalizeSearchText(searchQuery)
    if (!q) return []
    return Array.from(new Set(searchSource.flatMap((m) => [m.category, m.shopCategory].filter(Boolean) as string[])))
      .filter((category) => normalizeSearchText(category).includes(q))
      .slice(0, 5)
  }, [searchSource, searchQuery])

  const searchHealthProducts = useMemo(() => {
    const q = searchQuery.trim()
    if (!q) return []
    return rankSearchResults(filteredMedicines.filter((m) => m.shopCategory !== 'Pet Care' && !m.requiresPrescription), q).slice(0, 4)
  }, [searchSource, searchQuery, filteredMedicines])

  const filteredSearchMedicines = useMemo(() => {
    if (!searchQuery.trim()) return filteredMedicines
    return filteredMedicines.filter((m) => {
      const brandOk = searchBrandFilter === 'All' || (m.manufacturer ?? '') === searchBrandFilter
      const stockOk = searchAvailabilityFilter === 'all' || (searchAvailabilityFilter === 'in' ? m.stock > 0 : m.stock <= 0)
      const rxOk = searchRxFilter === 'all' || (searchRxFilter === 'rx' ? m.requiresPrescription : !m.requiresPrescription)
      const priceOk = searchPriceFilter === 'all' || (searchPriceFilter === 'under500' ? m.price < 500 : searchPriceFilter === '500to1000' ? m.price >= 500 && m.price <= 1000 : m.price > 1000)
      return brandOk && stockOk && rxOk && priceOk
    })
  }, [filteredMedicines, searchQuery, searchBrandFilter, searchAvailabilityFilter, searchRxFilter, searchPriceFilter])

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

  useEffect(() => { setVisible(24) }, [searchQuery, activeCategory, activeShopCategory])

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
  const browsing = searchQuery.trim() !== '' || activeShopCategory !== null || activeCategory !== 'All'

  function selectShopCategory(name: string) {
    setActiveShopCategory((prev) => (prev === name ? null : name))
    setActiveCategory('All')
    requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  function clearFilters() {
    setSearch('')
    setShowSearchSuggestions(false)
    setActiveCategory('All')
    setActiveShopCategory(null)
    setSearchBrandFilter('All')
    setSearchAvailabilityFilter('all')
    setSearchRxFilter('all')
    setSearchPriceFilter('all')
  }
  function applySearch(term: string) {
    const value = term.trim()
    setSearch(value)
    if (value) saveSearchHistory(value)
    setShowSearchSuggestions(false)
    setActiveCategory('All')
    setActiveShopCategory(null)
    requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
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
  function handlePhotoChosen() { toast.info('Photo searchQuery is coming soon — try typing the medicine name for now.') }
  function selectSearchSuggestion(med: (typeof medicines)[number]) {
    setSelectedSuggestionId(med._id)
    applySearch(med.name, med._id)
  }

  function handleMicClick() {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) { toast.error('Voice searchQuery is not supported on this device/browser'); return }
    const recognition = new SpeechRecognition()
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = (e: any) => { const text = e.results?.[0]?.[0]?.transcript; if (text) setSearch(text) }
    recognition.onerror = () => setListening(false)
    recognition.start()
  }
  function renderSearch(id: string) {
    const hasQuery = searchQuery.trim().length > 0
    const showPanel = showSearchSuggestions
    return (
      <div className="relative z-[210]">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <label htmlFor={id} className="sr-only">Search medicines, health products and more</label>
        <Input
          id={id}
          value={searchQuery}
          onChange={(e) => { setSearch(e.target.value); setShowSearchSuggestions(true) }}
          onFocus={() => setShowSearchSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowSearchSuggestions(false)
            if (e.key === 'Enter' && searchQuery.trim()) {
              setSelectedSuggestionId(null)
              saveSearchHistory(searchQuery)
              setShowSearchSuggestions(false)
              requestAnimationFrame(scrollToProducts)
            }
          }}
          placeholder="Search medicines, health products & more"
          className="h-12 rounded-2xl border-border bg-background pl-10 pr-24 text-sm shadow-sm transition-[box-shadow,border-color] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          autoComplete="off"
          enterKeyHint="searchQuery"
          inputMode="searchQuery"
        />
        <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
          {searchQuery && <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setSearch(''); setShowSearchSuggestions(true) }} className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary" aria-label="Clear searchQuery"><X className="size-4" /></button>}
          <button type="button" onClick={handleMicClick} className={`flex size-10 items-center justify-center rounded-md transition-colors ${listening ? 'text-brand-teal' : 'text-muted-foreground'} hover:bg-secondary`} aria-label="Search by voice"><Mic className="size-4" /></button>
          <button type="button" onClick={handleCameraClick} className="hidden flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary sm:flex" aria-label="Search by photo"><Camera className="size-4" /></button>
        </div>
        {showPanel && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[9999] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ring-1 ring-black/5">
            <div className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain p-2">
              {!hasQuery && searchHistory.length > 0 && (
                <section className="p-2" aria-label="Recent searches">
                  <div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-bold"><Clock3 className="size-4 text-primary" /> Recent searches</div><button type="button" onClick={clearSearchHistory} className="text-[11px] font-semibold text-primary">Clear all</button></div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((item) => <button key={item} type="button" onClick={() => applySearch(item)} className="group inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs hover:border-primary/40 hover:bg-primary/5"><span className="max-w-[180px] truncate">{item}</span><span role="button" tabIndex={0} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); removeSearchHistory(item) }} className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${item}`}>×</span></button>)}
                  </div>
                </section>
              )}
              {hasQuery && searchSuggestions.length > 0 && (
                <section aria-label="Medicine suggestions">
                  <div className="flex items-center justify-between px-3 pb-2 pt-1"><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Top matches</div><span className="text-[10px] text-muted-foreground">Live searchQuery</span></div>
                  <div className="space-y-0.5">
                    {searchSuggestions.map((med, index) => (
                      <button key={med._id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => selectSearchSuggestion(med)} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-secondary active:bg-secondary">
                        <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-secondary"><ProductImage category={med.category} shopCategory={med.shopCategory} imageUrl={med.imageUrl} alt="" className="rounded-xl ring-0" /></div>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2"><span className="truncate text-sm font-semibold">{med.name}</span>{med.requiresPrescription && <span className="shrink-0 rounded-full bg-highlight/10 px-1.5 py-0.5 text-[9px] font-bold text-highlight-foreground">Rx</span>}</span>
                          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{med.manufacturer ? `${med.manufacturer} · ` : ''}{med.category}{med.stock <= 0 ? ' · Out of stock' : ''}</span>
                        </span>
                        <span className="shrink-0 text-right"><span className="block text-sm font-bold text-primary">{formatINR(med.price)}</span>{med.mrpPrice && med.mrpPrice > med.price && <span className="block text-[10px] text-muted-foreground line-through">{formatINR(med.mrpPrice)}</span>}</span>
                        {index === 0 && <span className="hidden rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold text-primary sm:inline-flex">Best</span>}
                      </button>
                    ))}
                  </div>
                </section>
              )}
              {hasQuery && searchBrands.length > 0 && (
                <section className="border-t border-border px-2 pb-2 pt-3" aria-label="Brand suggestions"><div className="mb-2 flex items-center gap-2 text-xs font-bold"><Tag className="size-4 text-primary" /> Brands</div><div className="flex flex-wrap gap-2">{searchBrands.map((brand) => <button key={brand} type="button" onClick={() => { setSearchBrandFilter(brand); setSearch(brand); saveSearchHistory(brand); setShowSearchSuggestions(false); requestAnimationFrame(scrollToProducts) }} className="rounded-full border border-border bg-background px-3 py-2 text-xs font-medium hover:border-primary/40 hover:bg-primary/5">{brand}</button>)}</div></section>
              )}
              {hasQuery && searchCategories.length > 0 && (
                <section className="border-t border-border px-2 pb-2 pt-3" aria-label="Category suggestions"><div className="mb-2 flex items-center gap-2 text-xs font-bold"><PackageSearch className="size-4 text-primary" /> Categories</div><div className="flex flex-wrap gap-2">{searchCategories.map((category) => <button key={category} type="button" onClick={() => { setSearch(category); setSearchHistory((prev) => prev); setShowSearchSuggestions(false); requestAnimationFrame(scrollToProducts) }} className="rounded-full border border-border bg-background px-3 py-2 text-xs font-medium hover:border-primary/40 hover:bg-primary/5">{category}</button>)}</div></section>
              )}
              {hasQuery && searchHealthProducts.length > 0 && (
                <section className="border-t border-border px-2 pb-1 pt-3" aria-label="Health products"><div className="mb-2 text-xs font-bold">Health products</div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{searchHealthProducts.map((med) => <button key={med._id} type="button" onClick={() => applySearch(med.name)} className="min-w-0 rounded-xl border border-border bg-background p-2 text-left hover:border-primary/40"><ProductImage category={med.category} shopCategory={med.shopCategory} imageUrl={med.imageUrl} alt="" className="rounded-lg ring-0" /><p className="mt-1 line-clamp-2 text-[11px] font-semibold">{med.name}</p><p className="text-xs font-bold text-primary">{formatINR(med.price)}</p></button>)}</div></section>
              )}
              {hasQuery && searchSuggestions.length === 0 && searchBrands.length === 0 && searchCategories.length === 0 && (
                <div className="px-4 py-7 text-center"><p className="text-sm font-semibold">Couldn't find what you're looking for</p><p className="mt-1 text-xs text-muted-foreground">Try a shorter medicine name, brand, or browse a category below.</p><div className="mt-3 flex flex-wrap justify-center gap-2">{categories.slice(1, 6).map((cat) => <button key={cat} type="button" onClick={() => { setSearch(cat); setShowSearchSuggestions(false); requestAnimationFrame(scrollToProducts) }} className="rounded-full border border-border px-3 py-2 text-xs font-medium hover:border-primary/40">{cat}</button>)}</div></div>
              )}
              {!hasQuery && searchHistory.length === 0 && <div className="px-4 py-7 text-center"><Search className="mx-auto size-6 text-muted-foreground" /><p className="mt-2 text-sm font-semibold">Search your medicines & health products</p><p className="mt-1 text-xs text-muted-foreground">Try “parac”, “dolo 650”, or a brand name.</p></div>}
            </div>
            {hasQuery && <button type="button" onClick={() => { saveSearchHistory(searchQuery); setShowSearchSuggestions(false); requestAnimationFrame(scrollToProducts) }} className="w-full border-t border-border bg-background px-4 py-3 text-center text-xs font-semibold text-primary hover:bg-secondary">View all results for “{searchQuery.trim()}”</button>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 relative z-[200] isolate border-b border-border bg-card backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3">
          <div className="flex shrink-0 items-center gap-2"><ProfileDrawer /><BrandLogo /></div>
          <div className="hidden flex-1 md:block">{renderSearch('site-searchQuery-desktop')}</div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button onClick={toggleLang} className="flex items-center gap-1 rounded-full border border-border px-3 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground" aria-label="Switch language"><Languages className="size-3.5" />{lang === 'en' ? 'हिंदी' : 'English'}</button>
            <Popover><PopoverTrigger asChild><button className="flex size-9 items-center justify-center rounded-full bg-secondary text-foreground transition-transform hover:scale-105" aria-label="Notifications"><Bell className="size-4" /></button></PopoverTrigger><PopoverContent className="w-64 text-sm text-muted-foreground">No new notifications right now.</PopoverContent></Popover>
            <Button variant="default" className="relative gap-2" onClick={() => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))} data-testid="cart-button" aria-label="Open cart"><ShoppingCart className="size-4" />{count > 0 && <Badge className="ml-0.5 bg-highlight text-highlight-foreground">{count}</Badge>}</Button>
          </div>
        </div>
        <div className="mx-auto max-w-[1600px] px-4 pt-2 md:hidden">
          <nav aria-label="Quick sections" className="-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {([
              { name: 'Pharmacy', mark: 'Rx', icon: Pill, hint: 'Medicines' },
              { name: 'Latest', mark: 'NEW', icon: Sparkles, hint: 'New arrivals' },
              { name: 'Petcare', mark: 'PET', icon: PawPrint, hint: 'Pet health' },
              { name: 'Consult', mark: 'DOC', icon: Stethoscope, hint: 'Doctor help' },
              { name: 'Adult', mark: '18+', icon: HeartPulse, hint: 'Adult health' },
              { name: 'Health', mark: 'H+', icon: ShieldCheck, hint: 'Wellness' },
              { name: 'Health Plan', mark: 'HP', icon: HeartPulse, hint: 'Health plans' },
            ] as const).map(({ name, mark, icon: Icon, hint }) => (
              <button
                key={name}
                type="button"
                onClick={() => handleAmazonNav(name)}
                aria-pressed={activeAmazonNav === name}
                className={cn(
                  'group flex h-[74px] w-[92px] shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-2 text-center transition-all duration-200',
                  activeAmazonNav === name
                    ? 'border-primary bg-primary text-primary-foreground shadow-md'
                    : 'border-border bg-card text-foreground shadow-sm hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
                )}
              >
                <span className={cn(
                  'flex size-9 items-center justify-center rounded-xl border text-[10px] font-black tracking-tight shadow-sm transition-transform group-hover:scale-105',
                  activeAmazonNav === name
                    ? 'border-white/20 bg-white/15 text-white'
                    : 'border-primary/10 bg-primary/5 text-primary',
                )}>
                  <Icon className="size-4.5" strokeWidth={2} aria-hidden="true" />
                  <span className="sr-only">{mark}</span>
                </span>
                <span className="block w-full truncate text-[11px] font-bold leading-tight">{name}</span>
                <span className={cn('block w-full truncate text-[8px] leading-tight', activeAmazonNav === name ? 'text-white/75' : 'text-muted-foreground')}>{hint}</span>
              </button>
            ))}
          </nav>
          {renderSearch('site-searchQuery')}
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
            {[...manufacturers, ...manufacturers].map((company, index) => <button key={company + "-" + index} type="button" onClick={() => { setActiveShopCategory(null); setActiveCategory("All"); setSearch(company); setShowSearchSuggestions(false); requestAnimationFrame(scrollToProducts) }} className="group flex w-44 shrink-0 snap-start flex-col items-center justify-center gap-2.5 rounded-2xl border border-border bg-background p-4 text-center transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/[0.03] hover:shadow-md sm:w-48" aria-label={"Open " + company + " company folder"}>
              <span className={cn('relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition group-hover:scale-105 sm:size-24', companyLogoStyle(company))} aria-hidden="true">
                <span className="absolute -right-3 -top-3 size-10 rounded-full bg-white/60 blur-md" />
                <span className="relative flex size-14 items-center justify-center rounded-xl border border-white/70 bg-white/85 text-xl font-black tracking-tight shadow-sm sm:size-16 sm:text-2xl">{companyMonogram(company)}</span>
              </span>
              <span className="block max-w-full truncate text-sm font-bold">{company}</span>
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

      <main ref={gridRef} className="mx-auto max-w-[1600px] scroll-mt-40 px-4 py-6"><SectionHeading title={activeShopCategory ?? (searchQuery.trim() ? `Results for “${searchQuery.trim()}”` : t('all_products'))} subtitle={status === 'LoadingFirstPage' ? undefined : `${filteredSearchMedicines.length} product${filteredSearchMedicines.length === 1 ? '' : 's'}`} action={browsing ? <button onClick={clearFilters} className="text-xs font-medium text-primary underline-offset-2 hover:underline">Clear filters</button> : undefined} />
        {searchQuery.trim() && filteredMedicines.length > 0 && (
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
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          {(searchQuery.trim() ? ['All', ...Array.from(new Set(filteredMedicines.map((m) => m.category))).sort()] : categories).map((cat) => <button key={cat} onClick={() => setActiveCategory(cat)} aria-pressed={activeCategory === cat} className={cn('shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors', activeCategory === cat ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/40')}>{cat}</button>)}
        </div>
        {searchQuery.trim() && (
          <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><SlidersHorizontal className="size-4" /> Filters</div>
            <select value={searchBrandFilter} onChange={(e) => setSearchBrandFilter(e.target.value)} className="h-9 rounded-xl border border-border bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="All">Brand: All</option>
              {Array.from(new Set(filteredMedicines.map((m) => m.manufacturer).filter(Boolean) as string[])).sort().map((brand) => <option key={brand} value={brand}>{brand}</option>)}
            </select>
            <select value={searchPriceFilter} onChange={(e) => setSearchPriceFilter(e.target.value as typeof searchPriceFilter)} className="h-9 rounded-xl border border-border bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="all">Price: All</option><option value="under500">Under ₹500</option><option value="500to1000">₹500–₹1,000</option><option value="over1000">Above ₹1,000</option>
            </select>
            <select value={searchAvailabilityFilter} onChange={(e) => setSearchAvailabilityFilter(e.target.value as typeof searchAvailabilityFilter)} className="h-9 rounded-xl border border-border bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="all">Availability: All</option><option value="in">In stock</option><option value="out">Out of stock</option>
            </select>
            <select value={searchRxFilter} onChange={(e) => setSearchRxFilter(e.target.value as typeof searchRxFilter)} className="h-9 rounded-xl border border-border bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="all">Prescription: All</option><option value="rx">Prescription required</option><option value="nonrx">No prescription</option>
            </select>
          </div>
        )}
        <ProductsErrorBoundary>{status === 'LoadingFirstPage' ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div> : filteredSearchMedicines.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center"><PackageSearch className="mx-auto size-8 text-muted-foreground" /><p className="mt-2 text-sm font-semibold">Couldn't find what you're looking for</p><p className="mt-1 text-xs text-muted-foreground">Try a related searchQuery, browse categories, or clear the filters.</p><div className="mt-4 flex flex-wrap justify-center gap-2">{['Paracetamol','Vitamin C','Cough Syrup','Pain Relief'].map((term) => <button key={term} type="button" onClick={() => applySearch(term)} className="rounded-full border border-border px-3 py-2 text-xs font-medium hover:border-primary/40">{term}</button>)}<Button variant="outline" size="sm" onClick={clearFilters}>Browse all categories</Button></div></div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{filteredSearchMedicines.slice(0, visible).map((med) => <ProductCard key={med._id} med={med} label={med.shopCategory === 'Pet Care' ? 'Veterinary' : undefined} onAdd={handleAddToCart} />)}</div>}</ProductsErrorBoundary>
        {filteredSearchMedicines.length > visible && <div className="mt-6 flex justify-center"><Button variant="outline" onClick={() => setVisible((v) => v + 24)}>Show more ({filteredSearchMedicines.length - visible} more)</Button></div>}{status === 'CanLoadMore' && <div className="mt-6 flex justify-center"><Button variant="outline" onClick={() => loadMore(PAGE_SIZE)}>Load more</Button></div>}
      </main>

      {!browsing && recentlyViewed.length > 0 && <section className="border-t border-border bg-card"><div className="mx-auto max-w-[1600px] px-4 py-6"><SectionHeading title={t('recently_viewed')} /><div className="flex gap-3 overflow-x-auto pb-1">{recentlyViewed.map((med) => <Link key={med._id} to="/medicine/$id" params={{ id: med._id }} className="w-32 shrink-0 transition-transform hover:-translate-y-0.5"><ProductImage category={med.category} shopCategory={med.shopCategory} imageUrl={med.imageUrl} alt={med.name} /><p className="mt-1.5 line-clamp-2 text-xs font-medium">{med.name}</p><p className="text-xs font-semibold text-primary">{formatINR(med.price)}</p></Link>)}</div></div></section>}
      <StoreInfoCards /><SiteFooter />
    </div>
  )
}
