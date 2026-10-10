import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { Store, Truck, Smartphone, CreditCard, Banknote, Wallet, Lock, CheckCircle2, MessageCircle, MapPinned, Check, Clock3, UserRound, Phone, FileText, ChevronRight, PackageCheck, Sparkles, ArrowRight, ShoppingBag, Bell } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import { useCart, type CartLine } from '@/hooks/use-cart'
import { saveLastPhone } from '@/hooks/use-recently-viewed'
import { MapAddressPicker, type SelectedDeliveryLocation } from '@/components/map-address-picker'
import { BrandLogo } from '@/components/brand'
import { STORE_LOCATION } from '@/config/store-location'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-2"><span>{label}</span><b>{value}</b></div> }

function ConfirmationPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return createPortal(children, document.body)
}


export const Route = createFileRoute('/checkout')({ head: () => ({ meta: [{ title: 'Checkout — Wellcare Medicose' }] }), component: CheckoutPage })
const STORE_WHATSAPP = '917088252556'
const COUPON_KEY = 'wellcare-coupon'
function formatINR(n: number) { return `₹${n.toFixed(2)}` }
function shortOrderId(id: string) { return id.slice(-8).toUpperCase() }
function buildWhatsAppMessage(args: { orderId: string; total: number; customerName: string; fulfillment: 'pickup' | 'delivery'; deliveryAddress?: string; items: CartLine[]; subtotal: number; discount: number; deliveryCharge: number; paymentMethod: 'upi' | 'card' | 'wallet' | 'cod' }) {
  return [`New order — ${shortOrderId(args.orderId)}`, '', `Name: ${args.customerName}`, args.fulfillment === 'delivery' ? `Delivery address: ${args.deliveryAddress ?? ''}` : 'Fulfillment: Store pickup', '', 'Items:', ...args.items.map((l) => `${l.quantity} x ${l.name} — ${formatINR(l.price * l.quantity)}`), '', `Total: ${formatINR(args.total)}`].join('\n')
}
function CheckoutPage() {
  const { lines, total, mrpTotal, clearCart } = useCart()
  const navigate = useNavigate()
  const placeOrder = useMutation(api.orders.placeV2)
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup')
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'wallet' | 'cod'>('cod')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [address, setAddress] = useState('')
  const [savedAddress, setSavedAddress] = useState('')
  useEffect(() => { try { const saved = window.localStorage.getItem('wellcare-saved-delivery-address'); if (saved) { setSavedAddress(saved); setAddress(saved) } } catch { /* ignore */ } }, [])
  const [deliveryPoint, setDeliveryPoint] = useState<SelectedDeliveryLocation | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [deliveryTimePref, setDeliveryTimePref] = useState('')
  const [notes, setNotes] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [placing, setPlacing] = useState(false)
  const [confirmed, setConfirmed] = useState<{ orderId: string; total: number; customerName: string; fulfillment: 'pickup' | 'delivery'; deliveryAddress?: string; items: CartLine[] } | null>(null)
  useEffect(() => { try { const saved = window.localStorage.getItem(COUPON_KEY); if (saved) setCouponCode(saved) } catch { /* ignore */ } }, [])
  const deliveryCharge = fulfillment === 'pickup' ? 0 : total >= 499 ? 0 : 40
  const mrpDiscount = Math.max(0, mrpTotal - total)
  const deliveryDistanceKm = deliveryPoint ? (() => {
    const rad = (n: number) => n * Math.PI / 180
    const a = Math.sin(rad(deliveryPoint.lat - STORE_LOCATION.lat) / 2) ** 2 + Math.cos(rad(STORE_LOCATION.lat)) * Math.cos(rad(deliveryPoint.lat)) * Math.sin(rad(deliveryPoint.lng - STORE_LOCATION.lng) / 2) ** 2
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  })() : null
  const deliveryEstimate = deliveryDistanceKm === null ? null : deliveryDistanceKm <= 3 ? '30–45 min' : deliveryDistanceKm <= 7 ? '45–75 min' : deliveryDistanceKm <= 12 ? '60–90 min' : 'Timing to be confirmed'
  async function handlePlaceOrder() {
    if (lines.length === 0) { toast.error('Your cart is empty'); return }
    if (!customerName.trim() || !customerPhone.trim()) { toast.error('Please enter your name and phone number'); return }
    if (fulfillment === 'delivery' && !address.trim()) { toast.error('Please enter a delivery address'); return }
    setPlacing(true)
    try {
      const result = await placeOrder({ customerName, customerPhone, fulfillment, deliveryAddress: fulfillment === 'delivery' ? address : undefined, deliveryTimePref: deliveryTimePref || undefined, paymentMethod, couponCode: couponCode.trim() || undefined, items: lines.map((l) => ({ medicineId: l.medicineId as any, quantity: l.quantity })), notes: notes || undefined })
      saveLastPhone(customerPhone.trim())
      if (fulfillment === 'delivery' && address.trim()) { try { window.localStorage.setItem('wellcare-saved-delivery-address', address.trim()); setSavedAddress(address.trim()) } catch { /* ignore */ } }
      try { window.localStorage.removeItem(COUPON_KEY) } catch { /* ignore */ }
      setConfirmed({ orderId: result.orderId, total: result.total, customerName, fulfillment, deliveryAddress: fulfillment === 'delivery' ? address : undefined, items: lines, subtotal: result.subtotal, discount: result.discount, deliveryCharge: result.deliveryCharge, paymentMethod })
      // Keep the cart mounted while the confirmation portal takes over the viewport.
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not place order') }
    finally { setPlacing(false) }
  }
  useEffect(() => {
    if (!confirmed) return
    const root = document.getElementById('wellcare-order-confirmation')
    if (root) root.scrollTop = 0
    clearCart()
  }, [confirmed, clearCart])
  if (lines.length === 0 && !confirmed) return <div className="mx-auto max-w-lg px-4 py-16 text-center"><p className="text-sm text-muted-foreground">Your cart is empty.</p><Link to="/" className="mt-4 inline-block text-sm text-primary underline">Continue shopping</Link></div>
  const methods = [{ key: 'upi', label: 'UPI', icon: Smartphone }, { key: 'card', label: 'Card', icon: CreditCard }, { key: 'wallet', label: 'Wallet', icon: Wallet }, { key: 'cod', label: 'Cash on Delivery', icon: Banknote }] as const
  return <div className="relative min-h-screen overflow-x-hidden bg-[#edf7f6] pb-40 text-slate-900">
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-32 top-20 size-80 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="absolute -right-28 top-48 size-96 rounded-full bg-blue-300/20 blur-3xl" />
    </div>
    <header className="sticky top-0 z-40 border-b border-white/80 bg-white/75 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Secure checkout · Step 1 of 2</p><h1 className="mt-1 text-xl font-black tracking-tight text-slate-900">Delivery & payment</h1><p className="mt-0.5 text-xs text-slate-500">Choose how you want your Wellcare order fulfilled</p></div><BrandLogo /></div>
    </header>
    <main className="relative z-10 mx-auto max-w-5xl space-y-5 px-4 py-5 sm:px-6 sm:py-7">
      <section className="rounded-[1.75rem] border border-white/90 bg-white/65 p-4 shadow-[0_18px_55px_-40px_rgba(15,118,110,.5)] backdrop-blur-2xl sm:p-5">
        <div className="mb-4 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white shadow-lg shadow-primary/20">1</span><div><p className="text-[10px] font-black uppercase tracking-wider text-primary">Fulfilment</p><Label className="text-lg font-black text-slate-900">Choose how you want it</Label></div></div>
        <div className="mt-4 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Order fulfillment">
          {([{ value: 'delivery', title: 'Home Delivery', desc: 'Delivered to your doorstep', icon: Truck }, { value: 'pickup', title: 'Store Pickup', desc: 'Collect from our store', icon: Store }] as const).map(({ value, title, desc, icon: Icon }) => {
            const selected = fulfillment === value
            return <button key={value} type="button" role="radio" aria-checked={selected} onClick={() => { setFulfillment(value); if (value === 'delivery' && !address) setMapOpen(true) }} className={cn('relative flex min-h-32 flex-col items-start gap-2 rounded-2xl border-2 p-3 text-left transition-all', selected ? 'border-primary bg-emerald-50/70 shadow-sm' : 'border-slate-200 bg-white hover:border-primary/40')}>
              <span className={cn('flex size-11 items-center justify-center rounded-2xl', selected ? 'bg-primary text-white' : 'bg-slate-100 text-primary')}><Icon className="size-5" /></span><span className="text-sm font-bold text-slate-900">{title}</span><span className="text-xs leading-relaxed text-slate-500">{desc}</span>{selected && <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-white"><Check className="size-3" /></span>}
            </button>
          })}
        </div>
      </section>
      {fulfillment === 'pickup' ? <section className="flex gap-3 rounded-[1.75rem] border border-white/90 bg-white/65 p-4 shadow-sm backdrop-blur-2xl"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-primary"><Store className="size-5" /></span><div><p className="font-semibold text-slate-900">Collect from Wellcare Medicose</p><p className="mt-1 text-sm text-slate-600">{STORE_LOCATION.label}</p><p className="mt-1 text-xs text-slate-500">Open 24×7 · No delivery address needed for pickup.</p></div></section> : <>
        <section className="space-y-3 rounded-[1.75rem] border border-white/90 bg-white/65 p-4 shadow-[0_18px_55px_-40px_rgba(15,118,110,.5)] backdrop-blur-2xl sm:p-5">
          {savedAddress && <button type="button" onClick={() => { setAddress(savedAddress); setMapOpen(false); toast.success("Saved delivery address selected") }} className="flex w-full items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-left transition hover:border-emerald-400 hover:bg-emerald-100"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm"><MapPinned className="size-5" /></span><span className="min-w-0 flex-1"><span className="block text-[10px] font-black uppercase tracking-wider text-emerald-700">Previously used address</span><span className="mt-1 block text-sm font-semibold text-slate-900">{savedAddress}</span><span className="mt-1 block text-xs font-semibold text-emerald-700">Tap to use this address</span></span><CheckCircle2 className="mt-1 size-5 shrink-0 text-emerald-600" /></button>}
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white">3</span><div><p className="text-[10px] font-black uppercase tracking-wider text-primary">Location</p><p className="text-lg font-black text-slate-900">Deliver to</p><p className="mt-0.5 text-xs text-slate-500">Confirm your precise drop-off point</p></div></div><Button type="button" variant="outline" className="shrink-0 rounded-xl" onClick={() => setMapOpen(true)}><MapPinned className="mr-2 size-4" />{address ? 'Edit location' : 'Pin on map'}</Button></div>
          <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4" aria-live="polite"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600"><MapPinned className="size-6" /></span><div className="min-w-0">{address ? <><p className="text-sm font-semibold text-slate-900">{address}</p><p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700"><CheckCircle2 className="size-3.5" /> Map pin selected · verify address</p></> : <><p className="font-semibold text-slate-800">Add delivery location</p><p className="mt-1 text-sm text-slate-500">Use the map pin to choose your doorstep address.</p></>}</div></div>
          <button type="button" onClick={() => setMapOpen(true)} className="flex w-full items-center justify-between rounded-xl border border-dashed border-primary/40 bg-primary/[0.03] px-4 py-3 text-left text-sm font-semibold text-primary hover:bg-primary/[0.06]"><span className="flex items-center gap-2"><MapPinned className="size-4" />Open map and adjust pin</span><ChevronRight className="size-4" /></button>
        </section>
        <section aria-live="polite" className="flex items-center gap-3 rounded-[1.5rem] border border-emerald-200/70 bg-gradient-to-r from-emerald-50/90 to-cyan-50/80 p-4 shadow-sm backdrop-blur-sm"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><Clock3 className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Estimated delivery</p><p className="mt-0.5 text-xl font-extrabold tracking-tight text-emerald-800">{deliveryEstimate ?? 'Choose your location'}</p><p className="text-xs leading-relaxed text-emerald-800/80">{deliveryDistanceKm === null ? 'Pin your address to see an indicative delivery window.' : deliveryDistanceKm > 12 ? 'We’ll confirm delivery coverage and timing before dispatch.' : `Indicative estimate based on straight-line distance (${deliveryDistanceKm.toFixed(1)} km). Traffic and preparation time can change actual delivery.`}</p></div><Truck className="size-7 shrink-0 text-emerald-700" /></section>
      </>}
      <section className="rounded-[1.75rem] border border-white/90 bg-white/65 p-4 shadow-[0_18px_55px_-40px_rgba(15,118,110,.5)] backdrop-blur-2xl sm:p-5"><div className="mb-4 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">4</span><Clock3 className="size-4 text-primary" /><Label htmlFor="time-pref" className="font-bold text-slate-900">Preferred {fulfillment === 'pickup' ? 'pickup' : 'delivery'} time <span className="font-normal text-slate-400">(optional)</span></Label></div><Input id="time-pref" className="h-12 rounded-xl bg-slate-50" value={deliveryTimePref} onChange={(e) => setDeliveryTimePref(e.target.value)} placeholder="e.g. Evening after 6 PM" /></section>
      <section className="rounded-[1.75rem] border border-white/90 bg-white/65 p-4 shadow-[0_18px_55px_-40px_rgba(15,118,110,.5)] backdrop-blur-2xl sm:p-5"><div className="mb-4 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">5</span><UserRound className="size-4 text-primary" /><h2 className="text-base font-bold text-slate-900">Contact details</h2></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="name">Your name</Label><Input id="name" className="h-12 rounded-xl bg-slate-50" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter your full name" /></div><div className="space-y-1.5"><Label htmlFor="phone">Phone number</Label><div className="relative"><Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input id="phone" className="h-12 rounded-xl bg-slate-50 pl-10" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Enter mobile number" inputMode="tel" /></div></div></div><div className="mt-4 space-y-1.5"><Label htmlFor="notes">Order notes <span className="font-normal text-slate-400">(optional)</span></Label><div className="relative"><FileText className="absolute left-3 top-3 size-4 text-slate-400" /><Textarea id="notes" className="min-h-24 rounded-xl bg-slate-50 pl-10" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions? (e.g. call before delivery)" /></div></div></section>
      <section className="rounded-[1.75rem] border border-white/90 bg-white/65 p-4 shadow-[0_18px_55px_-40px_rgba(15,118,110,.5)] backdrop-blur-2xl sm:p-5"><div className="mb-4 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">6</span><CreditCard className="size-4 text-primary" /><h2 className="text-base font-bold text-slate-900">Payment method</h2></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{methods.map(({ key, label, icon: Icon }) => <button key={key} type="button" aria-pressed={paymentMethod === key} onClick={() => setPaymentMethod(key)} className={cn('flex min-h-20 flex-col items-start justify-between gap-2 rounded-xl border p-3 text-left text-sm font-semibold transition-colors', paymentMethod === key ? 'border-primary bg-emerald-50 text-slate-900 ring-1 ring-primary/20' : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40')}><span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-primary"><Icon className="size-4" /></span><span className="flex w-full items-center justify-between gap-1">{label}{paymentMethod === key && <CheckCircle2 className="size-4 text-primary" />}</span></button>)}</div><p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Lock className="size-3.5 text-emerald-700" />Secure order processing</p></section>
      <section className="rounded-[1.75rem] border border-white/90 bg-white/65 p-4 shadow-[0_18px_55px_-40px_rgba(15,118,110,.5)] backdrop-blur-2xl sm:p-5"><div className="mb-4 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">7</span><div><p className="text-[10px] font-black uppercase tracking-wider text-primary">Final review</p><h2 className="text-lg font-black text-slate-900">Order summary</h2></div></div><div className="space-y-3 text-sm"><div className="flex justify-between text-slate-500"><span>MRP total</span><span>{formatINR(mrpTotal)}</span></div>{mrpDiscount > 0 && <div className="flex justify-between font-medium text-emerald-700"><span>Discount</span><span>−{formatINR(mrpDiscount)}</span></div>}<div className="flex justify-between text-slate-500"><span>Delivery charges</span><span className={deliveryCharge === 0 ? 'font-semibold text-emerald-700' : ''}>{deliveryCharge === 0 ? 'FREE' : formatINR(deliveryCharge)}</span></div><div className="flex justify-between text-slate-500"><span>Taxes and charges</span><span>Included</span></div><div className="flex justify-between border-t border-dashed border-slate-200 pt-4 text-base font-extrabold text-slate-900"><span>Total amount</span><span>{formatINR(total + deliveryCharge)}</span></div></div></section>
    </main>
    <div className="fixed inset-x-0 bottom-16 z-30 lg:bottom-0 border-t border-white/80 bg-white/80 px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl"><div className="mx-auto flex max-w-3xl items-center justify-between gap-4"><div><p className="text-[11px] font-medium text-slate-500">Total amount</p><p className="text-xl font-extrabold tracking-tight text-slate-900">{formatINR(total + deliveryCharge)}</p></div><Button size="lg" className="min-w-40 rounded-xl px-6 font-bold shadow-md" disabled={placing} onClick={handlePlaceOrder}>{placing ? 'Placing order…' : <>Place Order <ChevronRight className="ml-2 size-4" /></>}</Button></div></div>
    <MapAddressPicker open={mapOpen} onOpenChange={setMapOpen} onConfirm={(location) => {
      const nextAddress = location.address.trim()
      setAddress(nextAddress)
      setSavedAddress(nextAddress)
      setDeliveryPoint(location)
      if (nextAddress) {
        try { window.localStorage.setItem('wellcare-saved-delivery-address', nextAddress) } catch { /* ignore */ }
        toast.success('Delivery address saved for next time')
      }
    }} />
    <ConfirmationPortal>
      {confirmed && (
      <div id="wellcare-order-confirmation" className="fixed inset-0 z-[100] h-[100dvh] overflow-hidden bg-[#f5fbfa] text-slate-900">
        <div className="flex h-full min-h-0 flex-col">
          <header className="shrink-0 border-b border-[#b8e5df] bg-white px-3 py-2.5 shadow-sm sm:px-5">
            <div className="mx-auto flex max-w-[1500px] items-center gap-4">
              <BrandLogo className="shrink-0" />
              <div className="hidden min-w-0 flex-1 items-center gap-4 md:flex">
                <div className="h-9 w-px bg-[#cde9e5]" />
                <div><p className="text-[11px] sm:text-[10px] font-black uppercase tracking-[0.12em] text-blue-800">Hybrid Healthcare Platform</p><p className="mt-1 text-[11px] sm:text-[9px] font-semibold text-slate-500">Medicines <span className="mx-1 text-emerald-500">|</span> Diagnostics <span className="mx-1 text-emerald-500">|</span> Consultation <span className="mx-1 text-emerald-500">|</span> Home Care <span className="mx-1 text-emerald-500">|</span> Store Pickup</p></div>
              </div>
              <div className="hidden items-center gap-2 lg:flex"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] sm:text-[9px] font-bold text-emerald-700">✓ Genuine Medicines</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] sm:text-[9px] font-bold text-blue-700">♙ Licensed Pharmacy</span><span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] sm:text-[9px] font-bold text-slate-600">🔒 Secure</span></div>
              <span className="ml-auto rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] sm:text-[9px] font-black uppercase tracking-wider text-white">Order confirmed</span>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 sm:px-3 sm:py-3 lg:px-4">
            <div className="mx-auto grid w-full max-w-[900px] grid-cols-1 gap-3 md:grid-cols-2 lg:max-w-[1500px] lg:grid-cols-12">
              <section className="card md:col-span-2 lg:col-span-4">
                <div className="flex items-start gap-3"><div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-100"><CheckCircle2 className="size-7 text-emerald-600"/></div><div className="min-w-0"><p className="eyebrow">1 · Order Confirmed — Your Healthcare Journey</p><h1 className="mt-1 text-xl font-black sm:text-2xl">Order Confirmed!</h1><p className="text-[11px] sm:text-[10px] text-slate-500">Your order has been successfully placed.</p></div></div>
                <div className="mt-3 grid grid-cols-2 gap-2"><div className="mini"><b>Order ID</b><strong>WC{shortOrderId(confirmed.orderId)}</strong></div><div className="mini"><b>Placed</b><strong>Just now</strong></div></div>
                <div className="mt-2 grid grid-cols-4 gap-1.5">{[['💊','Medicine'],['🧪','Lab Test'],['👨‍⚕️','Consult'],['🛒','Pickup']].map(([i,t])=><div className="rounded-xl bg-slate-50 p-2 text-center" key={t}><span className="text-lg">{i}</span><p className="mt-1 text-[11px] sm:text-[10px] sm:text-[8px] font-bold">{t}</p></div>)}</div>
                <div className="mt-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 p-2.5 text-white"><p className="text-[11px] sm:text-[10px] sm:text-[8px] font-bold uppercase tracking-wider text-white/75">{confirmed.fulfillment==='delivery'?'Estimated Delivery':'Store Pickup'}</p><p className="mt-0.5 text-base font-black">{confirmed.fulfillment==='delivery'?'Today · 30–90 min':'We’ll notify you when ready'}</p></div>
              </section>

              <section className="card"><div className="flex items-center justify-between"><div><p className="eyebrow">2 · Your Healthcare Journey</p><h2 className="card-title">Live progress</h2></div><span className="pill">● LIVE</span></div><div className="mt-2.5 space-y-1.5">{['Order Confirmed','Pharmacy Preparing','Packed','Out for Delivery','Delivered'].map((s,i)=><div key={s} className={cn('flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] sm:text-[9px] font-bold',i===1?'bg-emerald-100 text-emerald-800':'bg-slate-50 text-slate-600')}><span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] sm:text-[10px] sm:text-[8px]',i<2?'bg-emerald-600 text-white':'border border-slate-300 bg-white')}>{i<2?'✓':i+1}</span><span className="flex-1">{s}</span>{i===1&&<span className="text-[7px] font-black text-emerald-600">CURRENT</span>}</div>)}</div><Link to="/track/$orderId" params={{orderId:confirmed.orderId}} className="mt-2 block rounded-lg bg-emerald-600 py-2 text-center text-[11px] sm:text-[9px] font-black text-white">Track Your Order</Link></section>

              <section className="card lg:col-span-3"><p className="eyebrow">3 · Order Details</p><h2 className="card-title">Order information</h2><div className="mt-2 space-y-1.5"><div className="mini"><b>Fulfilment Method</b><strong>{confirmed.fulfillment==='delivery'?'🚚 Express Delivery':'🏪 Store Pickup'}</strong></div><div className="mini"><b>{confirmed.fulfillment==='delivery'?'Delivery Address':'Store'}</b><strong className="line-clamp-2">{confirmed.fulfillment==='delivery'?confirmed.deliveryAddress:STORE_LOCATION.label}</strong></div><div className="mini"><b>Payment</b><strong className="text-emerald-700">{confirmed.paymentMethod === 'cod' ? 'Cash on delivery' : 'Payment processing'}</strong></div><div className="mini"><b>Prescription</b><strong className="text-emerald-700">✓ Verified / N/A</strong></div></div></section>

              <section className="card lg:col-span-2"><div className="flex items-center justify-between"><div><p className="eyebrow">4 · Items</p><h2 className="card-title">{confirmed.items.length} Items</h2></div><Link to="/orders" className="text-[11px] sm:text-[10px] sm:text-[8px] font-black text-primary">View All</Link></div><div className="mt-2 space-y-1.5">{confirmed.items.slice(0,4).map(x=><div className="flex items-center gap-1.5 rounded-lg border bg-white p-1.5" key={x.medicineId}><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm">💊</span><span className="min-w-0 flex-1 truncate text-[11px] sm:text-[10px] sm:text-[8px] font-bold">{x.name}<small className="block text-[7px] font-normal text-slate-400">Qty: {x.quantity}</small></span><b className="text-[11px] sm:text-[10px] sm:text-[8px]">{formatINR(x.price*x.quantity)}</b></div>)}</div></section>

              <section className="card lg:col-span-2"><p className="eyebrow">5 · Price Breakdown</p><h2 className="card-title">Payment summary</h2><div className="mt-3 space-y-2 text-[11px] sm:text-[9px]"><Row label="Items Total" value={formatINR(confirmed.subtotal)}/><Row label="Delivery Fee" value={confirmed.deliveryCharge === 0 ? 'FREE' : formatINR(confirmed.deliveryCharge)}/><Row label="Discount" value={confirmed.discount > 0 ? `−${formatINR(confirmed.discount)}` : '₹0'}/><div className="flex justify-between rounded-lg bg-emerald-100 p-2 font-black text-emerald-800"><span>Total {confirmed.paymentMethod === 'cod' ? 'Due' : 'Paid'}</span><span>{formatINR(confirmed.total)}</span></div></div></section>

              <section className="card lg:col-span-2"><p className="eyebrow">6 · Prescription & Consultation</p><div className="mt-2 rounded-xl bg-blue-700 p-3 text-white"><CheckCircle2 className="size-5"/><p className="mt-1 text-[11px] sm:text-[10px] font-black">Prescription Verified</p><p className="text-[11px] sm:text-[10px] sm:text-[8px] text-white/75">Your order is cleared.</p></div><button className="mt-2 w-full rounded-lg border py-2 text-[11px] sm:text-[10px] sm:text-[8px] font-black text-primary">Consult Pharmacist</button></section>

              <section className="card lg:col-span-2"><p className="eyebrow">7 · Lab Test & Home Sample Collection</p><div className="mt-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 p-3 text-white"><p className="text-[11px] sm:text-[10px] sm:text-[8px] font-bold uppercase">Home Sample Collection</p><p className="mt-1 text-xs font-black">Book a Lab Test</p><p className="mt-1 text-[11px] sm:text-[10px] sm:text-[8px] text-white/80">CBC · Diabetes · Thyroid & more</p></div><button className="mt-2 w-full rounded-lg border py-2 text-[11px] sm:text-[10px] sm:text-[8px] font-black text-primary">Explore Diagnostics</button></section>

              <section className="card lg:col-span-3"><p className="eyebrow">8 · Store Pickup Information</p><div className="mt-2 rounded-xl bg-emerald-600 p-3 text-white"><p className="text-[11px] sm:text-[10px] sm:text-[8px] font-bold uppercase text-white/75">{confirmed.fulfillment==='pickup'?'Ready for Pickup':'Store Support'}</p><p className="mt-1 text-xs font-black">{STORE_LOCATION.label}</p><p className="mt-1 text-[11px] sm:text-[10px] sm:text-[8px] text-white/80">{confirmed.fulfillment==='pickup'?'We’ll notify you when ready.':'Pickup is available as an alternate option.'}</p></div><button className="mt-2 w-full rounded-lg border py-2 text-[11px] sm:text-[10px] sm:text-[8px] font-black text-primary">View Store on Map</button></section>

              <section className="card lg:col-span-2"><p className="eyebrow">9 · Additional Options</p><div className="mt-2 grid grid-cols-2 gap-1.5">{[['♡','Wishlist'],['🔔','Refill'],['↻','Buy Again'],['💬','Pharmacist']].map(([i,t])=><button className="rounded-lg border bg-white p-2 text-left" key={t}><span className="text-base">{i}</span><p className="mt-0.5 text-[11px] sm:text-[10px] sm:text-[8px] font-black">{t}</p></button>)}</div></section>

              <section className="card lg:col-span-3"><p className="eyebrow">10 · Notifications & Updates</p><div className="mt-2 space-y-1.5">{['Push Notifications','SMS','WhatsApp','Email'].map((x,i)=><div className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] sm:text-[10px] sm:text-[8px] font-bold" key={x}><span>{x}</span><span className={cn('rounded-full px-1.5 py-0.5 text-[7px]',i<3?'bg-emerald-100 text-emerald-700':'bg-slate-200 text-slate-500')}>{i<3?'ON':'OFF'}</span></div>)}</div></section>

              <section className="card lg:col-span-3"><p className="eyebrow">11 · Live Order Tracking</p><div className="mt-2 grid gap-2 sm:grid-cols-2"><div className="relative h-24 overflow-hidden rounded-xl bg-[#e8f3ec]"><span className="absolute left-4 top-14 size-3 rounded-full bg-blue-600 ring-4 ring-white"/><span className="absolute right-4 top-4 size-4 rounded-full bg-emerald-600 ring-4 ring-white"/><div className="absolute left-6 top-14 h-1 w-[70%] rotate-[-22deg] bg-blue-600"/><Truck className="absolute right-1/2 top-8 size-5 text-blue-700"/></div><div className="space-y-1.5 text-[11px] sm:text-[10px] sm:text-[8px] font-bold"><p>🟢 Pharmacy preparing</p><p>🟢 Packed</p><p>🔵 Out for delivery</p><p>⚪ Delivered</p></div></div><Link to="/track/$orderId" params={{orderId:confirmed.orderId}} className="mt-2 block rounded-lg bg-primary py-2 text-center text-[11px] sm:text-[10px] sm:text-[8px] font-black text-white">Open Live Tracking</Link></section>

              <section className="card lg:col-span-3"><p className="eyebrow">12 · My Care Journey</p><div className="mt-2 space-y-1.5">{['Consultation · Completed','Prescription · Verified','Medicines · In Progress','Lab Test · Available','Report · Awaiting Sample'].map((x,i)=><div className="flex items-center gap-2 rounded-lg bg-slate-50 p-1.5 text-[11px] sm:text-[10px] sm:text-[8px] font-bold" key={x}><span className={cn('size-2 rounded-full',i<2?'bg-emerald-500':'bg-blue-400')}/><span className="flex-1">{x}</span><ChevronRight className="size-3 text-slate-400"/></div>)}</div><button className="mt-2 w-full rounded-lg bg-blue-800 py-2 text-[11px] sm:text-[10px] sm:text-[8px] font-black text-white">View Full Journey</button></section>

              <section className="card lg:col-span-3"><p className="eyebrow">13 · Health Plan & Membership</p><div className="mt-2 rounded-xl bg-gradient-to-br from-blue-800 to-cyan-700 p-3 text-white"><p className="text-[11px] sm:text-[10px] font-black">♛ Wellcare Health Plan</p><p className="mt-2 text-[11px] sm:text-[10px] sm:text-[8px]">✓ Consultation Credits</p><p className="text-[11px] sm:text-[10px] sm:text-[8px]">✓ Diagnostic Discounts</p><p className="text-[11px] sm:text-[10px] sm:text-[8px]">✓ Free Delivery Benefits</p><button className="mt-2 w-full rounded-lg bg-white py-2 text-[11px] sm:text-[10px] sm:text-[8px] font-black text-blue-800">View Plans & Upgrade</button></div></section>

              <section className="card lg:col-span-3"><p className="eyebrow">14 · Documents & Invoice</p><div className="mt-2 space-y-1.5">{['Invoice','Prescription','Lab Report','Consultation Summary','Payment Receipt'].map(x=><button className="flex w-full items-center gap-2 rounded-lg border bg-white p-2 text-left" key={x}><FileText className="size-4 text-primary"/><span className="flex-1 text-[11px] sm:text-[10px] sm:text-[8px] font-black">{x}<small className="block text-[7px] font-normal text-slate-400">View / Download</small></span><ChevronRight className="size-3 text-slate-400"/></button>)}</div></section>

              <section className="card lg:col-span-3"><p className="eyebrow">15 · Next Steps & Quick Actions</p><div className="mt-2 rounded-xl bg-emerald-50 p-3"><p className="text-[11px] sm:text-[10px] font-black text-emerald-800">Your order is on the way!</p><p className="mt-1 text-[11px] sm:text-[10px] sm:text-[8px] text-slate-500">Sit back and relax — we’ll keep you updated.</p></div><Link to="/track/$orderId" params={{orderId:confirmed.orderId}} className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-primary py-2.5 text-[11px] sm:text-[9px] font-black text-white">Track Order <ArrowRight className="size-3"/></Link><div className="mt-1.5 grid grid-cols-2 gap-1.5"><Link to="/orders" className="rounded-lg border bg-white py-2 text-center text-[11px] sm:text-[10px] sm:text-[8px] font-bold">My Orders</Link><button onClick={()=>navigate({to:'/'})} className="rounded-lg border bg-white py-2 text-[11px] sm:text-[10px] sm:text-[8px] font-bold">Shop Again</button></div></section>
            </div>
            <div className="mx-auto mt-2 max-w-[1500px] rounded-xl border border-[#b8e5df] bg-white px-3 py-2 text-center text-[11px] sm:text-[10px] sm:text-[8px] font-semibold text-slate-500">Wellcare Medicose · Your Health, Our Priority · Genuine Medicines · Licensed Pharmacy · Secure Payments · 24/7 Support</div>
          </main>
        </div>
        <style>{`
          #wellcare-order-confirmation .card{border:1px solid #d8ebe8;background:rgba(255,255,255,.94);border-radius:14px;padding:12px;box-shadow:0 2px 10px rgba(15,118,110,.07)}
          #wellcare-order-confirmation .eyebrow{font-size:8px;line-height:1.2;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#0b7890}
          #wellcare-order-confirmation .card-title{margin-top:3px;font-size:13px;line-height:1.2;font-weight:900}
          #wellcare-order-confirmation .mini{border-radius:9px;background:#f7faf9;padding:7px}
          #wellcare-order-confirmation .mini b{display:block;font-size:7px;text-transform:uppercase;letter-spacing:.04em;color:#94a3b8}
          #wellcare-order-confirmation .mini strong{display:block;margin-top:3px;font-size:9px;line-height:1.25}
          #wellcare-order-confirmation .pill{border-radius:999px;background:#e8f8ef;padding:4px 7px;font-size:7px;font-weight:900;color:#07814f}
          #wellcare-order-confirmation button,#wellcare-order-confirmation a{transition:none}
        `}</style>
      </div>
      )}
    </ConfirmationPortal>

  </div>
}
