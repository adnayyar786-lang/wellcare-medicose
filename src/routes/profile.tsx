import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useConvexAuth } from 'convex/react'
import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../../convex/_generated/api'
import {
  ArrowRight, ChevronRight, ClipboardList, FileText, Heart, HelpCircle, Loader2,
  LockKeyhole, MapPin, MessageCircle, Navigation, PackageCheck, Phone, Save,
  Settings, Shield, Sparkles, Store, UserRound
} from 'lucide-react'
import { STORE_LOCATION } from '@/config/store-location'
import { BrandLogo, SiteFooter } from '@/components/brand'

export const Route = createFileRoute('/profile')({
  head: () => ({ meta: [{ title: 'My Account — Wellcare Medicose' }] }),
  component: ProfilePage,
})

const AVATARS = ['😊','🙂','😎','🥰','🧑‍⚕️','👩‍⚕️','👨‍⚕️','🦊','🐼','🐱','🐶','🌸']
const empty = { name:'', dateOfBirth:'', gender:'', addressLine:'', landmark:'', city:'', state:'', pincode:'', avatarKey:'😊', emergencyContact:'' }
type Fields = typeof empty

const quickActions = [
  { label: 'My Orders', detail: 'Track medicines & deliveries', icon: ClipboardList, to: '/orders' },
  { label: 'Wishlist', detail: 'Your saved health picks', icon: Heart, to: '/wishlist' },
  { label: 'Returns & Refunds', detail: 'Manage eligible requests', icon: FileText, to: '/returns' },
]

