import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ClipboardList, User, MapPin, Heart, HelpCircle, LogOut, ShieldCheck, ChevronRight, Sparkles, BriefcaseBusiness, Users, FileText, LockKeyhole } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const STORE_WHATSAPP = '917088252556'

export function ProfileDrawer() {
  const [open, setOpen] = useState(false)
  const items = [
    { label: 'My Orders', detail: 'Track medicines & deliveries', icon: ClipboardList, to: '/orders' },
    { label: 'My Profile', detail: 'Personal details & address', icon: User, to: '/profile' },
    { label: 'Wishlist', detail: 'Your saved health picks', icon: Heart, to: '/wishlist' },
    { label: 'Returns & Refunds', detail: 'Manage eligible requests', icon: FileText, to: '/returns' },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button aria-label="Profile menu" className="flex size-12 items-center justify-center rounded-full border border-sky-100 bg-white text-sky-700 shadow-[0_8px_24px_-12px_rgba(15,63,100,0.45)] transition hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2">
          <User className="size-6" strokeWidth={2.2} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="z-[9999] flex h-full min-h-0 w-[min(90vw,380px)] flex-col gap-0 overflow-y-auto overscroll-contain border-r border-sky-100 bg-white p-0 text-slate-900 shadow-2xl [touch-action:pan-y] [-webkit-overflow-scrolling:touch] sm:max-w-sm">
        <SheetHeader className="shrink-0 border-b bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-5 pb-5 pt-7 text-left">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md"><ShieldCheck className="size-6" /></span>
            <div className="min-w-0"><SheetTitle className="text-lg font-bold tracking-tight">My Wellcare Account</SheetTitle><p className="mt-1 text-xs text-slate-500">Your health • Our priority</p></div>
          </div>
          <Link to="/profile" onClick={() => setOpen(false)} className="mt-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-card/90 px-3 py-3 text-left shadow-sm transition hover:border-primary/50 hover:bg-primary/5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-xl">😊</span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Open full profile</span><span className="mt-0.5 block text-xs text-muted-foreground">Personal details, address & account tools</span></span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </SheetHeader>

        <nav className="min-w-0 px-3 py-4 pb-8">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Your account</p>
          {items.map(({ label, detail, icon: Icon, to }) => (
            <Link key={label} to={to} onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-primary/5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary group-hover:bg-primary/15"><Icon className="size-[18px]" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span></span>
              <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}

          <div className="my-3 border-t border-border" />
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Security & support</p>
          <Link to="/privacy" onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-primary/5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary"><LockKeyhole className="size-[18px]" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Privacy & Security</span><span className="mt-0.5 block text-xs text-muted-foreground">Review how your account data is handled</span></span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <a href={`https://wa.me/${STORE_WHATSAPP}`} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-primary/5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700"><HelpCircle className="size-[18px]" /></span>
            <span className="flex-1"><span className="block text-sm font-semibold">Help & Support</span><span className="mt-0.5 block text-xs text-muted-foreground">Chat with our team on WhatsApp</span></span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </a>

          <div className="my-3 border-t border-border" />
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Staff & administration</p>
          <Link to="/admin" onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-primary/5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary"><BriefcaseBusiness className="size-[18px]" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Admin Panel</span><span className="mt-0.5 block text-xs text-muted-foreground">Manage medicines, orders & store</span></span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <Link to="/staff-login" onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-primary/5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700"><Users className="size-[18px]" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Staff Login</span><span className="mt-0.5 block text-xs text-muted-foreground">Access staff sales panel</span></span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>

          <Link to="/sign-in" onClick={() => setOpen(false)} className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-foreground">
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted"><LogOut className="size-[18px]" /></span>
            <span className="flex-1"><span className="block font-semibold">Sign in / switch account</span><span className="mt-0.5 block text-xs">Keep your orders and profile together</span></span>
            <Sparkles className="size-4" />
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
