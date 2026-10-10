import { createFileRoute, Link } from '@tanstack/react-router'
import { usePaginatedQuery, useQuery } from 'convex/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  Baby,
  Bell,
  MessageCircle,
  HeartPulse, Dumbbell, Stethoscope, Leaf, Heart,
  Camera,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Languages,
  Lock,
  MapPin,
  Menu,
  Mic,
  PawPrint,
  RefreshCw,
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
import { allManufacturers, companyLogo, companyMonogram, FEATURED_COMPANIES, manufacturerOf } from '@/config/brand-folders'

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

type CategoryRailItem = { id: string; title: string; subtitle: string; icon: typeof Pill; routeKey: string; mark?: string }

const SHOP_AND_CARE: CategoryRailItem[] = [
  { id: 'pharmacy', title: 'Pharmacy', subtitle: 'Medicines & essentials', icon: Pill, routeKey: 'Medicines (Branded)', mark: 'RX' },
  { id: 'latest', title: 'Latest', subtitle: 'New arrivals', icon: Sparkles, routeKey: 'Latest', mark: 'NEW' },
  { id: 'medicines', title: 'Medicines', subtitle: 'All medicines', icon: PillBottle, routeKey: 'Medicines (Branded)', mark: 'MED' },
  { id: 'otc', title: 'OTC & Wellness', subtitle: 'Everyday health', icon: HeartPulse, routeKey: 'OTC & Wellness', mark: 'OTC' },
  { id: 'vitamins', title: 'Vitamins & Nutrition', subtitle: 'Vitamins & supplements', icon: FlaskConical, routeKey: 'Grocery / Health Supplements', mark: 'VIT' },
  { id: 'personal-care', title: 'Personal Care', subtitle: 'Care & hygiene', icon: Sparkles, routeKey: 'Personal Care', mark: 'PC' },
  { id: 'baby-care', title: 'Baby Care', subtitle: 'Baby essentials', icon: Baby, routeKey: 'Baby Care', mark: 'BABY' },
  { id: 'petcare', title: 'Petcare', subtitle: 'For pets', icon: PawPrint, routeKey: 'Pet Care', mark: 'PET' },
  { id: 'devices', title: 'Health Devices', subtitle: 'Healthcare devices', icon: Stethoscope, routeKey: 'Medical Devices', mark: 'DEV' },
  { id: 'sexual-wellness', title: 'Sexual Wellness', subtitle: 'Intimate wellness', icon: Heart, routeKey: 'Sexual Wellness', mark: 'SW' },
]


const MEDICINE_FORM_SLIDER: CategoryRailItem[] = [
  { id: 'tablets', title: 'Tablets', subtitle: 'Common medicines', icon: Pill, routeKey: 'Tablets', mark: 'TAB' },
  { id: 'syrups', title: 'Syrups', subtitle: 'Liquid medicines', icon: PillBottle, routeKey: 'Syrups', mark: 'SYR' },
  { id: 'capsules', title: 'Capsules', subtitle: 'Capsule medicines', icon: Pill, routeKey: 'Capsules', mark: 'CAP' },
  { id: 'drops', title: 'Drops', subtitle: 'Drops & solutions', icon: FlaskConical, routeKey: 'Drops', mark: 'DRP' },
  { id: 'creams', title: 'Creams & Gels', subtitle: 'Topical care', icon: Sparkles, routeKey: 'Creams & Gels', mark: 'CRM' },
  { id: 'inhalers', title: 'Inhalers', subtitle: 'Respiratory care', icon: Wind, routeKey: 'Inhalers', mark: 'INH' },
  { id: 'injections', title: 'Injections', subtitle: 'Injectable medicines', icon: Syringe, routeKey: 'Injections', mark: 'INJ' },
]

