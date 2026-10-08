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

export const Route = createFileRoute('/checkout')({ head: () => ({ meta: [{ title: 'Checkout — Wellcare Medicose' }] }), component: CheckoutPage })
const STORE_WHATSAPP = '917088252556'
const COUPON_KEY = 'wellcare-coupon'
function formatINR(n: number) { return `₹${n.toFixed(2)}` }
function shortOrderId(id: string) { return id.slice(-8).toUpperCase() }
function buildWhatsAppMessage(args: { orderId: string; total: number; customerName: string; fulfillment: 'pickup' | 'delivery'; deliveryAddress?: string; items: CartLine[] }) {
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
      try { window.localStorage.removeItem(COUPON_KEY) } catch { /* ignore */ }
      setConfirmed({ orderId: result.orderId, total: result.total, customerName, fulfillment, deliveryAddress: fulfillment === 'delivery' ? address : undefined, items: lines })
      // Keep the cart mounted while the confirmation portal takes over the viewport.
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not place order') }
    finally { setPlacing(false) }
  }
  useEffect(() => {
    if (!confirmed) return
    const root = document.getElementById('wellcare-order-confirmation')
    if (root) root.scrollTop = 0
  }, [confirmed])
  if (lines.length === 0 && !confirmed) return <div className="mx-auto max-w-lg px-4 py-16 text-center"><p className="text-sm text-muted-foreground">Your cart is empty.</p><Link to="/" className="mt-4 inline-block text-sm text-primary underline">Continue shopping</Link></div>
  const methods = [{ key: 'upi', label: 'UPI', icon: Smartphone }, { key: 'card', label: 'Card', icon: CreditCard }, { key: 'wallet', label: 'Wallet', icon: Wallet }, { key: 'cod', label: 'Cash on Delivery', icon: Banknote }] as const
  return <div className="relative min-h-screen overflow-x-hidden bg-[#edf7f6] pb-40 text-slate-900">
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-32 top-20 size-80 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="absolute -right-28 top-48 size-96 rounded-full bg-blue-300/20 blur-3xl" />
    </div>
    <header className="sticky top-0 z-40 border-b border-white/80 bg-white/75 backdrop-blur-2xl">
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
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-white">3</span><div><p className="text-[10px] font-black uppercase tracking-wider text-primary">Location</p><p className="text-lg font-black text-slate-900">Deliver to</p><p className="mt-0.5 text-xs text-slate-500">Confirm your precise drop-off point</p></div></div><Button type="button" variant="outline" className="shrink-0 rounded-xl" onClick={() => setMapOpen(true)}><MapPinned className="mr-2 size-4" />{address ? 'Edit location' : 'Pin on map'}</Button></div>
          <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4" aria-live="polite"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600"><MapPinned className="size-6" /></span><div className="min-w-0">{address ? <><p className="text-sm font-semibold text-slate-900">{address}</p><p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700"><CheckCircle2 className="size-3.5" /> Map pin selected · verify address</p></> : <><p className="font-semibold text-slate-800">Add delivery location</p><p className="mt-1 text-sm text-slate-500">Use the map pin to choose your doorstep address.</p></>}</div></div>
          <button type="button" onClick={() => setMapOpen(true)} className="flex w-full items-center justify-between rounded-xl border border-dashed border-primary/40 bg-primary/[0.03] px-4 py-3 text-left text-sm font-semibold text-primary hover:bg-primary/[0.06]"><span className="flex items-center gap-2"><MapPinned className="size-4" />Open map and adjust pin</span><ChevronRight className="size-4" /></button>
        </section>
        <section aria-live="polite" className="flex items-center gap-3 rounded-[1.5rem] border border-emerald-200/70 bg-gradient-to-r from-emerald-50/90 to-cyan-50/80 p-4 shadow-sm backdrop-blur-xl"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><Clock3 className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Estimated delivery</p><p className="mt-0.5 text-xl font-extrabold tracking-tight text-emerald-800">{deliveryEstimate ?? 'Choose your location'}</p><p className="text-xs leading-relaxed text-emerald-800/80">{deliveryDistanceKm === null ? 'Pin your address to see an indicative delivery window.' : deliveryDistanceKm > 12 ? 'We’ll confirm delivery coverage and timing before dispatch.' : `Indicative estimate based on straight-line distance (${deliveryDistanceKm.toFixed(1)} km). Traffic and preparation time can change actual delivery.`}</p></div><Truck className="size-7 shrink-0 text-emerald-700" /></section>
      </>}
      <section className="rounded-[1.75rem] border border-white/90 bg-white/65 p-4 shadow-[0_18px_55px_-40px_rgba(15,118,110,.5)] backdrop-blur-2xl sm:p-5"><div className="mb-4 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">4</span><Clock3 className="size-4 text-primary" /><Label htmlFor="time-pref" className="font-bold text-slate-900">Preferred {fulfillment === 'pickup' ? 'pickup' : 'delivery'} time <span className="font-normal text-slate-400">(optional)</span></Label></div><Input id="time-pref" className="h-12 rounded-xl bg-slate-50" value={deliveryTimePref} onChange={(e) => setDeliveryTimePref(e.target.value)} placeholder="e.g. Evening after 6 PM" /></section>
      <section className="rounded-[1.75rem] border border-white/90 bg-white/65 p-4 shadow-[0_18px_55px_-40px_rgba(15,118,110,.5)] backdrop-blur-2xl sm:p-5"><div className="mb-4 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">5</span><UserRound className="size-4 text-primary" /><h2 className="text-base font-bold text-slate-900">Contact details</h2></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="name">Your name</Label><Input id="name" className="h-12 rounded-xl bg-slate-50" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter your full name" /></div><div className="space-y-1.5"><Label htmlFor="phone">Phone number</Label><div className="relative"><Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input id="phone" className="h-12 rounded-xl bg-slate-50 pl-10" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Enter mobile number" inputMode="tel" /></div></div></div><div className="mt-4 space-y-1.5"><Label htmlFor="notes">Order notes <span className="font-normal text-slate-400">(optional)</span></Label><div className="relative"><FileText className="absolute left-3 top-3 size-4 text-slate-400" /><Textarea id="notes" className="min-h-24 rounded-xl bg-slate-50 pl-10" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions? (e.g. call before delivery)" /></div></div></section>
      <section className="rounded-[1.75rem] border border-white/90 bg-white/65 p-4 shadow-[0_18px_55px_-40px_rgba(15,118,110,.5)] backdrop-blur-2xl sm:p-5"><div className="mb-4 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">6</span><CreditCard className="size-4 text-primary" /><h2 className="text-base font-bold text-slate-900">Payment method</h2></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{methods.map(({ key, label, icon: Icon }) => <button key={key} type="button" aria-pressed={paymentMethod === key} onClick={() => setPaymentMethod(key)} className={cn('flex min-h-20 flex-col items-start justify-between gap-2 rounded-xl border p-3 text-left text-sm font-semibold transition-colors', paymentMethod === key ? 'border-primary bg-emerald-50 text-slate-900 ring-1 ring-primary/20' : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40')}><span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-primary"><Icon className="size-4" /></span><span className="flex w-full items-center justify-between gap-1">{label}{paymentMethod === key && <CheckCircle2 className="size-4 text-primary" />}</span></button>)}</div><p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Lock className="size-3.5 text-emerald-700" />Secure order processing</p></section>
      <section className="rounded-[1.75rem] border border-white/90 bg-white/65 p-4 shadow-[0_18px_55px_-40px_rgba(15,118,110,.5)] backdrop-blur-2xl sm:p-5"><div className="mb-4 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-black text-white">7</span><div><p className="text-[10px] font-black uppercase tracking-wider text-primary">Final review</p><h2 className="text-lg font-black text-slate-900">Order summary</h2></div></div><div className="space-y-3 text-sm"><div className="flex justify-between text-slate-500"><span>MRP total</span><span>{formatINR(mrpTotal)}</span></div>{mrpDiscount > 0 && <div className="flex justify-between font-medium text-emerald-700"><span>Discount</span><span>−{formatINR(mrpDiscount)}</span></div>}<div className="flex justify-between text-slate-500"><span>Delivery charges</span><span className={deliveryCharge === 0 ? 'font-semibold text-emerald-700' : ''}>{deliveryCharge === 0 ? 'FREE' : formatINR(deliveryCharge)}</span></div><div className="flex justify-between text-slate-500"><span>Taxes and charges</span><span>Included</span></div><div className="flex justify-between border-t border-dashed border-slate-200 pt-4 text-base font-extrabold text-slate-900"><span>Total amount</span><span>{formatINR(total + deliveryCharge)}</span></div></div></section>
    </main>
    <div className="fixed inset-x-0 bottom-16 z-30 lg:bottom-0 border-t border-white/80 bg-white/80 px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl"><div className="mx-auto flex max-w-3xl items-center justify-between gap-4"><div><p className="text-[11px] font-medium text-slate-500">Total amount</p><p className="text-xl font-extrabold tracking-tight text-slate-900">{formatINR(total + deliveryCharge)}</p></div><Button size="lg" className="min-w-40 rounded-xl px-6 font-bold shadow-md" disabled={placing} onClick={handlePlaceOrder}>{placing ? 'Placing order…' : <>Place Order <ChevronRight className="ml-2 size-4" /></>}</Button></div></div>
    <MapAddressPicker open={mapOpen} onOpenChange={setMapOpen} onConfirm={(location) => { setAddress(location.address); setDeliveryPoint(location) }} />
    {confirmed && createPortal(
      <div id="wellcare-order-confirmation" className="fixed inset-0 z-[100] h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top_left,_#dff8ef,_transparent_32%),radial-gradient(circle_at_top_right,_#dceeff,_transparent_34%),linear-gradient(180deg,#f5fbfa_0%,#eef7fb_48%,#f7fbff_100%)] text-slate-900">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden">
          <header className="shrink-0 border-b border-white/80 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-2xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <BrandLogo />
              <div className="hidden items-center gap-5 lg:flex">
                {['Medicines','Diagnostics','Consultation','Home Care','Store Pickup'].map((item) => <span key={item} className="text-[11px] font-bold text-slate-500">{item}</span>)}
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">Order confirmed</span>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-4 lg:px-7">
            <div className="grid gap-3 lg:grid-cols-12">
              <section className="relative overflow-hidden rounded-[1.5rem] border border-white/90 bg-white/78 p-4 shadow-[0_18px_60px_-35px_rgba(15,118,110,.35)] backdrop-blur-2xl lg:col-span-4">
                <div className="absolute -right-16 -top-16 size-40 rounded-full bg-emerald-200/50 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60"><div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600"><CheckCircle2 className="size-6 text-white" /></div></div>
                    <div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">1 · Order confirmed</p><h1 className="mt-0.5 text-2xl font-black tracking-tight">Healthcare journey started</h1><p className="text-xs text-slate-500">Your order has been successfully placed.</p></div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-[9px] font-bold uppercase text-slate-400">Order ID</p><p className="mt-1 text-sm font-black">#{shortOrderId(confirmed.orderId)}</p></div>
                    <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-[9px] font-bold uppercase text-slate-400">Total paid</p><p className="mt-1 text-sm font-black text-primary">{formatINR(confirmed.total)}</p></div>
                  </div>
                  <div className="mt-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 p-3 text-white shadow-lg">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">{confirmed.fulfillment === 'delivery' ? 'Estimated delivery' : 'Pickup ready'}</p>
                    <p className="mt-1 text-xl font-black">{confirmed.fulfillment === 'delivery' ? 'Today · 30–90 min*' : 'We’ll notify you when ready'}</p>
                    <p className="mt-1 text-[10px] text-white/80">*Final timing depends on preparation and coverage.</p>
                  </div>
                  <Link to="/track/$orderId" params={{ orderId: confirmed.orderId }} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-extrabold text-white shadow-lg"><PackageCheck className="size-5" /> Track your order <ArrowRight className="size-4" /></Link>
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-white/90 bg-white/78 p-4 shadow-sm backdrop-blur-2xl lg:col-span-4">
                <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-primary">2 · Your healthcare journey</p><h2 className="mt-1 text-lg font-black">Live order progress</h2></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700">● LIVE</span></div>
                <div className="mt-3 space-y-2.5">
                  {['Order confirmed','Pharmacy preparing','Packed','Out for delivery','Delivered'].map((step,i)=><div key={step} className="flex items-center gap-3"><span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-black', i<2 ? 'border-emerald-500 bg-emerald-500 text-white' : i===2 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-400')}>{i<2 ? <Check className="size-3.5" /> : i+1}</span><div className={cn('h-9 flex-1 rounded-xl px-3 py-2 text-xs font-bold', i===1 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-600')}>{step}{i===1 && <span className="float-right text-[9px] font-black text-emerald-600">CURRENT</span>}</div></div>)}
                </div>
                <div className="mt-3 rounded-2xl border border-slate-100 bg-gradient-to-br from-sky-50 to-white p-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500"><span>Live tracking</span><span className="text-emerald-600">● Live</span></div>
                  <div className="relative mt-2 h-24 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#dff4e8_25%,#e8f2ff_25%,#e8f2ff_50%,#dff4e8_50%,#dff4e8_75%,#e8f2ff_75%)] bg-[length:42px_42px]">
                    <div className="absolute left-[18%] top-[58%] size-4 rounded-full bg-blue-600 ring-4 ring-white/80" /><div className="absolute right-[18%] top-[25%] size-5 rounded-full bg-emerald-500 ring-4 ring-white/80" />
                    <div className="absolute left-[20%] top-[58%] h-1 w-[62%] rotate-[-22deg] rounded-full bg-blue-600/80" /><Truck className="absolute right-[30%] top-[35%] size-6 text-blue-700" />
                  </div>
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-white/90 bg-white/78 p-4 shadow-sm backdrop-blur-2xl lg:col-span-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">3 · Order details</p><h2 className="mt-1 text-lg font-black">Fulfilment & payment</h2>
                <div className="mt-3 space-y-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-[9px] font-bold uppercase text-slate-400">Fulfilment method</p><p className="mt-1 flex items-center gap-2 text-sm font-bold">{confirmed.fulfillment === 'delivery' ? <Truck className="size-4 text-emerald-600" /> : <Store className="size-4 text-emerald-600" />}{confirmed.fulfillment === 'delivery' ? 'Express Home Delivery' : 'Store Pickup'}</p></div>
                  <div className="rounded-xl border border-slate-100 bg-white p-3"><p className="text-[9px] font-bold uppercase text-slate-400">Delivery / pickup point</p><p className="mt-1 text-xs font-semibold leading-5">{confirmed.fulfillment === 'delivery' ? confirmed.deliveryAddress : STORE_LOCATION.label}</p></div>
                  <div className="rounded-xl border border-slate-100 bg-white p-3"><p className="text-[9px] font-bold uppercase text-slate-400">Payment status</p><p className="mt-1 flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="size-4" /> Successful & secure</p></div>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-[9px] font-bold uppercase text-emerald-700">Prescription status</p><p className="mt-1 text-sm font-black text-emerald-800">✓ Verified / not required</p></div>
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-white/90 bg-white/78 p-4 shadow-sm backdrop-blur-2xl lg:col-span-7">
                <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-primary">4 · Items in your order</p><h2 className="mt-1 text-lg font-black">{confirmed.items.length} {confirmed.items.length === 1 ? 'item' : 'items'}</h2></div><Link to="/orders" className="text-[10px] font-black text-primary">View all orders</Link></div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {confirmed.items.slice(0,6).map((item)=><div key={item.medicineId} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm"><div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ShoppingBag className="size-5" /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{item.name}</p><p className="mt-0.5 text-[10px] text-slate-500">Qty: {item.quantity}</p></div><p className="text-sm font-black">{formatINR(item.price * item.quantity)}</p></div>)}
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-white/90 bg-white/78 p-4 shadow-sm backdrop-blur-2xl lg:col-span-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">5 · Price breakdown</p><h2 className="mt-1 text-lg font-black">Order total</h2>
                <div className="mt-3 space-y-2 text-xs"><div className="flex justify-between text-slate-500"><span>Items total</span><span>{formatINR(confirmed.total)}</span></div><div className="flex justify-between text-slate-500"><span>Delivery fee</span><span className="text-emerald-700">FREE / included</span></div><div className="flex justify-between text-slate-500"><span>Discounts</span><span className="text-emerald-700">Applied at checkout</span></div><div className="flex justify-between rounded-xl bg-emerald-50 p-3 text-base font-black text-emerald-800"><span>Total paid</span><span>{formatINR(confirmed.total)}</span></div></div>
              </section>

              <section className="rounded-[1.5rem] border border-white/90 bg-white/78 p-4 shadow-sm backdrop-blur-2xl lg:col-span-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">6 · Prescription & consultation</p><h2 className="mt-1 text-lg font-black">Care support</h2>
                <div className="mt-3 grid grid-cols-2 gap-2"><button className="rounded-xl bg-emerald-50 p-3 text-left"><CheckCircle2 className="size-5 text-emerald-600" /><p className="mt-2 text-xs font-black">Prescription</p><p className="text-[9px] text-slate-500">View status</p></button><button className="rounded-xl bg-blue-50 p-3 text-left"><MessageCircle className="size-5 text-blue-600" /><p className="mt-2 text-xs font-black">Consultation</p><p className="text-[9px] text-slate-500">Get pharmacist help</p></button></div>
              </section>

              <section className="rounded-[1.5rem] border border-white/90 bg-white/78 p-4 shadow-sm backdrop-blur-2xl lg:col-span-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">7 · Lab tests & home collection</p><h2 className="mt-1 text-lg font-black">Diagnostics</h2>
                <div className="mt-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 p-3 text-white"><p className="text-[9px] font-bold uppercase tracking-wider text-white/80">Home sample collection</p><p className="mt-1 text-sm font-black">Book a lab test</p><p className="mt-1 text-[10px] text-white/80">CBC, diabetes, thyroid & more</p><button className="mt-3 w-full rounded-xl bg-white/95 py-2 text-[10px] font-black text-violet-700">Explore Diagnostics</button></div>
              </section>

              <section className="rounded-[1.5rem] border border-white/90 bg-white/78 p-4 shadow-sm backdrop-blur-2xl lg:col-span-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">8 · Store pickup information</p><h2 className="mt-1 text-lg font-black">Pickup ready flow</h2>
                <div className="mt-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 p-4 text-white"><p className="text-[9px] font-bold uppercase text-white/75">Pickup location</p><p className="mt-1 font-black">{STORE_LOCATION.label}</p><p className="mt-2 text-[10px] text-white/80">We’ll notify you when your order is ready. Carry a valid ID.</p><button className="mt-3 w-full rounded-xl bg-white py-2 text-[10px] font-black text-emerald-700">View Store on Map</button></div>
              </section>

              <section className="rounded-[1.5rem] border border-white/90 bg-white/78 p-4 shadow-sm backdrop-blur-2xl lg:col-span-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">9 · Additional options</p><h2 className="mt-1 text-lg font-black">Make care easier</h2>
                <div className="mt-3 grid grid-cols-2 gap-2">{[['♡','Add to Wishlist'],['↻','Set Refill Reminder'],['⟳','Buy Again'],['☏','Chat with Pharmacist']].map(([icon,label])=><button key={label} className="rounded-xl border border-slate-100 bg-white p-3 text-left shadow-sm"><span className="text-lg text-primary">{icon}</span><p className="mt-1 text-[10px] font-black">{label}</p></button>)}</div>
              </section>

              <section className="rounded-[1.5rem] border border-white/90 bg-white/78 p-4 shadow-sm backdrop-blur-2xl lg:col-span-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">10 · Notifications & updates</p><h2 className="mt-1 text-lg font-black">Stay updated</h2>
                <div className="mt-3 space-y-2">{['Push Notifications','SMS','WhatsApp','Email'].map((label)=><div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5"><span className="flex items-center gap-2 text-xs font-bold"><Bell className="size-4 text-primary" />{label}</span><span className="h-5 w-9 rounded-full bg-emerald-500 p-0.5"><span className="block size-4 translate-x-4 rounded-full bg-white shadow-sm" /></span></div>)}</div>
                <a href="https://wa.me/917088252556" target="_blank" rel="noopener noreferrer" className="mt-3 block text-center text-[10px] font-black text-primary">Manage notifications</a>
              </section>

              <section className="rounded-[1.5rem] border border-white/90 bg-white/78 p-4 shadow-sm backdrop-blur-2xl lg:col-span-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">11 · Live order tracking</p><h2 className="mt-1 text-lg font-black">Delivery journey</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="relative h-32 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#dff4e8_25%,#e8f2ff_25%,#e8f2ff_50%,#dff4e8_50%,#dff4e8_75%,#e8f2ff_75%)] bg-[length:44px_44px]"><div className="absolute left-5 top-20 size-4 rounded-full bg-blue-600 ring-4 ring-white/80" /><div className="absolute right-6 top-7 size-5 rounded-full bg-emerald-500 ring-4 ring-white/80" /><div className="absolute left-8 top-20 h-1 w-[65%] rotate-[-25deg] bg-blue-600/80" /><Truck className="absolute left-1/2 top-12 size-6 text-blue-700" /></div><div className="space-y-2">{['Pharmacy preparing','Packed','Out for delivery','Delivered'].map((s,i)=><div key={s} className="flex items-center gap-2 text-[10px] font-bold"><span className={cn('size-3 rounded-full',i<2?'bg-emerald-500':'bg-slate-200')} />{s}{i===0&&<span className="ml-auto text-emerald-600">Current</span>}</div>)}</div></div>
                <Link to="/track/$orderId" params={{ orderId: confirmed.orderId }} className="mt-3 flex min-h-10 items-center justify-center rounded-xl bg-primary text-xs font-black text-white">Open live tracking</Link>
              </section>

              <section className="rounded-[1.5rem] border border-white/90 bg-white/78 p-4 shadow-sm backdrop-blur-2xl lg:col-span-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">12 · My care journey</p><h2 className="mt-1 text-lg font-black">All services in one place</h2>
                <div className="mt-3 space-y-2">{['Consultation · Completed','Prescription · Verified','Medicines · Out for delivery','Lab test · Available','Reports · View when ready'].map((s,i)=><div key={s} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 text-[10px] font-bold"><span className={cn('flex size-5 items-center justify-center rounded-full',i<2?'bg-emerald-500 text-white':'bg-blue-50 text-blue-600')}>{i<2?'✓':'•'}</span>{s}<ChevronRight className="ml-auto size-3 text-slate-400" /></div>)}</div>
                <button className="mt-3 w-full rounded-xl bg-slate-900 py-2.5 text-[10px] font-black text-white">View full care journey</button>
              </section>

              <section className="rounded-[1.5rem] border border-white/90 bg-white/78 p-4 shadow-sm backdrop-blur-2xl lg:col-span-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">13 · Health plan</p><h2 className="mt-1 text-lg font-black">Wellcare benefits</h2>
                <div className="mt-3 rounded-2xl bg-gradient-to-br from-blue-800 to-cyan-700 p-3 text-white"><p className="text-xs font-black">Wellcare Health Plan</p><p className="mt-1 text-[9px] text-white/70">Your benefits</p><div className="mt-3 space-y-1.5 text-[9px]"><p>✓ Consultation credits</p><p>✓ Diagnostic discounts</p><p>✓ Free delivery on eligible orders</p><p>✓ Exclusive member offers</p></div><button className="mt-3 w-full rounded-xl bg-white py-2 text-[10px] font-black text-blue-800">View plans & upgrade</button></div>
              </section>

              <section className="rounded-[1.5rem] border border-white/90 bg-white/78 p-4 shadow-sm backdrop-blur-2xl lg:col-span-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">14 · Documents & invoice</p><h2 className="mt-1 text-lg font-black">Your records</h2>
                <div className="mt-3 space-y-2">{['Invoice','Prescription','Lab Report','Consultation Summary','Payment Receipt'].map((label)=><button key={label} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white p-2.5 text-left"><FileText className="size-4 text-primary" /><span className="flex-1"><span className="block text-xs font-bold">{label}</span><span className="text-[9px] text-slate-400">View / Download</span></span><ChevronRight className="size-4 text-slate-400" /></button>)}</div>
              </section>

              <section className="rounded-[1.5rem] border border-white/90 bg-white/78 p-4 shadow-sm backdrop-blur-2xl lg:col-span-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">15 · Next steps & quick actions</p><h2 className="mt-1 text-lg font-black">We’ve got you covered</h2>
                <div className="mt-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-cyan-50 p-3"><p className="text-sm font-black">Your order is on the way to being ready.</p><p className="mt-1 text-[10px] text-slate-500">Track delivery, manage reminders, or get help whenever you need it.</p></div>
                <div className="mt-3 grid grid-cols-2 gap-2"><Link to="/track/$orderId" params={{ orderId: confirmed.orderId }} className="rounded-xl bg-primary py-2.5 text-center text-[10px] font-black text-white">Track Order</Link><a href="https://wa.me/917088252556" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-emerald-200 bg-white py-2.5 text-center text-[10px] font-black text-emerald-700">Need Help?</a><Link to="/orders" className="rounded-xl border border-slate-100 bg-white py-2.5 text-center text-[10px] font-black">My Orders</Link><button onClick={() => navigate({ to: '/' })} className="rounded-xl border border-slate-100 bg-white py-2.5 text-[10px] font-black">Shop Again</button></div>
              </section>
            </div>

            <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-[1.5rem] border border-white/90 bg-white/70 px-4 py-3 text-center shadow-sm backdrop-blur-2xl sm:flex-row sm:text-left">
              <div><p className="text-sm font-black">Wellcare Medicose · Your Health, Our Priority</p><p className="text-[10px] text-slate-500">Genuine medicines · Licensed pharmacy · Secure payments · 24/7 support</p></div>
              <Button variant="outline" className="rounded-xl" onClick={() => navigate({ to: '/' })}><ShoppingBag className="mr-2 size-4" /> Continue shopping</Button>
            </div>
          </main>
        </div>
      </div>
    , document.body)


  </div>
}
