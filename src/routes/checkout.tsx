import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Store, Truck, Smartphone, CreditCard, Banknote, Wallet, Lock, CheckCircle2, MessageCircle, MapPinned, Check, Clock3, UserRound, Phone, FileText, ChevronRight } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
      clearCart()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Could not place order') }
    finally { setPlacing(false) }
  }
  if (lines.length === 0 && !confirmed) return <div className="mx-auto max-w-lg px-4 py-16 text-center"><p className="text-sm text-muted-foreground">Your cart is empty.</p><Link to="/" className="mt-4 inline-block text-sm text-primary underline">Continue shopping</Link></div>
  const methods = [{ key: 'upi', label: 'UPI', icon: Smartphone }, { key: 'card', label: 'Card', icon: CreditCard }, { key: 'wallet', label: 'Wallet', icon: Wallet }, { key: 'cod', label: 'Cash on Delivery', icon: Banknote }] as const
  return <div className="min-h-screen bg-slate-50/70 pb-40">
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Step 1 of 2 · Delivery details</p><h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Checkout</h1><p className="mt-0.5 text-xs text-slate-500">Review your details before placing your order</p></div><BrandLogo /></div>
    </header>
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-5 sm:py-7">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <Label className="text-base font-bold text-slate-900">How would you like to receive your order?</Label>
        <div className="mt-4 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Order fulfillment">
          {([{ value: 'delivery', title: 'Home Delivery', desc: 'Delivered to your doorstep', icon: Truck }, { value: 'pickup', title: 'Store Pickup', desc: 'Collect from our store', icon: Store }] as const).map(({ value, title, desc, icon: Icon }) => {
            const selected = fulfillment === value
            return <button key={value} type="button" role="radio" aria-checked={selected} onClick={() => { setFulfillment(value); if (value === 'delivery' && !address) setMapOpen(true) }} className={cn('relative flex min-h-32 flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all', selected ? 'border-primary bg-emerald-50/70 shadow-sm' : 'border-slate-200 bg-white hover:border-primary/40')}>
              <span className={cn('flex size-11 items-center justify-center rounded-2xl', selected ? 'bg-primary text-white' : 'bg-slate-100 text-primary')}><Icon className="size-5" /></span><span className="text-sm font-bold text-slate-900">{title}</span><span className="text-xs leading-relaxed text-slate-500">{desc}</span>{selected && <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-white"><Check className="size-3" /></span>}
            </button>
          })}
        </div>
      </section>
      {fulfillment === 'pickup' ? <section className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-primary"><Store className="size-5" /></span><div><p className="font-semibold text-slate-900">Collect from Wellcare Medicose</p><p className="mt-1 text-sm text-slate-600">{STORE_LOCATION.label}</p><p className="mt-1 text-xs text-slate-500">Open 24×7 · No delivery address needed for pickup.</p></div></section> : <>
        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3"><div><p className="text-base font-bold text-slate-900">Deliver to</p><p className="mt-0.5 text-xs text-slate-500">Confirm your precise drop-off point</p></div><Button type="button" variant="outline" className="shrink-0 rounded-xl" onClick={() => setMapOpen(true)}><MapPinned className="mr-2 size-4" />{address ? 'Edit location' : 'Pin on map'}</Button></div>
          <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4" aria-live="polite"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600"><MapPinned className="size-6" /></span><div className="min-w-0">{address ? <><p className="text-sm font-semibold text-slate-900">{address}</p><p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700"><CheckCircle2 className="size-3.5" /> Map pin selected · verify address</p></> : <><p className="font-semibold text-slate-800">Add delivery location</p><p className="mt-1 text-sm text-slate-500">Use the map pin to choose your doorstep address.</p></>}</div></div>
          <button type="button" onClick={() => setMapOpen(true)} className="flex w-full items-center justify-between rounded-xl border border-dashed border-primary/40 bg-primary/[0.03] px-4 py-3 text-left text-sm font-semibold text-primary hover:bg-primary/[0.06]"><span className="flex items-center gap-2"><MapPinned className="size-4" />Open map and adjust pin</span><ChevronRight className="size-4" /></button>
        </section>
        <section aria-live="polite" className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><Clock3 className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Estimated delivery</p><p className="mt-0.5 text-xl font-extrabold tracking-tight text-emerald-800">{deliveryEstimate ?? 'Choose your location'}</p><p className="text-xs leading-relaxed text-emerald-800/80">{deliveryDistanceKm === null ? 'Pin your address to see an indicative delivery window.' : deliveryDistanceKm > 12 ? 'We’ll confirm delivery coverage and timing before dispatch.' : `Indicative estimate based on straight-line distance (${deliveryDistanceKm.toFixed(1)} km). Traffic and preparation time can change actual delivery.`}</p></div><Truck className="size-7 shrink-0 text-emerald-700" /></section>
      </>}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center gap-2"><Clock3 className="size-4 text-primary" /><Label htmlFor="time-pref" className="font-bold text-slate-900">Preferred {fulfillment === 'pickup' ? 'pickup' : 'delivery'} time <span className="font-normal text-slate-400">(optional)</span></Label></div><Input id="time-pref" className="h-12 rounded-xl bg-slate-50" value={deliveryTimePref} onChange={(e) => setDeliveryTimePref(e.target.value)} placeholder="e.g. Evening after 6 PM" /></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center gap-2"><UserRound className="size-4 text-primary" /><h2 className="text-base font-bold text-slate-900">Contact details</h2></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="name">Your name</Label><Input id="name" className="h-12 rounded-xl bg-slate-50" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter your full name" /></div><div className="space-y-1.5"><Label htmlFor="phone">Phone number</Label><div className="relative"><Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input id="phone" className="h-12 rounded-xl bg-slate-50 pl-10" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Enter mobile number" inputMode="tel" /></div></div></div><div className="mt-4 space-y-1.5"><Label htmlFor="notes">Order notes <span className="font-normal text-slate-400">(optional)</span></Label><div className="relative"><FileText className="absolute left-3 top-3 size-4 text-slate-400" /><Textarea id="notes" className="min-h-24 rounded-xl bg-slate-50 pl-10" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions? (e.g. call before delivery)" /></div></div></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center gap-2"><CreditCard className="size-4 text-primary" /><h2 className="text-base font-bold text-slate-900">Payment method</h2></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{methods.map(({ key, label, icon: Icon }) => <button key={key} type="button" aria-pressed={paymentMethod === key} onClick={() => setPaymentMethod(key)} className={cn('flex min-h-20 flex-col items-start justify-between gap-2 rounded-xl border p-3 text-left text-sm font-semibold transition-colors', paymentMethod === key ? 'border-primary bg-emerald-50 text-slate-900 ring-1 ring-primary/20' : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40')}><span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-primary"><Icon className="size-4" /></span><span className="flex w-full items-center justify-between gap-1">{label}{paymentMethod === key && <CheckCircle2 className="size-4 text-primary" />}</span></button>)}</div><p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Lock className="size-3.5 text-emerald-700" />Secure order processing</p></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><h2 className="mb-4 text-base font-bold text-slate-900">Bill details</h2><div className="space-y-3 text-sm"><div className="flex justify-between text-slate-500"><span>MRP total</span><span>{formatINR(mrpTotal)}</span></div>{mrpDiscount > 0 && <div className="flex justify-between font-medium text-emerald-700"><span>Discount</span><span>−{formatINR(mrpDiscount)}</span></div>}<div className="flex justify-between text-slate-500"><span>Delivery charges</span><span className={deliveryCharge === 0 ? 'font-semibold text-emerald-700' : ''}>{deliveryCharge === 0 ? 'FREE' : formatINR(deliveryCharge)}</span></div><div className="flex justify-between text-slate-500"><span>Taxes and charges</span><span>Included</span></div><div className="flex justify-between border-t border-dashed border-slate-200 pt-4 text-base font-extrabold text-slate-900"><span>Total amount</span><span>{formatINR(total + deliveryCharge)}</span></div></div></section>
    </main>
    <div className="fixed inset-x-0 bottom-16 z-10 lg:bottom-0 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl"><div className="mx-auto flex max-w-3xl items-center justify-between gap-4"><div><p className="text-[11px] font-medium text-slate-500">Total amount</p><p className="text-xl font-extrabold tracking-tight text-slate-900">{formatINR(total + deliveryCharge)}</p></div><Button size="lg" className="min-w-40 rounded-xl px-6 font-bold shadow-md" disabled={placing} onClick={handlePlaceOrder}>{placing ? 'Placing order…' : <>Place Order <ChevronRight className="ml-2 size-4" /></>}</Button></div></div>
    <MapAddressPicker open={mapOpen} onOpenChange={setMapOpen} onConfirm={(location) => { setAddress(location.address); setDeliveryPoint(location) }} />
    <Dialog open={!!confirmed} onOpenChange={(o) => !o && navigate({ to: '/' })}><DialogContent className="max-w-sm rounded-3xl"><DialogHeader><div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-primary/10"><CheckCircle2 className="size-8 text-primary" /></div><DialogTitle className="text-center text-xl">आपका ऑर्डर मिल गया है</DialogTitle></DialogHeader>{confirmed && <div className="space-y-4 text-center"><p className="text-sm text-muted-foreground">Order Number: <span className="font-semibold text-foreground">#{shortOrderId(confirmed.orderId)}</span></p><p className="text-lg font-bold text-primary">{formatINR(confirmed.total)}</p><div className="rounded-xl bg-secondary p-3 text-left text-xs"><p className="font-semibold text-secondary-foreground">{confirmed.fulfillment === 'delivery' ? 'Home Delivery' : 'Store Pickup'}</p><p className="mt-0.5 text-muted-foreground">{confirmed.fulfillment === 'delivery' ? (confirmed.deliveryAddress ?? 'Delivery address saved with your order') : `Collect from ${STORE_LOCATION.label}`}</p></div><a href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(buildWhatsAppMessage(confirmed))}`} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"><MessageCircle className="size-4" />Send order on WhatsApp</a><Link to="/track/$orderId" params={{ orderId: confirmed.orderId }} className="block text-sm font-medium text-primary underline">View / track your order</Link><Button variant="outline" className="w-full rounded-xl" onClick={() => navigate({ to: '/' })}>Continue shopping</Button></div>}</DialogContent></Dialog>
  </div>
}
