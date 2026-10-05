import { useAuthActions } from '@convex-dev/auth/react'
import { useMutation, useQuery } from 'convex/react'
import { MotionConfig, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  Bell,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Menu,
  Megaphone,
  Search,
  Pill,
  BarChart3,
  Settings,
  Users,
  Boxes,
  Store,
  type LucideIcon,
} from 'lucide-react'

import { api } from '../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { DashboardSection } from './dashboard-section'
import { AdminDataProvider, useOverview } from './data'
import {
  DEFAULT_ORDERS_FILTER,
  formatDateTime,
  type InventoryTab,
  type NavTarget,
  type OrdersFilter,
  type SectionId,
} from './format'
import { InventorySection } from './inventory-section'
import { MedicinesPanel } from './legacy-panels'
import { OrdersSection } from './orders-section'
import {
  CustomersSection,
  MarketingSection,
  PrescriptionsSection,
  ReportsSection,
  SettingsSection,
} from './other-sections'
import { SectionBoundary, SectionHeader } from './ui-bits'
import { ShopsPanel } from './shops-panel'

type NavState = {
  section: SectionId
  orders: OrdersFilter
  inventoryTab: InventoryTab
  openOrderId: string | null
  scrollTo: string | null
  search: string
}

type NavChild = { label: string; target?: NavTarget; soon?: boolean }
type NavItem = { id: SectionId; label: string; icon: LucideIcon; children?: NavChild[] }

const ordersTarget = (fulfillment: OrdersFilter['fulfillment'], group: OrdersFilter['group']): NavTarget => ({
  section: 'orders',
  orders: { fulfillment, group },
})

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    id: 'orders',
    label: 'Orders',
    icon: ClipboardList,
    children: [
      { label: 'All Orders', target: ordersTarget('all', 'all') },
      { label: 'Home Delivery', target: ordersTarget('delivery', 'all') },
      { label: 'Store Pickup', target: ordersTarget('pickup', 'all') },
      { label: 'Pending', target: ordersTarget('all', 'pending') },
      { label: 'Processing', target: ordersTarget('all', 'processing') },
      { label: 'Completed', target: ordersTarget('all', 'completed') },
      { label: 'Cancelled', target: ordersTarget('all', 'cancelled') },
    ],
  },
  {
    id: 'medicines',
    label: 'Medicines',
    icon: Pill,
    children: [
      { label: 'All Medicines', target: { section: 'medicines' } },
      { label: 'Add Medicine', target: { section: 'medicines', scrollTo: 'add-medicine' } },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Boxes,
    children: [
      { label: 'Stock', target: { section: 'inventory', inventoryTab: 'stock' } },
      { label: 'Low Stock', target: { section: 'inventory', inventoryTab: 'low' } },
      { label: 'Out of Stock', target: { section: 'inventory', inventoryTab: 'out' } },
    ],
  },
  { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
  { id: 'customers', label: 'Customers', icon: Users },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    children: [
      { label: 'Coupons', target: { section: 'marketing' } },
      { label: 'Banners', target: { section: 'marketing', scrollTo: 'banners' } },
      { label: 'Featured Products', soon: true },
    ],
  },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'shops', label: 'Shops', icon: Store },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const PAGE_TITLE: Record<SectionId, string> = {
  dashboard: 'Wellcare Medicose — Pharmacy Command Center',
  orders: 'Orders',
  medicines: 'Medicines',
  inventory: 'Inventory',
  prescriptions: 'Prescriptions',
  customers: 'Customers',
  marketing: 'Marketing',
  reports: 'Reports',
  shops: 'Shops & Retail Sales',
  settings: 'Settings',
}

function isChildActive(child: NavChild, item: NavItem, nav: NavState) {
  const t = child.target
  if (!t || nav.section !== item.id) return false
  if (item.id === 'orders') {
    return t.orders?.fulfillment === nav.orders.fulfillment && t.orders?.group === nav.orders.group
  }
  if (item.id === 'inventory') return t.inventoryTab === nav.inventoryTab
  if (item.id === 'medicines') return (t.scrollTo ?? null) === (nav.scrollTo ?? null)
  return true
}