function ProfilePage() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const profile = useQuery(api.profile.getMine, isAuthenticated ? {} : 'skip')
  const save = useMutation(api.profile.updateMine)
  const [form, setForm] = useState<Fields>(empty)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (profile) setForm({
      name: profile.name ?? '', dateOfBirth: profile.dateOfBirth ?? '', gender: profile.gender ?? '',
      addressLine: profile.addressLine ?? '', landmark: profile.landmark ?? '', city: profile.city ?? '',
      state: profile.state ?? '', pincode: profile.pincode ?? '', avatarKey: profile.avatarKey ?? '😊',
      emergencyContact: profile.emergencyContact ?? '',
    })
  }, [profile])

  const change = (key: keyof Fields, value: string) => setForm(old => ({ ...old, [key]: value }))
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setNotice('')
    try {
      const result = await save(form)
      setNotice(result === 'saved' ? 'Your account details are saved.' : 'Please sign in to save your details.')
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not save changes. Please try again.')
    } finally { setBusy(false) }
  }

  const fieldClass = 'mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15'
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_LOCATION.label)}`

  return <div className="min-h-screen overflow-x-hidden bg-muted/30">
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <BrandLogo />
        <Link to="/" className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-primary">Continue shopping</Link>
      </div>
    </header>

    <main className="mx-auto max-w-6xl px-4 py-5 sm:py-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-primary">Wellcare Medicose</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">My Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Everything you need to manage your medicines, orders and personal details.</p>
      </div>

      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary to-teal-700 p-5 text-primary-foreground shadow-xl sm:p-7">
        <div className="absolute -right-16 -top-20 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 left-1/3 size-48 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-[1.5rem] bg-white/15 text-4xl ring-1 ring-white/25 shadow-lg">{form.avatarKey || '😊'}</div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-white/65">Your Wellcare account</p>
              <h2 className="mt-1 truncate text-2xl font-bold">{form.name || profile?.name || 'Welcome to Wellcare'}</h2>
              <p className="mt-1 text-sm text-white/80">{profile?.email || profile?.phone || 'Sign in to keep your orders and details together.'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm ring-1 ring-white/15">
            <Shield className="size-5" /><span><b>Private & secure</b><span className="block text-xs text-white/70">Your account details stay protected</span></span>
          </div>
        </div>
      </section>

      {!isLoading && !isAuthenticated && <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
        <span><b>You’re browsing as a guest.</b> Sign in to save profile details and access your account.</span>
        <Link to="/sign-in" className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-900 px-4 py-2 font-semibold text-white">Sign in <ArrowRight className="size-4"/></Link>
      </div>}

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        {quickActions.map(({ label, detail, icon: Icon, to }) => <Link key={label} to={to} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5"/></span>
          <span className="min-w-0 flex-1"><b className="block text-sm">{label}</b><span className="mt-0.5 block text-xs text-muted-foreground">{detail}</span></span>
          <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary"/>
        </Link>)}
      </section>

      <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound/></span>
              <div><h2 className="font-bold">Personal details</h2><p className="text-xs text-muted-foreground">Keep your profile information up to date.</p></div>
            </div>
            <label className="text-sm font-semibold">Profile avatar</label>
            <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-12">{AVATARS.map(a => <button type="button" key={a} aria-label={`Choose avatar ${a}`} onClick={() => change('avatarKey', a)} className={`flex aspect-square items-center justify-center rounded-xl border text-2xl transition hover:-translate-y-0.5 hover:border-primary ${form.avatarKey === a ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border bg-muted/40'}`}>{a}</button>)}</div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><label className="text-sm font-semibold">Full name</label><input className={fieldClass} autoComplete="name" value={form.name} onChange={e=>change('name',e.target.value)} placeholder="Your full name" required/></div>
              <div><label className="text-sm font-semibold">Date of birth</label><input className={fieldClass} type="date" value={form.dateOfBirth} onChange={e=>change('dateOfBirth',e.target.value)}/></div>
              <div><label className="text-sm font-semibold">Gender</label><select className={fieldClass} value={form.gender} onChange={e=>change('gender',e.target.value)}><option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Other</option></select></div>
              <div><label className="text-sm font-semibold">Email / Gmail</label><input className={fieldClass+' opacity-70'} value={profile?.email ?? ''} readOnly placeholder="Verified sign-in email"/><p className="mt-1 text-xs text-muted-foreground">Managed by your sign-in provider.</p></div>
              <div><label className="text-sm font-semibold">Phone number</label><input className={fieldClass+' opacity-70'} value={profile?.phone ?? ''} readOnly placeholder="Verified phone number"/><p className="mt-1 text-xs text-muted-foreground">Managed by your sign-in provider.</p></div>
              <div><label className="text-sm font-semibold">Emergency contact</label><input className={fieldClass} type="tel" value={form.emergencyContact} onChange={e=>change('emergencyContact',e.target.value)} placeholder="Optional alternate number"/></div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><MapPin/></span><div><h2 className="font-bold">Primary delivery address</h2><p className="text-xs text-muted-foreground">Help our delivery team find you quickly.</p></div></div>
            <div className="space-y-4">
              <div><label className="text-sm font-semibold">House / Flat, street, area</label><textarea className={fieldClass} rows={3} autoComplete="street-address" value={form.addressLine} onChange={e=>change('addressLine',e.target.value)} placeholder="House no., street and locality"/></div>
              <div><label className="text-sm font-semibold">Landmark</label><input className={fieldClass} value={form.landmark} onChange={e=>change('landmark',e.target.value)} placeholder="Nearby landmark (optional)"/></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="text-sm font-semibold">City</label><input className={fieldClass} autoComplete="address-level2" value={form.city} onChange={e=>change('city',e.target.value)} placeholder="City"/></div>
                <div><label className="text-sm font-semibold">State</label><input className={fieldClass} autoComplete="address-level1" value={form.state} onChange={e=>change('state',e.target.value)} placeholder="State"/></div>
                <div><label className="text-sm font-semibold">PIN code</label><input className={fieldClass} inputMode="numeric" maxLength={6} autoComplete="postal-code" value={form.pincode} onChange={e=>change('pincode',e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6-digit PIN code"/></div>
              </div>
            </div>
          </section>

          {notice && <p role="status" className={`rounded-2xl p-4 text-sm ${notice.includes('saved') ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{notice}</p>}
          <button disabled={!isAuthenticated || busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-semibold text-primary-foreground shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50">{busy ? <Loader2 className="size-5 animate-spin"/> : <Save className="size-5"/>}{busy ? 'Saving details…' : 'Save profile changes'}</button>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700"><Sparkles/></span><div><h2 className="font-bold">Health shortcuts</h2><p className="text-xs text-muted-foreground">Quick access to useful areas.</p></div></div>
            <div className="mt-4 space-y-2">
              <Link to="/orders" className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 text-sm font-semibold"><ClipboardList className="size-4 text-primary"/> Order history <ChevronRight className="ml-auto size-4"/></Link>
              <Link to="/wishlist" className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 text-sm font-semibold"><Heart className="size-4 text-primary"/> Saved medicines <ChevronRight className="ml-auto size-4"/></Link>
              <Link to="/privacy" className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 text-sm font-semibold"><LockKeyhole className="size-4 text-primary"/> Privacy & security <ChevronRight className="ml-auto size-4"/></Link>
              <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 text-sm font-semibold text-muted-foreground"><Settings className="size-4"/> Account settings <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-[10px]">Coming soon</span></div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Shield/></span><div><h2 className="font-bold">Store access</h2><p className="text-xs text-muted-foreground">For Wellcare Medicose team members.</p></div></div>
            <div className="mt-4 space-y-2">
              <Link to="/admin" className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 p-3 text-sm font-semibold text-primary"><Shield className="size-4"/> Admin Panel <ChevronRight className="ml-auto size-4"/></Link>
              <Link to="/staff-login" className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 text-sm font-semibold"><UserRound className="size-4 text-primary"/> Staff Login <ChevronRight className="ml-auto size-4"/></Link>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <div className="flex items-start gap-3"><HelpCircle className="mt-0.5 size-5 shrink-0 text-emerald-700"/><div><h2 className="font-bold text-emerald-950">Need help?</h2><p className="mt-1 text-sm text-emerald-900/80">Ask about an order, medicine or delivery.</p><a href="https://wa.me/917088252556?text=Hello%20Wellcare%20Medicose%2C%20I%20need%20help." target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-sm"><MessageCircle className="size-4"/> WhatsApp support</a></div></div>
          </section>

          <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3"><Store className="size-5 text-primary"/><h2 className="font-bold">Store information</h2></div>
            <p className="mt-3 text-sm text-muted-foreground">{STORE_LOCATION.label}</p>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary"><Navigation className="size-4"/> Get directions</a>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Phone className="size-4"/> +91 70882 52556</p>
          </section>
        </aside>
      </form>

      <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-xs leading-5 text-emerald-900"><PackageCheck className="mr-2 inline size-4"/> Prescription medicines may require a valid prescription. Only provide personal details needed for your account and delivery.</div>
    </main>
    <SiteFooter/>
  </div>
}
