import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ClipboardList, User, MapPin, CreditCard, Heart, HelpCircle, LogOut, ShieldCheck, ChevronRight, Sparkles, BriefcaseBusiness, Users } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const STORE_WHATSAPP = '917088252556'

export function ProfileDrawer() {
  const [open, setOpen] = useState(false)
  const items = [
    { label: 'My Orders', detail: 'Track and manage purchases', icon: ClipboardList, to: '/orders' },
    { label: 'Wishlist', detail: 'Your saved healthcare picks', icon: Heart, to: '/wishlist' },
    { label: 'My Profile', detail: 'Personal details and store info', icon: User, to: '/profile' },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button aria-label="Profile menu" className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/5"><User className="size-4" /></button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(88vw,360px)] min-h-0 gap-0 overflow-hidden border-r-0 bg-background p-0 sm:max-w-sm">
        <SheetHeader className="shrink-0 border-b bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 px-5 pb-5 pt-7 text-left">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md"><ShieldCheck className="size-6" /></span>
            <div className="min-w-0"><SheetTitle className="text-lg font-bold tracking-tight">Wellcare Medicose</SheetTitle><p className="mt-1 text-xs text-muted-foreground">Your health • Our priority</p></div>
          </div>
          <Link to="/sign-in" onClick={() => setOpen(false)} aria-label="Sign in to Wellcare Medicose" className="mt-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-card/90 px-3 py-3 text-left text-sm font-medium text-foreground shadow-sm transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Sparkles className="size-4 shrink-0 text-primary" />
            <span className="flex-1">Sign in to keep your orders and details together.</span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </SheetHeader>
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-4 pb-8 [touch-action:pan-y]">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Your account</p>
          {items.map(({ label, detail, icon: Icon, to }) => (
            <Link key={label} to={to} onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-primary/5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary group-hover:bg-primary/15"><Icon className="size-[18px]" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span><span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span></span>
              <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
          <div className="my-3 border-t border-border" />
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Staff & administration</p>
          <Link to="/admin" onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-primary/5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary"><BriefcaseBusiness className="size-[18px]" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Admin Login</span><span className="mt-0.5 block text-xs text-muted-foreground">Open the administration panel</span></span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <Link to="/staff-login" onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-primary/5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700"><Users className="size-[18px]" /></span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Staff Login</span><span className="mt-0.5 block text-xs text-muted-foreground">Access your staff sales panel</span></span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <div className="my-3 border-t border-border" />
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Preferences & support</p>
          <div className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground"><span className="flex size-9 items-center justify-center rounded-lg bg-muted"><MapPin className="size-4" /></span><span className="flex-1">Saved addresses</span><span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">Coming soon</span></div>
          <div className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground"><span className="flex size-9 items-center justify-center rounded-lg bg-muted"><CreditCard className="size-4" /></span><span className="flex-1">Payment methods</span><span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">Coming soon</span></div>
          <a href={`https://wa.me/${STORE_WHATSAPP}`} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-primary/5"><span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700"><HelpCircle className="size-[18px]" /></span><span className="flex-1"><span className="block text-sm font-semibold">Help & Support</span><span className="mt-0.5 block text-xs text-muted-foreground">Chat with our team on WhatsApp</span></span><ChevronRight className="size-4 text-muted-foreground" /></a>
          <Link to="/sign-in" onClick={() => setOpen(false)} className="mt-2 flex items-center gap-3 rounded-2xl border border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"><span className="flex size-10 items-center justify-center rounded-xl bg-muted"><LogOut className="size-[18px]" /></span><span className="flex-1"><span className="block font-semibold">Sign in</span><span className="mt-0.5 block text-xs">You’re browsing as a guest — tap to sign in</span></span><ChevronRight className="size-4" /></Link>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
