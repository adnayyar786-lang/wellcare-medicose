import { Link } from '@tanstack/react-router'
import { Clock, MapPin, MessageCircle, Navigation } from 'lucide-react'

import { STORE_LOCATION } from '@/config/store-location'
import { cn } from '@/lib/utils'

// Wellcare Medicose brand pieces shared by every customer page.

const STORE_WHATSAPP = '917088252556'

// A simple original mark (plus sign + leaf) in the brand blue → teal.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn('size-9 shrink-0', className)} aria-hidden="true">
      <defs>
        <linearGradient id="wc-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0B5CA8" />
          <stop offset="1" stopColor="#0E9F8E" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#wc-mark)" />
      <path d="M20.5 11h7v9.5H37v7h-9.5V37h-7v-9.5H11v-7h9.5z" fill="#fff" />
      <path d="M31 8.5c6.5 0 9.5 3.2 9.5 9.5-6.5 0-9.5-3.2-9.5-9.5z" fill="#A7F3D0" />
    </svg>
  )
}

export function BrandLogo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2', className)} aria-label="Wellcare Medicose home">
      <BrandMark />
      <span className="leading-none">
        <span className={cn('block text-base font-bold tracking-tight', light ? 'text-white' : 'text-primary')}>
          Wellcare
        </span>
        <span
          className={cn(
            'block text-[11px] font-semibold uppercase tracking-[0.22em]',
            light ? 'text-teal-200' : 'text-brand-teal',
          )}
        >
          Medicose
        </span>
      </span>
    </Link>
  )
}

export function SectionHeading({
  title,
  subtitle,
  icon,
  action,
  level = 'h2',
}: {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  level?: 'h1' | 'h2'
}) {
  const Heading = level
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            {icon}
          </span>
        )}
        <div>
          <Heading className="text-lg font-bold leading-tight tracking-tight">{title}</Heading>
          {subtitle && <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

// "Your local pharmacy" + "Need help?" cards (real address, hours and WhatsApp only).
export function StoreInfoCards() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_LOCATION.label)}`
  return (
    <section className="mx-auto max-w-6xl px-4 py-6" aria-label="Visit or contact us">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-teal">Your local pharmacy</p>
          <h2 className="mt-1 text-lg font-bold">Wellcare Medicose</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A physical pharmacy you can also order from online — choose Home Delivery or Store Pickup at checkout.
          </p>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" /> {STORE_LOCATION.label}
            </li>
            <li className="flex gap-2">
              <Clock className="mt-0.5 size-4 shrink-0 text-primary" /> Open 24×7 · Store Pickup available
            </li>
          </ul>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-secondary"
          >
            <Navigation className="size-4" /> Visit our store
          </a>
        </div>
        <div className="rounded-2xl bg-navy p-5 text-navy-foreground">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">Need help?</p>
          <h2 className="mt-1 text-lg font-bold text-white">Our team is here for you</h2>
          <p className="mt-1 text-sm text-navy-foreground/75">Ask about a medicine, an order or pet care products.</p>
          <a
            href={`https://wa.me/${STORE_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
          >
            <MessageCircle className="size-4" /> Chat on WhatsApp
          </a>
          <p className="mt-2 text-xs text-navy-foreground/60">+91 {STORE_WHATSAPP.slice(2)} · Open 24×7</p>
        </div>
      </div>
    </section>
  )
}

export function SiteFooter() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_LOCATION.label)}`
  const link = 'inline-block py-1 text-sm text-navy-foreground/75 transition-colors hover:text-white'
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <BrandLogo light />
          <p className="mt-3 max-w-xs text-sm text-navy-foreground/75">
            A physical pharmacy you can also order from online — choose Home Delivery or Store Pickup at checkout.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Shop</h3>
          <ul className="space-y-0.5">
            <li>
              <Link to="/categories" className={link}>
                All Categories
              </Link>
            </li>
            <li>
              <Link to="/wishlist" className={link}>
                Wishlist
              </Link>
            </li>
            <li>
              <Link to="/orders" className={link}>
                My Orders
              </Link>
            </li>
            <li>
              <Link to="/profile" className={link}>
                My Account
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Support</h3>
          <ul className="space-y-0.5">
            <li>
              <Link to="/returns" className={link}>
                Return &amp; Refund Policy
              </Link>
            </li>
            <li>
              <Link to="/privacy" className={link}>
                Privacy Policy
              </Link>
            </li>
            <li>
              <a
                href={`https://wa.me/${STORE_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(link, 'inline-flex items-center gap-1.5')}
              >
                <MessageCircle className="size-4" /> Chat on WhatsApp
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">Visit our store</h3>
          <ul className="space-y-3 text-sm text-navy-foreground/75">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" /> {STORE_LOCATION.label}
            </li>
            <li className="flex gap-2">
              <Clock className="mt-0.5 size-4 shrink-0" /> Open 24×7
            </li>
            <li>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 py-1 text-teal-200 hover:text-white"
              >
                <Navigation className="size-4" /> Get directions
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-5 text-xs text-navy-foreground/60">
          <p>
            © {new Date().getFullYear()} Wellcare Medicose. Prescription medicines require a valid prescription.
          </p>
          <p>
            हम आपके browsing experience को बेहतर बनाने और बेहतर सेवा देने के लिए आपकी account activity (जैसे login और
            आपके द्वारा देखे गए products) track करते हैं।
          </p>
        </div>
      </div>
    </footer>
  )
}
