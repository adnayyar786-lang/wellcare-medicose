import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Store, Truck, Smartphone, CreditCard, Banknote, Wallet, Lock, CheckCircle2, MessageCircle, MapPinned, Check, Clock3, UserRound, Phone, FileText, ChevronRight, PackageCheck, Sparkles, ArrowRight, ShoppingBag } from 'lucide-react'
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
    {confirmed && (
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-gradient-to-b from-[#eef9f7] via-white to-[#f4f8ff] text-slate-900">
        <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col">
          <header className="flex items-center justify-between px-5 pb-3 pt-7 sm:px-8 sm:pt-10">
            <BrandLogo />
            <span className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-700 shadow-sm">Order confirmed</span>
          </header>

          <main className="flex flex-1 flex-col px-5 pb-8 sm:px-8">
            <section className="relative overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_20px_70px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-52 bg-gradient-to-br from-emerald-100 via-cyan-50 to-blue-100" />
              <div className="absolute -right-16 top-8 size-40 rounded-full bg-white/50 blur-3xl" />
              <div className="absolute -left-20 top-24 size-44 rounded-full bg-emerald-200/30 blur-3xl" />

              <div className="relative px-5 pb-6 pt-8 text-center sm:px-8 sm:pt-10">
                <div className="mx-auto flex size-24 items-center justify-center rounded-full bg-white shadow-xl ring-8 ring-white/50">
                  <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-inner">
                    <CheckCircle2 className="size-10 text-white" strokeWidth={2.2} />
                  </div>
                </div>
                <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.22em] text-emerald-700">Payment & order successful</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Order confirmed 🎉</h1>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Your order has been placed successfully. We’re getting it ready for you.</p>

                <div className="relative mx-auto mt-7 h-36 max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-b from-sky-50 to-white">
                  <div className="absolute inset-x-0 bottom-8 border-t-2 border-dashed border-slate-200" />
                  <div className="absolute bottom-4 left-5 flex size-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><Store className="size-4" /></div>
                  <div className="absolute bottom-4 right-5 flex size-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><MapPinned className="size-4" /></div>
                  <div className="absolute left-1/2 top-5 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[10px] font-bold text-emerald-700 shadow-sm">
                    <span className="size-2 animate-pulse rounded-full bg-emerald-500" /> Preparing your order
                  </div>
                  <div className="absolute bottom-6 left-[18%] animate-[bounce_2.4s_ease-in-out_infinite]">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-cyan-600 text-white shadow-lg shadow-blue-900/20">
                      <Truck className="size-8" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-[28%] h-1 w-[44%] overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500" />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-emerald-50 px-3 py-3 text-center"><CheckCircle2 className="mx-auto size-5 text-emerald-600" /><p className="mt-1 text-[10px] font-bold text-emerald-800">Order placed</p></div>
                  <div className="rounded-2xl bg-blue-50 px-3 py-3 text-center"><PackageCheck className="mx-auto size-5 text-blue-600" /><p className="mt-1 text-[10px] font-bold text-blue-800">Preparing</p></div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center"><Truck className="mx-auto size-5 text-slate-400" /><p className="mt-1 text-[10px] font-bold text-slate-500">On the way</p></div>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-8">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Order number</p>
                    <p className="mt-1 font-extrabold tracking-wide text-slate-900">#{shortOrderId(confirmed.orderId)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Order total</p>
                    <p className="mt-1 text-lg font-black text-primary">{formatINR(confirmed.total)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-left">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">{confirmed.fulfillment === 'delivery' ? <Truck className="size-5" /> : <Store className="size-5" />}</span>
                  <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">{confirmed.fulfillment === 'delivery' ? 'Delivering to' : 'Pickup from'}</p><p className="mt-1 text-sm font-semibold leading-5 text-slate-800">{confirmed.fulfillment === 'delivery' ? (confirmed.deliveryAddress ?? 'Delivery address saved with your order') : STORE_LOCATION.label}</p></div>
                </div>
              </div>
            </section>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link to="/track/$orderId" params={{ orderId: confirmed.orderId }} className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 to-cyan-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-900/15 transition-transform hover:-translate-y-0.5"><PackageCheck className="size-5" /> Track your order <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
              <a href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(buildWhatsAppMessage(confirmed))}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white text-sm font-bold text-emerald-700 shadow-sm hover:bg-emerald-50"><MessageCircle className="size-5" /> Send on WhatsApp</a>
            </div>
            <Button variant="ghost" className="mt-2 min-h-11 rounded-2xl text-slate-500" onClick={() => navigate({ to: '/' })}><ShoppingBag className="mr-2 size-4" /> Continue shopping</Button>
          </main>
        </div>
      </div>
    )}
  </div>
}
