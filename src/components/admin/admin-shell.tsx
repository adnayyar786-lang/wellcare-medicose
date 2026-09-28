import { useState } from 'react'
import {
  LayoutDashboard,
  ClipboardList,
  Pill,
  Boxes,
  FileText,
  Users,
  Megaphone,
  BarChart3,
  Settings as SettingsIcon,
  Menu,
  ShieldCheck,
  Bell,
} from 'lucide-react'

import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'

export type AdminView =
  | 'dashboard'
  | 'orders'
  | 'medicines'
  | 'inventory'
  | 'prescriptions'
  | 'customers'
  | 'marketing'
  | 'reports'
  | 'settings'

const NAV: Array<{ key: AdminView; label: string; icon: typeof Pill }> = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'orders', label: 'Orders', icon: ClipboardList },
  { key: 'medicines', label: 'Medicines', icon: Pill },
  { key: 'inventory', label: 'Inventory', icon: Boxes },
  { key: 'prescriptions', label: 'Prescriptions', icon: FileText },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'marketing', label: 'Marketing', icon: Megaphone },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
]

function SidebarContent({ view, onSelect }: { view: AdminView; onSelect: (v: AdminView) => void }) {
  return (
    <div className="flex h-full flex-col bg-[#0a1420]">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600">
          <ShieldCheck className="size-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">Wellcare Medicose</p>
          <p className="text-[10px] text-white/40">Pharmacy · Medicine · Veterinary</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              view === key ? 'bg-teal-500/15 text-teal-300' : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </nav>
      <div className="border-t border-white/10 px-5 py-4 text-[10px] text-white/30">Admin V3 · Wellcare Medicose</div>
    </div>
  )
}

export function AdminShell({
  view,
  onSelect,
  title,
  subtitle,
  unreadCount,
  onBellClick,
  children,
}: {
  view: AdminView
  onSelect: (v: AdminView) => void
  title: string
  subtitle?: string
  unreadCount?: number
  onBellClick?: () => void
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="dark flex min-h-screen bg-[#0d1826] text-white">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed h-screen w-64 border-r border-white/10">
          <SidebarContent view={view} onSelect={onSelect} />
        </div>
      </aside>

      {/* Mobile sidebar drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 border-white/10 bg-[#0a1420] p-0">
          <SidebarContent view={view} onSelect={(v) => { onSelect(v); setMobileOpen(false) }} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0d1826]/95 px-4 py-3.5 backdrop-blur lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="text-white/70 lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-white sm:text-lg">{title}</h1>
              {subtitle && <p className="truncate text-xs text-white/40">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBellClick}
              className="relative flex size-9 items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {!!unreadCount && unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center bg-teal-500 px-1 text-[9px] text-white">
                  {unreadCount}
                </Badge>
              )}
            </button>
            <div className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3">
              <div className="flex size-7 items-center justify-center rounded-full bg-teal-500/20 text-xs font-semibold text-teal-300">
                A
              </div>
              <span className="hidden text-xs font-medium text-white/80 sm:block">Admin</span>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6">{children}</main>
      </div>
    </div>
  )
}