function monogramTone(id: string) {
  const tones = [
    'bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-800 text-white',
    'bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-700 text-white',
    'bg-gradient-to-br from-violet-900 via-purple-800 to-fuchsia-700 text-white',
    'bg-gradient-to-br from-rose-900 via-red-800 to-orange-700 text-white',
    'bg-gradient-to-br from-amber-900 via-orange-800 to-yellow-700 text-white',
    'bg-gradient-to-br from-cyan-900 via-sky-800 to-blue-700 text-white',
  ]
  return tones[Math.abs(id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % tones.length]
}

function CategoryRail({ title, subtitle, items, onSelect }: { title: string; subtitle: string; items: CategoryRailItem[]; onSelect: (item: CategoryRailItem) => void }) {
  return (
    <section className="mx-auto w-full max-w-[1600px] py-2.5 sm:py-3" aria-label={title}>
      <div className="mb-2 flex items-end justify-between gap-3 sm:mb-2.5">
        <div>
          <h2 className="text-xs font-black tracking-[0.08em] text-foreground sm:text-sm">{title}</h2>
          <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-[11px]">{subtitle}</p>
        </div>
        <span className="hidden text-[10px] font-medium text-muted-foreground sm:block">Swipe →</span>
      </div>
      <div className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ touchAction: 'pan-x pan-y' }}>
        {items.map((item) => {
          const Icon = item.icon
          return (
            <motion.button key={item.id} type="button" whileTap={{ scale: 0.98 }} onClick={() => onSelect(item)}
              className="group h-[96px] w-[168px] min-w-[168px] shrink-0 snap-start rounded-xl border border-border/80 bg-card p-2.5 text-left shadow-[0_1px_6px_rgba(15,23,42,0.05)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md sm:h-[102px] sm:w-[190px] sm:min-w-[190px] lg:h-[108px] lg:w-[205px] lg:min-w-[205px]">
              <span className={cn("relative flex size-9 items-center justify-center overflow-hidden rounded-xl border border-white/25 shadow-sm sm:size-10", monogramTone(item.id))}>
                <span className="absolute -right-2 -top-2 size-7 rounded-full border border-white/15 bg-white/10" />
                <span className="absolute -bottom-2 -left-2 size-6 rounded-full border border-white/10 bg-black/10" />
                <span className="relative flex size-7 items-center justify-center rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm sm:size-8">
                  <Icon className="size-3.5 text-white/90 sm:size-4" strokeWidth={2.5} />
                </span>
                <span className="absolute bottom-0.5 right-0.5 rounded-md border border-white/25 bg-white/20 px-1 text-[6px] font-black leading-3 tracking-wider text-white shadow-sm backdrop-blur-sm sm:text-[7px]">{item.mark ?? 'WC'}</span>
              </span>
              <span className="mt-1.5 block truncate text-[13px] font-bold leading-tight sm:text-sm">{item.title}</span>
              <span className="mt-0.5 block truncate text-[10px] leading-tight text-muted-foreground sm:text-[11px]">{item.subtitle}</span>
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}

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
    <section aria-label="Offers" className="mx-auto max-w-[1600px] px-4 py-2.5">
      <SectionHeading title="Offers for you" subtitle="Tap a coupon to save it, then apply it in your cart." />
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        {banners.map((b, i) => (
          <motion.button
            key={b.title}
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => handleClick(b.code)}
            className={cn(
              'w-72 shrink-0 snap-start rounded-2xl border border-white/15 bg-gradient-to-br p-4 text-left text-white shadow-[0_12px_30px_-16px_rgba(15,23,42,0.65)] transition-shadow hover:shadow-[0_18px_36px_-16px_rgba(15,23,42,0.75)]',
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

// Company cards prefer verified brand artwork; graphical monograms remain the visual fallback.
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


const HERO_SLIDES = [
  {
    id: 'healthcare',
    eyebrow: 'YOUR HEALTH, OUR PRIORITY',
    title: 'Quality Medicines &\nHealthcare Products',
    subtitle: 'Trusted products from your local pharmacy, delivered with care.',
    cta: 'Shop Medicines',
    tone: 'from-emerald-950/95 via-teal-900/80 to-slate-900/30',
    accent: 'Genuine products · Fast delivery · Pharmacist support',
    image: true,
  },
  {
    id: 'wellness',
    eyebrow: 'EVERYDAY WELLNESS',
    title: 'Skin Care, Serums &\nPersonal Care Essentials',
    subtitle: 'Build your daily care routine with trusted healthcare and wellness products.',
    cta: 'Explore Wellness',
    tone: 'from-violet-950/95 via-purple-900/80 to-rose-900/35',
    accent: 'Skin care · Serums · Hygiene · Beauty care',
    image: false,
  },
  {
    id: 'family',
    eyebrow: 'CARE FOR EVERY FAMILY MEMBER',
    title: 'Baby, Pet &\nVeterinary Care',
    subtitle: 'From baby essentials to pet medicines and nutrition, find everyday care in one place.',
    cta: 'Explore Family Care',
    tone: 'from-sky-950/95 via-cyan-900/80 to-emerald-900/35',
    accent: 'Baby care · Pet care · Veterinary · Nutrition',
    image: false,
  },
] as const

function HeroCarousel({ onShop }: { onShop: () => void }) {
  const [active, setActive] = useState(0)
  const pausedRef = useRef(false)
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!pausedRef.current) setActive((value) => (value + 1) % HERO_SLIDES.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [])
  const slide = HERO_SLIDES[active]
  return (
    <section
      className="mx-auto w-full max-w-[1600px] px-3 pt-3 sm:px-4 sm:pt-4"
      aria-label="Wellcare promotional banners"
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
      onTouchStart={() => { pausedRef.current = true }}
      onTouchEnd={() => { pausedRef.current = false }}
    >
      <div className="mb-3 flex w-full items-center overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.08] via-background to-brand-teal/[0.08] px-3 py-2 shadow-[0_4px_18px_rgba(15,23,42,0.08)] sm:mb-3.5 sm:px-4 sm:py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm shadow-sm sm:size-8 sm:text-base" aria-hidden="true">⚡</span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-black tracking-tight text-foreground sm:text-sm">DELIVERY IN 30–45 MIN</p>
            <p className="truncate text-[9px] font-semibold text-brand-teal sm:text-[10px]">CUSTOMER DISCOUNT • UP TO 20% OFF</p>
          </div>
        </div>
        <span className="ml-3 hidden shrink-0 rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-extrabold text-primary sm:inline-flex">QUICK DELIVERY</span>
      </div>
      <div className="relative min-h-[250px] overflow-hidden rounded-[22px] border border-emerald-900/10 bg-slate-950 shadow-[0_12px_40px_rgba(15,23,42,0.16)] sm:min-h-[300px] lg:min-h-[360px]">
        {slide.image && <img src={HERO_BACKGROUND_IMAGE} alt="Wellcare Medicose healthcare products" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />}
        <div className={cn('absolute inset-0 bg-gradient-to-r', slide.tone)} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_30%,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_12%_100%,rgba(16,185,129,0.22),transparent_30%)]" />
        {!slide.image && (
          <div className="absolute right-[-40px] top-1/2 hidden -translate-y-1/2 sm:block lg:right-16">
            <div className="relative flex size-52 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-sm lg:size-64">
              <div className="absolute size-40 rounded-full border border-white/10 bg-white/10 lg:size-52" />
              <div className="relative grid grid-cols-2 gap-3 p-6 lg:gap-4">
                {(slide.id === 'wellness' ? ['SERUM', 'SKIN', 'CARE', 'GLOW'] : ['BABY', 'PET', 'VET', 'CARE']).map((mark, i) => (
                  <span key={mark} className={cn('flex size-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-center text-[9px] font-black tracking-wider text-white shadow-lg backdrop-blur-sm lg:size-20')}>{mark}</span>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="relative z-10 flex min-h-[200px] max-w-2xl flex-col justify-center px-6 py-7 text-white sm:min-h-[248px] sm:px-10 sm:py-8 lg:min-h-[300px] lg:px-14">
          <span className="mb-2 w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-bold tracking-[0.18em] backdrop-blur-sm sm:text-[10px]">{slide.eyebrow}</span>
          <h1 className="whitespace-pre-line text-3xl font-black leading-[1.02] tracking-tight sm:text-4xl lg:text-5xl">{slide.title}</h1>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-white/85 sm:text-sm lg:text-base">{slide.subtitle}</p>
          <p className="mt-3 text-[10px] font-semibold tracking-wide text-white/75 sm:text-xs">{slide.accent}</p>
          <div className="mt-5 flex items-center gap-3">
            <button type="button" onClick={onShop} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-extrabold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl sm:px-6 sm:py-3">{slide.cta}<ChevronRight className="size-4" /></button>
            <span className="hidden rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-semibold text-white/80 backdrop-blur-sm sm:inline-flex">Wellcare Medicose</span>
          </div>
        </div>
        <button type="button" onClick={() => setActive((active - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)} className="absolute left-3 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-slate-950/35 text-white backdrop-blur-sm transition hover:bg-slate-950/60" aria-label="Previous banner"><ChevronLeft className="size-4" /></button>
        <button type="button" onClick={() => setActive((active + 1) % HERO_SLIDES.length)} className="absolute right-3 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-slate-950/35 text-white backdrop-blur-sm transition hover:bg-slate-950/60" aria-label="Next banner"><ChevronRight className="size-4" /></button>
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/25 px-2.5 py-1.5 backdrop-blur-sm">
          {HERO_SLIDES.map((item, index) => <button key={item.id} type="button" onClick={() => setActive(index)} className={cn('h-1.5 rounded-full transition-all', active === index ? 'w-7 bg-white' : 'w-1.5 bg-white/50')} aria-label={`Show banner ${index + 1}`} />)}
        </div>
      </div>
    </section>
  )
}


function Home() {
  const { results: medicines, status, loadMore } = usePaginatedQuery(api.medicines.list, {}, { initialNumItems: PAGE_SIZE })
  const { count, addToCart } = useCart()
  const { t, lang, toggle: toggleLang } = useLanguage()
  // Strictly separate user input from explicit suggestion selection.
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState('')
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [searchBrandFilter, setSearchBrandFilter] = useState('All')
  const [searchAvailabilityFilter, setSearchAvailabilityFilter] = useState<'all' | 'in' | 'out'>('all')
  const [searchRxFilter, setSearchRxFilter] = useState<'all' | 'rx' | 'nonrx'>('all')
  const [searchPriceFilter, setSearchPriceFilter] = useState<'all' | 'under500' | '500to1000' | 'over1000'>('all')
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [activeShopCategory, setActiveShopCategory] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [scannedBarcode, setScannedBarcode] = useState('')
  const cameraVideoRef = useRef<HTMLVideoElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const searchedMedicines = useQuery(
    api.medicines.search,
    debouncedSearchQuery.length >= 2 ? { query: debouncedSearchQuery } : 'skip',
  )
  const barcodeMedicine = useQuery(
    api.medicines.getByBarcode,
    scannedBarcode ? { barcode: scannedBarcode } : 'skip',
  )
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [searchQuery])
  useEffect(() => {
    if (!cameraOpen) return
    let cancelled = false
    let raf = 0
    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access is not supported')
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return }
        cameraStreamRef.current = stream
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream
          await cameraVideoRef.current.play()
        }
        const Detector = (window as any).BarcodeDetector
        if (!Detector) {
          toast.info('Live barcode scanning is not supported in this browser. Use the search box to type the medicine name.')
          return
        }
        const detector = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] })
        const scan = async () => {
          if (cancelled || !cameraVideoRef.current || cameraVideoRef.current.readyState < 2) {
            if (!cancelled) raf = requestAnimationFrame(scan)
            return
          }
          try {
            const codes = await detector.detect(cameraVideoRef.current)
            const value = codes?.[0]?.rawValue?.trim()
            if (value) {
              setScannedBarcode(value)
              setCameraOpen(false)
              return
            }
          } catch { /* keep scanning */ }
          if (!cancelled) raf = requestAnimationFrame(scan)
        }
        raf = requestAnimationFrame(scan)
      } catch {
        toast.error('Camera permission was denied or the camera is unavailable.')
        setCameraOpen(false)
      }
    }
    void start()
    return () => {
      cancelled = true
      if (raf) cancelAnimationFrame(raf)
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
      cameraStreamRef.current = null
      if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null
    }
  }, [cameraOpen])

  useEffect(() => {
    if (!barcodeMedicine) return
    setSelectedSuggestionId(barcodeMedicine._id)
    setSearchQuery(barcodeMedicine.name)
    setSubmittedSearchQuery(barcodeMedicine.name)
    setShowSearchSuggestions(false)
    setScannedBarcode('')
    requestAnimationFrame(scrollToProducts)
    toast.success('Found: ' + barcodeMedicine.name)
  }, [barcodeMedicine])

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
    const q = submittedSearchQuery.trim().toLowerCase()
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
  }, [medicines, searchedMedicines, submittedSearchQuery, activeCategory, activeShopCategory, searchSource])

  const sameComposition = useMemo(() => {
    const q = submittedSearchQuery.trim().toLowerCase()
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
  }, [medicines, searchedMedicines, submittedSearchQuery, filteredMedicines, searchSource])

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim()
    if (q.length < 2) return []
    return rankSearchResults(searchSource, q).slice(0, 8)
  }, [searchSource, searchQuery, filteredMedicines])

  const searchBrands = useMemo(() => {
    const q = normalizeSearchText(searchQuery)
    if (q.length < 2) return []
    return Array.from(new Set(searchSource.map((m) => m.manufacturer).filter(Boolean) as string[]))
      .filter((brand) => normalizeSearchText(brand).includes(q) || normalizeSearchText(brand).split(/\s+/).some((part) => part.startsWith(q)))
      .slice(0, 4)
  }, [searchSource, searchQuery])

  const searchCategories = useMemo(() => {
    const q = normalizeSearchText(searchQuery)
    if (q.length < 2) return []
    return Array.from(new Set(searchSource.flatMap((m) => [m.category, m.shopCategory].filter(Boolean) as string[])))
      .filter((category) => normalizeSearchText(category).includes(q))
      .slice(0, 5)
  }, [searchSource, searchQuery])

  const searchHealthProducts = useMemo(() => {
    const q = searchQuery.trim()
    if (q.length < 2) return []
    return rankSearchResults(searchSource.filter((m) => m.shopCategory !== 'Pet Care' && !m.requiresPrescription), q).slice(0, 4)
  }, [searchSource, searchQuery, filteredMedicines])

  const filteredSearchMedicines = useMemo(() => {
    if (!submittedSearchQuery.trim()) return filteredMedicines
    return filteredMedicines.filter((m) => {
      const brandOk = searchBrandFilter === 'All' || (m.manufacturer ?? '') === searchBrandFilter
      const stockOk = searchAvailabilityFilter === 'all' || (searchAvailabilityFilter === 'in' ? m.stock > 0 : m.stock <= 0)
      const rxOk = searchRxFilter === 'all' || (searchRxFilter === 'rx' ? m.requiresPrescription : !m.requiresPrescription)
      const priceOk = searchPriceFilter === 'all' || (searchPriceFilter === 'under500' ? m.price < 500 : searchPriceFilter === '500to1000' ? m.price >= 500 && m.price <= 1000 : m.price > 1000)
      return brandOk && stockOk && rxOk && priceOk
    })
  }, [filteredMedicines, submittedSearchQuery, searchBrandFilter, searchAvailabilityFilter, searchRxFilter, searchPriceFilter])

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
  const manufacturers = useMemo(() => {
    const fromCatalogue = allManufacturers(companyProducts)
    return Array.from(new Set([...FEATURED_COMPANIES, ...fromCatalogue]))
  }, [companyProducts])
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
  const careCollections = useMemo(() => [
    { id: 'skin', query: 'serum', title: 'Skin Care & Serums', subtitle: 'Daily skin & beauty care', mark: 'SKIN', tone: 'from-fuchsia-950 via-purple-900 to-slate-950', products: medicines.filter((m) => m.active && /skin|serum|face|cream|lotion|gel|moistur/i.test(`${m.name} ${m.category ?? ''}`)).slice(0, 10) },
    { id: 'baby', query: 'baby', title: 'Baby Care', subtitle: 'Gentle care for little ones', mark: 'BABY', tone: 'from-rose-950 via-pink-900 to-slate-950', products: medicines.filter((m) => m.active && /baby|infant|newborn|diaper|feeding/i.test(`${m.name} ${m.category ?? ''} ${m.shopCategory ?? ''}`)).slice(0, 10) },
    { id: 'nutrition', query: 'vitamin', title: 'Vitamins & Nutrition', subtitle: 'Daily nutrition & wellness', mark: 'VIT', tone: 'from-emerald-950 via-teal-900 to-slate-950', products: medicines.filter((m) => m.active && /vitamin|protein|nutrition|omega|calcium|supplement|multivit/i.test(`${m.name} ${m.category ?? ''} ${m.shopCategory ?? ''}`)).slice(0, 10) },
    { id: 'pet', query: 'Pet Care', title: 'Pet & Veterinary', subtitle: 'Food, medicines & daily care', mark: 'VET', tone: 'from-sky-950 via-cyan-900 to-slate-950', products: medicines.filter((m) => m.active && m.shopCategory === 'Pet Care').slice(0, 10) },
  ], [medicines])
  const visibleShopCategories = SHOP_CATEGORIES
  const companyRailRef = useRef<HTMLDivElement>(null)
  const [companyAutoPaused, setCompanyAutoPaused] = useState(false)
  const AMAZON_NAV_ITEMS = ['Pharmacy', 'Latest', 'Petcare', 'Consult', 'Adult', 'Health', 'Health Plan'] as const
  const [activeAmazonNav, setActiveAmazonNav] = useState<(typeof AMAZON_NAV_ITEMS)[number]>('Pharmacy')

  useEffect(() => { setVisible(24) }, [submittedSearchQuery, activeCategory, activeShopCategory])

  useEffect(() => {
    if (manufacturers.length < 2 || companyAutoPaused) return
    const rail = companyRailRef.current
    if (!rail) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const elapsed = now - last
      last = now
      if (!companyAutoPaused && !rail.matches(':hover')) {
        rail.scrollLeft += Math.min(0.42, elapsed * 0.022)
        const half = rail.scrollWidth / 2
        if (half > 1 && rail.scrollLeft >= half) rail.scrollLeft -= half
      }
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [manufacturers.length, companyAutoPaused])
  const browsing = submittedSearchQuery.trim() !== '' || activeShopCategory !== null || activeCategory !== 'All'

  function selectShopCategory(name: string) {
    setActiveShopCategory((prev) => (prev === name ? null : name))
    setActiveCategory('All')
    requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  function clearFilters() {
    setSearchQuery('')
    setSubmittedSearchQuery('')
    setSelectedSuggestionId(null)
    setDebouncedSearchQuery('')
    setShowSearchSuggestions(false)
    setActiveCategory('All')
    setActiveShopCategory(null)
    setSearchBrandFilter('All')
    setSearchAvailabilityFilter('all')
    setSearchRxFilter('all')
    setSearchPriceFilter('all')
  }
  function applySearch(term: string, selectedId: string | null = null) {
    const value = term.trim()
    setSelectedSuggestionId(selectedId)
    setSearchQuery(value)
    setSubmittedSearchQuery(value)
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
      setSearchQuery('')
      setSubmittedSearchQuery('')
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
  function handleCameraClick() { setScannedBarcode(''); setCameraOpen(true) }
  function handlePhotoChosen() { toast.info('Use the camera button to scan a medicine barcode.') }
  function selectSearchSuggestion(med: (typeof medicines)[number]) {
    setSelectedSuggestionId(med._id)
    applySearch(med.name, med._id)
  }

  function handleMicClick() {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) { toast.error('Voice search is not supported on this device/browser'); return }
    const recognition = new SpeechRecognition()
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = (e: any) => { const text = e.results?.[0]?.[0]?.transcript; if (text) { setSelectedSuggestionId(null); setSearchQuery(text); setSubmittedSearchQuery(text) } }
    recognition.onerror = () => setListening(false)
    try { recognition.start() } catch { setListening(false); toast.error('Voice search could not be started. Please try again.') }
  }
  function renderSearch(id: string) {
    const hasQuery = searchQuery.trim().length >= 2
    const showPanel = showSearchSuggestions
    return (
      <div className="relative z-[210] rounded-[1.35rem] border-2 border-primary/20 bg-gradient-to-r from-primary/[0.07] via-white to-brand-teal/[0.07] p-1.5 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.55)]">
        <span className="pointer-events-none absolute -top-2.5 left-4 z-10 rounded-full border border-primary/20 bg-white px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-primary shadow-sm">Search medicines</span>
        <Search className="pointer-events-none absolute left-5 top-1/2 z-10 size-5 -translate-y-1/2 text-primary" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-1 -z-0 rounded-xl bg-primary/[0.035]" aria-hidden="true" />
        <label htmlFor={id} className="sr-only">Search medicines, health products and more</label>
        <Input
          id={id}
          value={searchQuery}
          onChange={(e) => { setSelectedSuggestionId(null); setSearchQuery(e.target.value); setShowSearchSuggestions(true) }}
          onFocus={() => setShowSearchSuggestions(true)}
          onKeyDown={(e) => {
            // Only an explicit Enter key should submit the search. Android/browser
            // keyboards can occasionally report an input key event unexpectedly,
            // so keep normal alphabetic typing completely passive.
            if (e.key === 'Escape') {
              setShowSearchSuggestions(false)
              return
            }
            if (e.key !== 'Enter' || e.isComposing || e.nativeEvent.isComposing) return
            e.preventDefault()
            const value = searchQuery.trim()
            if (!value) return
            setSelectedSuggestionId(null)
            setSubmittedSearchQuery(value)
            saveSearchHistory(value)
            setShowSearchSuggestions(false)
            requestAnimationFrame(scrollToProducts)
          }}
          placeholder="Search medicines, health products & more"
          className="h-14 rounded-xl border-0 bg-white pl-12 pr-28 text-sm font-semibold shadow-inner transition-[box-shadow,background-color] hover:bg-primary/[0.02] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/25 sm:text-base"
          autoComplete="off"
          enterKeyHint="search"
          inputMode="search"
        />
        <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center rounded-xl bg-background/90 shadow-sm ring-1 ring-primary/10">
          {searchQuery && <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setSelectedSuggestionId(null); setSearchQuery(''); setDebouncedSearchQuery(''); setShowSearchSuggestions(true) }} className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary" aria-label="Clear searchQuery"><X className="size-4" /></button>}
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
                <section className="border-t border-border px-2 pb-2 pt-3" aria-label="Brand suggestions"><div className="mb-2 flex items-center gap-2 text-xs font-bold"><Tag className="size-4 text-primary" /> Brands</div><div className="flex flex-wrap gap-2">{searchBrands.map((brand) => <button key={brand} type="button" onClick={() => { setSearchBrandFilter(brand); setSearchQuery(brand); setSubmittedSearchQuery(brand); saveSearchHistory(brand); setShowSearchSuggestions(false); requestAnimationFrame(scrollToProducts) }} className="rounded-full border border-border bg-background px-3 py-2 text-xs font-medium hover:border-primary/40 hover:bg-primary/5">{brand}</button>)}</div></section>
              )}
              {hasQuery && searchCategories.length > 0 && (
                <section className="border-t border-border px-2 pb-2 pt-3" aria-label="Category suggestions"><div className="mb-2 flex items-center gap-2 text-xs font-bold"><PackageSearch className="size-4 text-primary" /> Categories</div><div className="flex flex-wrap gap-2">{searchCategories.map((category) => <button key={category} type="button" onClick={() => { setSearchQuery(category); setSubmittedSearchQuery(category); setSearchHistory((prev) => prev); setShowSearchSuggestions(false); requestAnimationFrame(scrollToProducts) }} className="rounded-full border border-border bg-background px-3 py-2 text-xs font-medium hover:border-primary/40 hover:bg-primary/5">{category}</button>)}</div></section>
              )}
              {hasQuery && searchHealthProducts.length > 0 && (
                <section className="border-t border-border px-2 pb-1 pt-3" aria-label="Health products"><div className="mb-2 text-xs font-bold">Health products</div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{searchHealthProducts.map((med) => <button key={med._id} type="button" onClick={() => selectSearchSuggestion(med)} className="min-w-0 rounded-xl border border-border bg-background p-2 text-left hover:border-primary/40"><ProductImage category={med.category} shopCategory={med.shopCategory} imageUrl={med.imageUrl} alt="" className="rounded-lg ring-0" /><p className="mt-1 line-clamp-2 text-[11px] font-semibold">{med.name}</p><p className="text-xs font-bold text-primary">{formatINR(med.price)}</p></button>)}</div></section>
              )}
              {hasQuery && searchSuggestions.length === 0 && searchBrands.length === 0 && searchCategories.length === 0 && (
                <div className="px-4 py-7 text-center"><p className="text-sm font-semibold">Couldn't find what you're looking for</p><p className="mt-1 text-xs text-muted-foreground">Try a shorter medicine name, brand, or browse a category below.</p><div className="mt-3 flex flex-wrap justify-center gap-2">{categories.slice(1, 6).map((cat) => <button key={cat} type="button" onClick={() => { setSearchQuery(cat); setShowSearchSuggestions(false); requestAnimationFrame(scrollToProducts) }} className="rounded-full border border-border px-3 py-2 text-xs font-medium hover:border-primary/40">{cat}</button>)}</div></div>
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
      <header className="relative z-[200] isolate border-b border-border bg-card/95 shadow-[0_1px_12px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <div className="flex shrink-0 items-center gap-2"><ProfileDrawer /><BrandLogo /></div>
          <div className="hidden min-w-0 flex-1 md:block">{renderSearch('site-searchQuery-desktop')}</div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button type="button" onClick={() => { const saved = window.localStorage.getItem("wellcare-saved-delivery-address"); toast.info(saved ? `Delivery address: ${saved}` : "Choose Home Delivery at checkout and pin your address on the map."); }} className="flex max-w-[132px] min-w-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-2 text-[10px] font-bold text-emerald-800 transition hover:bg-emerald-100 sm:max-w-[220px] sm:gap-1.5 sm:px-3 sm:text-xs" aria-label="Delivery address"><MapPin className="size-3.5 shrink-0" /><span className="shrink-0">Deliver to</span><span className="truncate">{typeof window !== "undefined" ? (window.localStorage.getItem("wellcare-saved-delivery-address") || "Set address") : "Set address"}</span></button>
            <button onClick={toggleLang} className="hidden items-center gap-1 rounded-full border border-border bg-background px-3 py-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground sm:flex" aria-label="Switch language"><Languages className="size-3.5" />{lang === 'en' ? 'हिंदी' : 'English'}</button>
            <Popover><PopoverTrigger asChild><button className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:border-primary/30 hover:bg-secondary" aria-label="Notifications"><Bell className="size-4" /></button></PopoverTrigger><PopoverContent className="w-64 text-sm text-muted-foreground">No new notifications right now.</PopoverContent></Popover>
            <Button variant="default" className="relative size-9 gap-2 rounded-full p-0 sm:w-auto sm:px-3" onClick={() => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))} data-testid="cart-button" aria-label="Open cart"><ShoppingCart className="size-4" /><span className="hidden sm:inline">Cart</span>{count > 0 && <Badge className="absolute -right-1 -top-1 ml-0 bg-highlight px-1.5 text-[9px] text-highlight-foreground sm:static sm:px-1.5">{count}</Badge>}</Button>
          </div>
        </div>
        <nav aria-label="Shop by category" className="hidden border-t border-border/80 md:block">
          <div className="mx-auto flex max-w-[1600px] min-w-0 items-center gap-1 overflow-x-auto px-4 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            
            <button onClick={() => { clearFilters(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="border-b-2 border-transparent px-3 py-2.5 font-medium text-muted-foreground transition-colors hover:text-foreground">All Products</button>
            {visibleShopCategories.map(({ name }) => <button key={name} onClick={() => selectShopCategory(name)} aria-pressed={activeShopCategory === name} className={cn('border-b-2 px-3 py-2.5 font-medium transition-colors', activeShopCategory === name ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>{name}</button>)}
            <button type="button" onClick={() => { const saved = window.localStorage.getItem("wellcare-saved-delivery-address"); if (saved) { toast.info(`Saved delivery address: ${saved}`) } else { toast.info("Your delivery address will appear here after you select it at checkout.") } }} className="ml-auto inline-flex max-w-[280px] shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-left text-[10px] text-emerald-800 hover:bg-emerald-100"><MapPin className="size-3.5 shrink-0" /> <span className="shrink-0">Deliver to</span> <span className="truncate font-bold">{typeof window !== "undefined" ? (window.localStorage.getItem("wellcare-saved-delivery-address") || ("Roorkee " + STORE_LOCATION.pincode)) : ("Roorkee " + STORE_LOCATION.pincode)}</span></button>
          </div>
        </nav>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChosen} />
      </header>

      {!browsing && <HeroCarousel onShop={scrollToProducts} />}
      {!browsing && <div className="mx-auto max-w-[1600px] px-3 md:hidden">
        <CategoryRail title="SHOP & CARE" subtitle="Quick access" items={SHOP_AND_CARE} onSelect={(item) => {
          if (item.routeKey === 'Latest') { clearFilters(); requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); return }
          if (item.routeKey === 'OTC & Wellness' || item.routeKey === 'Sexual Wellness') { setActiveShopCategory(null); setActiveCategory('All'); setSearchQuery(item.routeKey); setSubmittedSearchQuery(item.routeKey); setShowSearchSuggestions(false); requestAnimationFrame(scrollToProducts); return }
          selectShopCategory(item.routeKey)
        }} />
        <div className="px-0.5 py-3">{renderSearch('site-searchQuery')}</div>
        <CategoryRail title="MEDICINE TYPES" subtitle="Find by form or category" items={MEDICINE_FORM_SLIDER} onSelect={(item) => { setSelectedSuggestionId(null); setSearchQuery(item.routeKey); setSubmittedSearchQuery(item.routeKey); setShowSearchSuggestions(false); requestAnimationFrame(scrollToProducts) }} />
              </div>}
      {!browsing && <div className="hidden border-b border-border/70 bg-background md:block">
        <CategoryRail title="SHOP & CARE" subtitle="Quick access" items={SHOP_AND_CARE} onSelect={(item) => {
          if (item.routeKey === 'Latest') { clearFilters(); requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); return }
          if (item.routeKey === 'OTC & Wellness' || item.routeKey === 'Sexual Wellness') { setActiveShopCategory(null); setActiveCategory('All'); setSearchQuery(item.routeKey); setSubmittedSearchQuery(item.routeKey); setShowSearchSuggestions(false); requestAnimationFrame(scrollToProducts); return }
          selectShopCategory(item.routeKey)
        }} />
        <CategoryRail title="MEDICINE TYPES" subtitle="Find by form or category" items={MEDICINE_FORM_SLIDER} onSelect={(item) => { setSelectedSuggestionId(null); setSearchQuery(item.routeKey); setSubmittedSearchQuery(item.routeKey); setShowSearchSuggestions(false); requestAnimationFrame(scrollToProducts) }} />
      </div>}

      {!browsing && <section className="mx-auto max-w-[1600px] px-4 py-3" aria-label="Medicines and healthcare"><SectionHeading title="Medicines & Healthcare" subtitle="Trusted brands, better health." icon={<Pill className="size-5" />} action={<Button variant="ghost" size="sm" className="text-primary" onClick={scrollToProducts}>View all</Button>} /><ProductsErrorBoundary>{status === 'LoadingFirstPage' ? <Carousel>{Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} variant="carousel" />)}</Carousel> : featured.length === 0 ? <p className="text-sm text-muted-foreground">Products will appear here soon.</p> : <Carousel>{featured.slice(0, 20).map((med) => <ProductCard key={med._id} med={med} variant="carousel" onAdd={handleAddToCart} />)}</Carousel>}</ProductsErrorBoundary></section>}

      {!browsing && <OfferCards />}
      {!browsing && manufacturers.length > 0 && <section className="mx-auto max-w-[1600px] px-4 py-5" aria-label="Top Brands and Companies">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-teal">Trusted manufacturers</p><h2 className="mt-1 text-lg font-extrabold tracking-tight text-foreground sm:text-xl">Top Brands & Companies</h2><p className="mt-0.5 text-[11px] text-muted-foreground">Shop medicines by manufacturer</p></div><span className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{manufacturers.length} brands</span></div>
          <div className="relative w-full rounded-2xl border border-primary/15 bg-card shadow-[0_10px_30px_-18px_rgba(15,23,42,0.65)] ring-1 ring-primary/5">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-7 rounded-l-2xl bg-gradient-to-r from-card to-transparent sm:w-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-7 rounded-r-2xl bg-gradient-to-l from-card to-transparent sm:w-10" />
            <div ref={companyRailRef} className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" onMouseEnter={() => setCompanyAutoPaused(true)} onMouseLeave={() => setCompanyAutoPaused(false)} onPointerDown={() => setCompanyAutoPaused(true)} onPointerUp={() => window.setTimeout(() => setCompanyAutoPaused(false), 900)} onPointerCancel={() => window.setTimeout(() => setCompanyAutoPaused(false), 900)} onTouchStart={() => setCompanyAutoPaused(true)} onTouchEnd={() => window.setTimeout(() => setCompanyAutoPaused(false), 900)} aria-label="Top brands and company slider">
              {[...manufacturers, ...manufacturers].map((company, index) => <button key={company + "-top-brand-" + index} type="button" onClick={() => { setActiveShopCategory(null); setActiveCategory('All'); setSearchQuery(company); setSubmittedSearchQuery(company); setShowSearchSuggestions(false); requestAnimationFrame(scrollToProducts) }} className="group flex h-[104px] w-[136px] shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-background p-2.5 text-center transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/[0.03] hover:shadow-md sm:h-[112px] sm:w-[150px]" aria-label={"Open " + company + " brand"}>
                <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white shadow-sm transition group-hover:scale-105 sm:size-12" aria-hidden="true">
                  <span className={cn('absolute inset-0 flex items-center justify-center rounded-xl', monogramTone('company-' + company))}>
                    <span className="text-[11px] font-black tracking-tight text-white sm:text-xs">{companyMonogram(company)}</span>
                  </span>
                  {companyLogo(company) ? <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/95 p-1.5">
                    <img src={companyLogo(company)} alt="" className="max-h-8 max-w-12 object-contain sm:max-h-9 sm:max-w-14" loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.parentElement?.remove() }} />
                  </span> : null}
                </span>
                <span className="block max-w-full truncate text-[11px] font-bold sm:text-xs">{company}</span>
                <span className="text-[9px] text-muted-foreground">{manufacturerCounts.get(company) ?? manufacturerCounts.get(company.replace(/\s+Pharmacy$/i, '')) ?? 0} products</span>
              </button>)}
            </div>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">Swipe to explore • Auto-scroll pauses while you interact</p>
        </div>
      </section>}

      {!browsing && <section className="mx-auto max-w-[1600px] px-4 py-6" aria-label="Care and shopping categories">
        <SectionHeading title="Top Categories" subtitle="Explore the essentials customers shop most." />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {careCollections.map((item) => (
            <button key={item.id} type="button" onClick={() => { setActiveCategory('All'); setSearchQuery(item.query); setSubmittedSearchQuery(item.query); setShowSearchSuggestions(false); requestAnimationFrame(scrollToProducts) }} className="group relative min-h-[132px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-4 text-left text-white shadow-[0_10px_28px_-18px_rgba(15,23,42,0.7)] ring-1 ring-white/5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-16px_rgba(15,23,42,0.75)]">
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-95', item.tone)} />
              <div className="relative z-10"><span className="inline-flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[9px] font-black tracking-wider backdrop-blur-sm">{item.mark}</span><h3 className="mt-3 text-sm font-extrabold sm:text-base">{item.title}</h3><p className="mt-0.5 text-[10px] text-white/65">{item.subtitle}</p><span className="mt-3 inline-flex rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-bold">Explore →</span></div>
              <span className="absolute -bottom-8 -right-6 size-28 rounded-full border border-white/10 bg-white/5" />
            </button>
          ))}
        </div>
      </section>}

      {!browsing && <section className="border-y border-border bg-card" aria-label="Featured shopping collections">
        <div className="mx-auto max-w-[1600px] px-4 py-6">
          <SectionHeading title="Popular Healthcare Picks" subtitle="Available products from your current catalogue." action={<Button variant="ghost" size="sm" className="text-primary" onClick={scrollToProducts}>View all</Button>} />
          <ProductsErrorBoundary><Carousel>{featured.slice(0, 12).map((med) => <ProductCard key={med._id} med={med} variant="carousel" onAdd={handleAddToCart} />)}</Carousel></ProductsErrorBoundary>
        </div>
      </section>}

      {!browsing && <section className="mx-auto max-w-[1600px] px-3 py-6 sm:px-4 sm:py-8" aria-label="Why choose Wellcare Medicose">
        <div className="relative mb-5 overflow-hidden rounded-[28px] border border-sky-100 bg-gradient-to-br from-white via-sky-50/70 to-emerald-50/70 px-5 py-6 shadow-[0_12px_36px_-24px_rgba(15,63,100,0.35)] sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-sky-100/60 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 size-48 rounded-full bg-emerald-100/60 blur-2xl" />
          <div className="relative z-10 grid items-center gap-5 md:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 sm:text-xs">WHY WELLCARE</p>
              <h2 className="mt-2 text-3xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">Simple, local &amp;<br className="hidden sm:block" /> <span className="bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">trustworthy.</span></h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">Quality medicines, trusted brands, right at your doorstep.</p>
              <span className="mt-4 block h-1 w-16 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500" />
            </div>
            <div className="relative mx-auto flex w-full max-w-[290px] items-center justify-center md:mr-3 md:size-56 md:w-56">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-100 to-emerald-100 blur-xl" />
              <div className="relative flex size-40 items-center justify-center rounded-[34px] border border-white bg-white/85 shadow-[0_18px_40px_-20px_rgba(15,63,100,0.3)] sm:size-48">
                <div className="absolute inset-3 rounded-[27px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-sky-50" />
                <div className="relative flex size-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-emerald-500 to-sky-600 text-white shadow-lg sm:size-28"><PillBottle className="size-14 sm:size-16" strokeWidth={1.6} /></div>
                <span className="absolute -bottom-2 -right-2 flex size-11 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-white shadow-md"><ShieldCheck className="size-4" /></span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group flex min-h-[96px] items-center gap-3 overflow-hidden rounded-[20px] border border-emerald-200/80 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-3 shadow-[0_8px_24px_-18px_rgba(5,150,105,0.45)] transition hover:-translate-y-0.5 hover:shadow-lg sm:p-3.5">
            <div className="flex size-[52px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 shadow-inner"><ShieldCheck className="size-8" strokeWidth={1.8} /></div>
            <div className="min-w-0 flex-1"><h3 className="text-[13px] font-extrabold text-slate-900 sm:text-sm">Trusted Pharmacy</h3><p className="mt-1 text-[11px] leading-snug text-slate-600 sm:text-xs">Your local pharmacy for everyday healthcare needs.</p></div>
            <span className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition group-hover:translate-x-0.5 sm:flex"><ChevronRight className="size-4" /></span>
          </div>
          <div className="group flex min-h-[96px] items-center gap-3 overflow-hidden rounded-[20px] border border-sky-200/80 bg-gradient-to-r from-sky-50 via-blue-50 to-white p-3 shadow-[0_8px_24px_-18px_rgba(2,132,199,0.4)] transition hover:-translate-y-0.5 hover:shadow-lg sm:p-3.5">
            <div className="flex size-[52px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 text-sky-700 shadow-inner"><Truck className="size-8" strokeWidth={1.8} /></div>
            <div className="min-w-0 flex-1"><h3 className="text-[13px] font-extrabold text-slate-900 sm:text-sm">Delivery &amp; Pickup</h3><p className="mt-1 text-[11px] leading-snug text-slate-600 sm:text-xs">Choose the available fulfilment option at checkout.</p></div>
            <span className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 transition group-hover:translate-x-0.5 sm:flex"><ChevronRight className="size-4" /></span>
          </div>
          <div className="group flex min-h-[96px] items-center gap-3 overflow-hidden rounded-[20px] border border-violet-200/80 bg-gradient-to-r from-violet-50 via-purple-50 to-white p-3 shadow-[0_8px_24px_-18px_rgba(124,58,237,0.35)] transition hover:-translate-y-0.5 hover:shadow-lg sm:p-3.5">
            <div className="flex size-[52px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 text-violet-700 shadow-inner"><PillBottle className="size-8" strokeWidth={1.8} /></div>
            <div className="min-w-0 flex-1"><h3 className="text-[13px] font-extrabold text-slate-900 sm:text-sm">Clear Details</h3><p className="mt-1 text-[11px] leading-snug text-slate-600 sm:text-xs">Product information and prescription status stay visible.</p></div>
            <span className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 transition group-hover:translate-x-0.5 sm:flex"><ChevronRight className="size-4" /></span>
          </div>
          <div className="group flex min-h-[96px] items-center gap-3 overflow-hidden rounded-[20px] border border-orange-200/80 bg-gradient-to-r from-orange-50 via-amber-50 to-white p-3 shadow-[0_8px_24px_-18px_rgba(217,119,6,0.35)] transition hover:-translate-y-0.5 hover:shadow-lg sm:p-3.5">
            <div className="flex size-[52px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 shadow-inner"><Lock className="size-8" strokeWidth={1.8} /></div>
            <div className="min-w-0 flex-1"><h3 className="text-[13px] font-extrabold text-slate-900 sm:text-sm">Secure Checkout</h3><p className="mt-1 text-[11px] leading-snug text-slate-600 sm:text-xs">Your order and payment preference stay in one flow.</p></div>
            <span className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 transition group-hover:translate-x-0.5 sm:flex"><ChevronRight className="size-4" /></span>
          </div>
        </div>
      </section>}

      {!browsing && lastOrder && lastOrder.length > 0 && <section className="mx-auto max-w-[1600px] px-3 py-5 sm:px-4 sm:py-6" aria-label="Based on your previous orders">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"><RefreshCw className="size-5" /></span>
            <div className="min-w-0"><h2 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">{t('reorder')}</h2><p className="text-[11px] text-slate-500">Your previous orders, ready to order again</p></div>
          </div>
          <Link to="/orders" className="shrink-0 text-xs font-semibold text-emerald-600 hover:text-emerald-700">View all <span aria-hidden="true">→</span></Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {lastOrder.slice(0, 3).map((order, index) => <Card key={order._id} className={cn("w-[min(82vw,350px)] shrink-0 overflow-hidden rounded-[22px] border bg-white shadow-[0_8px_24px_-18px_rgba(15,63,100,0.35)]", index % 2 === 0 ? "border-sky-100" : "border-emerald-100")}>
            <CardContent className="flex items-center gap-3 p-3">
              <div className={cn("flex size-[74px] shrink-0 items-center justify-center overflow-hidden rounded-2xl", index % 2 === 0 ? "bg-gradient-to-br from-sky-50 to-blue-100 text-sky-600" : "bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-600")}><PackageSearch className="size-9" strokeWidth={1.6} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Order #{order._id.slice(-6).toUpperCase()}</p>
                <p className="mt-1 line-clamp-2 text-xs font-bold leading-snug text-slate-800 sm:text-sm">{order.items.map((it) => it.name).join(', ')}</p>
                <Button size="sm" className={cn("mt-2 h-9 w-full rounded-full text-xs font-bold shadow-sm", index % 2 === 0 ? "bg-sky-600 hover:bg-sky-700" : "bg-emerald-600 hover:bg-emerald-700")} onClick={() => { order.items.forEach((it) => addToCart({ _id: it.medicineId, name: it.name, price: it.price, stock: 9999 }, () => {})); fireCartToast('✓ Items added to cart') }}><RefreshCw className="mr-1.5 size-3.5" />{t('reorder')}</Button>
              </div>
            </CardContent>
          </Card>)}
        </div>
      </section>}

      <main ref={gridRef} className="mx-auto max-w-[1600px] scroll-mt-40 px-4 py-6"><SectionHeading title={activeShopCategory ?? (submittedSearchQuery.trim() ? `Results for “${submittedSearchQuery.trim()}”` : t('all_products'))} subtitle={status === 'LoadingFirstPage' ? undefined : `${filteredSearchMedicines.length} product${filteredSearchMedicines.length === 1 ? '' : 's'}`} action={browsing ? <button onClick={clearFilters} className="text-xs font-medium text-primary underline-offset-2 hover:underline">Clear filters</button> : undefined} />
        {submittedSearchQuery.trim() && filteredMedicines.length > 0 && (
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
          {(submittedSearchQuery.trim() ? ['All', ...Array.from(new Set(filteredMedicines.map((m) => m.category))).sort()] : categories).map((cat) => <button key={cat} onClick={() => setActiveCategory(cat)} aria-pressed={activeCategory === cat} className={cn('shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors', activeCategory === cat ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/40')}>{cat}</button>)}
        </div>
        {submittedSearchQuery.trim() && (
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
      {cameraOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Scan medicine barcode">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-slate-950 text-white shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3">
              <div><p className="text-sm font-bold">Scan medicine</p><p className="text-[11px] text-white/60">Point the camera at the product barcode</p></div>
              <button type="button" onClick={() => setCameraOpen(false)} className="flex size-9 items-center justify-center rounded-full bg-white/10" aria-label="Close camera"><X className="size-4" /></button>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden bg-black">
              <video ref={cameraVideoRef} playsInline muted className="h-full w-full object-cover" aria-label="Medicine camera scanner" />
              <div className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-2xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(2,6,23,0.32)]" />
              <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-emerald-400/90" />
            </div>
            <div className="px-4 py-3 text-center text-[11px] text-white/65">Barcode scanning uses your device camera. Camera access stays on this page.</div>
          </div>
        </div>
      )}
      <StoreInfoCards /><SiteFooter />
    </div>
  )
}