function SidebarContent({ nav, onGo }: { nav: NavState; onGo: (t: NavTarget) => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <p className="text-base font-semibold tracking-tight text-primary">Wellcare Medicose</p>
        <p className="text-xs text-muted-foreground">Pharmacy Command Center</p>
      </div>
      <nav aria-label="Admin" className="flex-1 min-h-0 space-y-0.5 overflow-y-auto overscroll-contain touch-pan-y p-3">
        {NAV.map((item) => {
          const active = nav.section === item.id
          const Icon = item.icon
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => onGo({ section: item.id })}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors motion-reduce:transition-none',
                  active
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </button>
              {active && item.children && (
                <ul className="ml-5 mt-0.5 space-y-0.5 border-l border-border pl-2">
                  {item.children.map((child) => {
                    const childActive = isChildActive(child, item, nav)
                    return (
                      <li key={child.label}>
                        <button
                          type="button"
                          disabled={!child.target}
                          onClick={() => child.target && onGo(child.target)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors motion-reduce:transition-none',
                            childActive
                              ? 'font-medium text-primary'
                              : 'text-muted-foreground hover:text-foreground',
                            !child.target && 'cursor-not-allowed opacity-60 hover:text-muted-foreground',
                          )}
                        >
                          {child.label}
                          {child.soon && (
                            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">Soon</span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

function HeaderSearch({ onSearch }: { onSearch: (q: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="relative ml-4 hidden w-full max-w-xs md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            onSearch(value.trim())
            setValue('')
          }
        }}
        placeholder="Search orders — name, phone, ID"
        aria-label="Search orders"
        className="h-9 pl-9"
      />
    </div>
  )
}

function CustomerAlerts() {
  const notes = useQuery(api.activity.listNotifications)
  const markAllRead = useMutation(api.activity.markAllNotificationsRead)
  if (notes === undefined) return <p className="px-3 py-3 text-xs text-muted-foreground">Loading…</p>
  if (notes.length === 0) return <p className="px-3 py-3 text-xs text-muted-foreground">No customer alerts yet.</p>
  const unread = notes.filter((n) => !n.read).length
  return (
    <>
      <ul>
        {notes.slice(0, 8).map((n) => (
          <li key={n._id} className={cn('px-3 py-2 text-xs', !n.read && 'bg-secondary/60')}>
            <p>{n.message}</p>
            <p className="mt-0.5 text-muted-foreground">{formatDateTime(n.time)}</p>
          </li>
        ))}
      </ul>
      {unread > 0 && (
        <button
          type="button"
          className="w-full px-3 py-2 text-left text-xs text-primary hover:bg-secondary"
          onClick={() => void markAllRead({})}
        >
          Mark {unread} as read
        </button>
      )}
    </>
  )
}

function NotificationsMenu({ onGo }: { onGo: (t: NavTarget) => void }) {
  const [open, setOpen] = useState(false)
  const overview = useOverview()

  const alerts: Array<{ text: string; target: NavTarget }> = []
  if (overview) {
    if (overview.pendingOrders > 0) {
      alerts.push({
        text: `${plural(overview.pendingOrders, 'new order')} awaiting confirmation`,
        target: ordersTarget('all', 'pending'),
      })
    }
    if (overview.open.pickup.ready_or_out > 0) {
      alerts.push({
        text: `${plural(overview.open.pickup.ready_or_out, 'order')} ready for pickup`,
        target: ordersTarget('pickup', 'ready_or_out'),
      })
    }
    if (overview.rx.openOrderCount > 0) {
      alerts.push({
        text: `${plural(overview.rx.openOrderCount, 'open order')} with prescription medicines`,
        target: { section: 'prescriptions' },
      })
    }
    if (overview.inventory.outCount > 0) {
      alerts.push({
        text: `${plural(overview.inventory.outCount, 'medicine')} out of stock`,
        target: { section: 'inventory', inventoryTab: 'out' },
      })
    }
    if (overview.inventory.lowCount > 0) {
      alerts.push({
        text: `${plural(overview.inventory.lowCount, 'medicine')} running low`,
        target: { section: 'inventory', inventoryTab: 'low' },
      })
    }
  }
  const count = alerts.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications${count ? `, ${count} new` : ''}`} className="relative">
          <Bell className="size-5" />
          {count > 0 && (
            <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-highlight px-1 text-[10px] font-semibold text-highlight-foreground">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="max-h-96 overflow-y-auto">
          <p className="border-b border-border px-3 py-2 text-xs font-semibold">Needs attention</p>
          {alerts.length === 0 ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">Nothing needs attention right now.</p>
          ) : (
            <ul>
              {alerts.map((a) => (
                <li key={a.text}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                    onClick={() => {
                      setOpen(false)
                      onGo(a.target)
                    }}
                  >
                    {a.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="border-y border-border px-3 py-2 text-xs font-semibold">Customer alerts</p>
          <SectionBoundary label="customer alerts">
            <CustomerAlerts />
          </SectionBoundary>
        </div>
        <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          Updates automatically while this page is open. Email alerts for new orders are unchanged.
        </p>
      </PopoverContent>
    </Popover>
  )
}

export function AdminApp({ adminEmail }: { adminEmail: string | null }) {
  const { signOut } = useAuthActions()
  const [menuOpen, setMenuOpen] = useState(false)
  const [nav, setNav] = useState<NavState>({
    section: 'dashboard',
    orders: DEFAULT_ORDERS_FILTER,
    inventoryTab: 'stock',
    openOrderId: null,
    scrollTo: null,
    search: '',
  })

  function go(t: NavTarget) {
    setMenuOpen(false)
    setNav({
      section: t.section,
      orders: t.orders ?? DEFAULT_ORDERS_FILTER,
      inventoryTab: t.inventoryTab ?? 'stock',
      openOrderId: t.openOrderId ?? null,
      scrollTo: t.scrollTo ?? null,
      search: t.search ?? '',
    })
  }

  useEffect(() => {
    if (nav.scrollTo) {
      const id = nav.scrollTo
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const timer = setTimeout(
        () => document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }),
        80,
      )
      return () => clearTimeout(timer)
    }
    window.scrollTo({ top: 0 })
  }, [nav.section, nav.scrollTo])

  const initial = (adminEmail ?? 'A').charAt(0).toUpperCase()

  return (
    <MotionConfig reducedMotion="user">
      <SectionBoundary label="the admin panel">
      <AdminDataProvider>
      <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="dark sticky top-0 hidden h-screen border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block">
          <SidebarContent nav={nav} onGo={go} />
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-4 backdrop-blur lg:px-8">
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <p className="truncate text-sm font-semibold">{PAGE_TITLE[nav.section]}</p>
            <HeaderSearch onSearch={(q) => go({ section: 'orders', search: q })} />
            <div className="ml-auto flex items-center gap-1">
              <SectionBoundary
                label="notifications"
                fallback={
                  <Button variant="ghost" size="icon" disabled aria-label="Notifications unavailable">
                    <Bell className="size-5" />
                  </Button>
                }
              >
                <NotificationsMenu onGo={go} />
              </SectionBoundary>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Admin menu">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {initial}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                    {adminEmail ?? 'Admin'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => go({ section: 'settings' })}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => go({ section: 'settings' })}>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void signOut()}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetContent side="left" className="dark w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
              <SheetHeader className="sr-only">
                <SheetTitle>Admin menu</SheetTitle>
              </SheetHeader>
              <SidebarContent nav={nav} onGo={go} />
            </SheetContent>
          </Sheet>

          <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
            <motion.div
              key={nav.section}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {nav.section === 'dashboard' && <DashboardSection onNavigate={go} />}
              {nav.section === 'orders' && (
                <OrdersSection
                  key={`orders-${nav.search}`}
                  initialSearch={nav.search}
                  filter={nav.orders}
                  onFilterChange={(f) => setNav((p) => ({ ...p, orders: f }))}
                  openOrderId={nav.openOrderId}
                  onOpenOrder={(id) => setNav((p) => ({ ...p, openOrderId: id }))}
                />
              )}
              {nav.section === 'medicines' && (
                <div>
                  <SectionHeader title="Medicines" description="Add, edit, hide or remove medicines from your catalog." />
                  <SectionBoundary label="medicines">
                    <MedicinesPanel />
                  </SectionBoundary>
                </div>
              )}
              {nav.section === 'inventory' && (
                <InventorySection
                  tab={nav.inventoryTab}
                  onTabChange={(t) => setNav((p) => ({ ...p, inventoryTab: t }))}
                />
              )}
              {nav.section === 'prescriptions' && <PrescriptionsSection onNavigate={go} />}
              {nav.section === 'customers' && <CustomersSection />}
              {nav.section === 'marketing' && <MarketingSection />}
              {nav.section === 'reports' && <ReportsSection />}
              {nav.section === 'shops' && <ShopsPanel />}
              {nav.section === 'settings' && (
                <SettingsSection adminEmail={adminEmail} onSignOut={() => void signOut()} />
              )}
            </motion.div>
          </main>
        </div>
      </div>
      </AdminDataProvider>
      </SectionBoundary>
    </MotionConfig>
  )
}
