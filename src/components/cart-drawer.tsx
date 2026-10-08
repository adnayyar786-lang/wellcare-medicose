import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ShoppingCart, Tag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, PackageCheck } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'

export const OPEN_CART_EVENT = 'wellcare-open-cart'
const COUPON_KEY = 'wellcare-coupon'
function formatINR(n: number) { return `₹${n.toFixed(2)}` }

export function CartDrawer() {
  const { lines, total, mrpTotal, changeQty } = useCart()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  useEffect(() => {
    function onOpen() { setOpen(true) }
    window.addEventListener(OPEN_CART_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_CART_EVENT, onOpen)
  }, [])
  useEffect(() => {
    try { const saved = window.localStorage.getItem(COUPON_KEY); if (saved) setCouponCode(saved) } catch { /* ignore */ }
  }, [open])
  const discount = Math.max(0, mrpTotal - total)
  const deliveryChargeEstimate = total >= 499 || total === 0 ? 0 : 40
  function applyCoupon() {
    const code = couponCode.trim().toUpperCase()
    if (!code) return
    try { window.localStorage.setItem(COUPON_KEY, code) } catch { /* ignore */ }
    toast.success(`Coupon ${code} will be applied at checkout`)
  }
  function handleContinue() { setOpen(false); navigate({ to: '/checkout' }) }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-primary/10 bg-white px-5 py-4 text-left shadow-[0_4px_18px_-14px_rgba(15,118,110,0.45)] dark:bg-background">
          <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-brand-teal text-white shadow-sm"><ShoppingCart className="size-5" /></span><div><SheetTitle className="text-lg font-bold">Your Cart {lines.length > 0 && <span className="text-primary">({lines.length})</span>}</SheetTitle><p className="mt-1 text-xs text-muted-foreground">{lines.length ? 'Review your items before checkout' : 'Your Wellcare shopping bag'}</p></div></div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto bg-slate-50/70 px-4 py-4 dark:bg-background">
          {lines.length === 0 ? <div className="flex min-h-[55vh] flex-col items-center justify-center px-5 text-center"><span className="mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary"><ShoppingCart className="size-9" /></span><h3 className="text-lg font-semibold">Your cart is empty</h3><p className="mt-2 max-w-[250px] text-sm leading-6 text-muted-foreground">Find medicines and everyday healthcare essentials for you and your family.</p><Button className="mt-5 rounded-xl px-6" onClick={() => { setOpen(false); navigate({ to: '/' }) }}>Continue shopping <ArrowRight className="ml-2 size-4" /></Button><div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> Secure shopping at Wellcare Medicose</div></div> : <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50 px-3.5 py-3 text-xs dark:border-emerald-900 dark:from-emerald-950/30 dark:to-teal-950/20"><div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300"><PackageCheck className="size-4 shrink-0" /> Delivery & pickup options</div><p className="mt-1 pl-6 text-[11px] leading-4 text-emerald-700/80 dark:text-emerald-300/70">Choose Home Delivery or Store Pickup at checkout.</p></div>
            {lines.map(line => <article key={line.medicineId} className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_4px_16px_-12px_rgba(15,23,42,0.35)] dark:border-border dark:bg-card"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-semibold leading-5">{line.name}</p><div className="mt-1.5 flex items-baseline gap-2"><span className="text-sm font-bold text-primary">{formatINR(line.price)}</span>{line.mrpPrice && line.mrpPrice > line.price && <span className="text-xs text-muted-foreground line-through">{formatINR(line.mrpPrice)}</span>}</div></div><span className="shrink-0 text-sm font-bold">{formatINR(line.price * line.quantity)}</span></div><div className="mt-4 flex items-center justify-between border-t border-dashed pt-3"><div className="inline-flex items-center rounded-xl border border-border bg-muted/40 p-1"><Button size="icon" variant="ghost" className="size-7 rounded-lg" aria-label={`Decrease quantity of ${line.name}`} onClick={() => changeQty(line.medicineId, -1)}><Minus className="size-3.5" /></Button><span className="w-8 text-center text-sm font-semibold tabular-nums">{line.quantity}</span><Button size="icon" variant="ghost" className="size-7 rounded-lg" aria-label={`Increase quantity of ${line.name}`} onClick={() => changeQty(line.medicineId, 1)}><Plus className="size-3.5" /></Button></div><button type="button" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => changeQty(line.medicineId, -line.quantity)}><Trash2 className="size-3.5" /> Remove</button></div></article>)}
            <div className="rounded-2xl border border-border bg-card p-3.5"><div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Tag className="size-4 text-primary" /> Have a coupon?</div><div className="flex gap-2"><Input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Enter coupon code" className="h-10 min-w-0 rounded-xl text-sm uppercase" /><Button variant="outline" className="h-10 rounded-xl px-4" onClick={applyCoupon}>Apply</Button></div></div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-border dark:bg-card"><h3 className="mb-3 text-sm font-bold">Bill summary</h3><div className="space-y-2 text-sm"><div className="flex justify-between text-muted-foreground"><span>MRP total</span><span>{formatINR(mrpTotal)}</span></div>{discount > 0 && <div className="flex justify-between font-medium text-emerald-700 dark:text-emerald-400"><span>You save</span><span>−{formatINR(discount)}</span></div>}<div className="flex justify-between text-muted-foreground"><span>Delivery charges (estimate)</span><span className={deliveryChargeEstimate === 0 ? 'font-semibold text-emerald-700 dark:text-emerald-400' : ''}>{deliveryChargeEstimate === 0 ? 'FREE' : formatINR(deliveryChargeEstimate)}</span></div><div className="flex justify-between text-muted-foreground"><span>Taxes and charges</span><span>Included</span></div></div><Separator className="my-3" /><div className="flex items-center justify-between"><span className="font-semibold">Total payable</span><span className="text-lg font-bold text-primary">{formatINR(total + deliveryChargeEstimate)}</span></div></div>
          </div>}
        </div>
        {lines.length > 0 && <SheetFooter className="border-t border-primary/10 bg-white px-4 py-4 shadow-[0_-8px_24px_-20px_rgba(15,118,110,0.6)] sm:flex-col dark:bg-background"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Total payable</p><p className="text-xl font-bold tracking-tight">{formatINR(total + deliveryChargeEstimate)}</p></div><span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400"><ShieldCheck className="size-4" /> Secure checkout</span></div><Button className="h-12 w-full rounded-xl bg-gradient-to-r from-primary to-brand-teal text-sm font-extrabold shadow-[0_10px_22px_-14px_rgba(15,118,110,0.9)]" onClick={handleContinue} data-testid="continue-checkout">Proceed to checkout <ArrowRight className="ml-2 size-4" /></Button></SheetFooter>}
      </SheetContent>
    </Sheet>
  )
}
