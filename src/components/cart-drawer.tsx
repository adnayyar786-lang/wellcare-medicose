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
        <SheetHeader className="border-b bg-gradient-to-r from-primary/10 via-background to-emerald-500/5 px-5 py-5 text-left">
          <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShoppingCart className="size-5" /></span><div><SheetTitle className="text-lg font-bold">Your Cart {lines.length > 0 && <span className="text-primary">({lines.length})</span>}</SheetTitle><p className="mt-1 text-xs text-muted-foreground">{lines.length ? 'Review your items before checkout' : 'Your Wellcare shopping bag'}</p></div></div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {lines.length === 0 ? <div className="flex min-h-[55vh] flex-col items-center justify-center px-5 text-center"><span className="mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary"><ShoppingCart className="size-9" /></span><h3 className="text-lg font-semibold">Your cart is empty</h3><p className="mt-2 max-w-[250px] text-sm leading-6 text-muted-foreground">Find medicines and everyday healthcare essentials for you and your family.</p><Button className="mt-5 rounded-xl px-6" onClick={() => { setOpen(false); navigate({ to: '/' }) }}>Continue shopping <ArrowRight className="ml-2 size-4" /></Button><div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> Secure shopping at Wellcare Medicose</div></div> : <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"><PackageCheck className="size-4 shrink-0" /> Choose Home Delivery or Store Pickup at checkout.</div>
            {lines.map(line => <article key={line.medicineId} className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-semibold leading-5">{line.name}</p><div className="mt-1.5 flex items-baseline gap-2"><span className="text-sm font-bold text-primary">{formatINR(line.price)}</span>{line.mrpPrice && line.mrpPrice > line.price && <span className="text-xs text-muted-foreground line-through">{formatINR(line.mrpPrice)}</span>}</div></div><span className="shrink-0 text-sm font-bold">{formatINR(line.price * line.quantity)}</span></div><div className="mt-4 flex items-center justify-between border-t border-dashed pt-3"><div className="inline-flex items-center rounded-xl border border-border bg-muted/40 p-1"><Button size="icon" variant="ghost" className="size-7 rounded-lg" aria-label={`Decrease quantity of ${line.name}`} onClick={() => changeQty(line.medicineId, -1)}><Minus className="size-3.5" /></Button><span className="w-8 text-center text-sm font-semibold tabular-nums">{line.quantity}</span><Button size="icon" variant="ghost" className="size-7 rounded-lg" aria-label={`Increase quantity of ${line.name}`} onClick={() => changeQty(line.medicineId, 1)}><Plus className="size-3.5" /></Button></div><button type="button" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => changeQty(line.medicineId, -line.quantity)}><Trash2 className="size-3.5" /> Remove</button></div></article>)}
            <div className="rounded-2xl border border-border bg-card p-3.5"><div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Tag className="size-4 text-primary" /> Have a coupon?</div><div className="flex gap-2"><Input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Enter coupon code" className="h-10 min-w-0 rounded-xl text-sm uppercase" /><Button variant="outline" className="h-10 rounded-xl px-4" onClick={applyCoupon}>Apply</Button></div></div>
            <div className="rounded-2xl border border-border bg-muted/20 p-4"><h3 className="mb-3 text-sm font-bold">Bill summary</h3><div className="space-y-2 text-sm"><div className="flex justify-between text-muted-foreground"><span>MRP total</span><span>{formatINR(mrpTotal)}</span></div>{discount > 0 && <div className="flex justify-between font-medium text-emerald-700 dark:text-emerald-400"><span>You save</span><span>−{formatINR(discount)}</span></div>}<div className="flex justify-between text-muted-foreground"><span>Delivery charges (estimate)</span><span className={deliveryChargeEstimate === 0 ? 'font-semibold text-emerald-700 dark:text-emerald-400' : ''}>{deliveryChargeEstimate === 0 ? 'FREE' : formatINR(deliveryChargeEstimate)}</span></div><div className="flex justify-between text-muted-foreground"><span>Taxes and charges</span><span>Included</span></div></div><Separator className="my-3" /><div className="flex items-center justify-between"><span className="font-semibold">Total payable</span><span className="text-lg font-bold text-primary">{formatINR(total + deliveryChargeEstimate)}</span></div></div>
          </div>}
        </div>
        {lines.length > 0 && <SheetFooter className="border-t bg-background px-4 py-4 sm:flex-col"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Total payable</p><p className="text-xl font-bold tracking-tight">{formatINR(total + deliveryChargeEstimate)}</p></div><span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400"><ShieldCheck className="size-4" /> Secure checkout</span></div><Button className="h-12 w-full rounded-xl text-sm font-semibold" onClick={handleContinue} data-testid="continue-checkout">Proceed to checkout <ArrowRight className="ml-2 size-4" /></Button></SheetFooter>}
      </SheetContent>
    </Sheet>
  )
}
