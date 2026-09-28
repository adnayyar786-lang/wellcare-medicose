import { useConvexAuth, useMutation } from 'convex/react'
import { useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { motion } from 'framer-motion'
import { Pill, Cross, Mail, Phone, Loader2 } from 'lucide-react'
import { BrandMark } from '@/components/brand'
import { api } from '../../convex/_generated/api'
import { GoogleAuthButton } from '@/components/google-auth-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function FloatingShape({ className, delay, duration, children }: { className: string; delay: number; duration: number; children: React.ReactNode }) {
  return <motion.div className={`absolute text-white/[0.06] ${className}`} animate={{ y: [0, -18, 0], rotate: [0, 6, 0] }} transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}>{children}</motion.div>
}

export function LoginScreen() {
  const { signIn } = useAuthActions()
  const [method, setMethod] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'identifier' | 'code'>('identifier')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function changeMethod(next: 'email' | 'phone') {
    setMethod(next); setStep('identifier'); setCode(''); setError(null)
  }

  async function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(null)
    try {
      const data = new FormData()
      if (method === 'email') {
        data.set('email', email.trim())
        await signIn('resend-otp', data)
      } else {
        const normalizedPhone = phone.replace(/[\s()-]/g, '')
        if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
          throw new Error('Enter your phone number with country code, e.g. +919876543210.')
        }
        setPhone(normalizedPhone)
        data.set('phone', normalizedPhone)
        await signIn('phone', data)
      }
      setStep('code')
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not send the ${method === 'email' ? 'email' : 'SMS'} code. Please try again.`)
    } finally { setLoading(false) }
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(null)
    try {
      const data = new FormData(); data.set('code', code.trim())
      if (method === 'email') {
        data.set('email', email.trim())
        await signIn('resend-otp', data)
      } else {
        data.set('phone', phone)
        await signIn('phone', data)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That code could not be verified. Please try again.')
    } finally { setLoading(false) }
  }

  return <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-10" style={{ background: 'linear-gradient(160deg, #0A2540 0%, #0B3F72 55%, #0A5C6E 100%)' }}>
    <FloatingShape className="left-[8%] top-[15%]" delay={0} duration={9}><Pill className="size-16" strokeWidth={1} /></FloatingShape>
    <FloatingShape className="right-[10%] top-[22%]" delay={1.2} duration={11}><Cross className="size-12" strokeWidth={1} /></FloatingShape>
    <FloatingShape className="bottom-[18%] left-[14%]" delay={0.6} duration={10}><Cross className="size-20" strokeWidth={0.75} /></FloatingShape>
    <FloatingShape className="bottom-[12%] right-[12%]" delay={1.8} duration={8}><Pill className="size-10" strokeWidth={1} /></FloatingShape>
    <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
    <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-white/[0.08] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="flex flex-col items-center text-center"><motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="flex size-16 items-center justify-center"><BrandMark className="size-16" /></motion.div><h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Sign in or create your account</h1><p className="mt-2 text-sm text-white/70">Verify your email or mobile number to continue and place your order.</p></div>
      <div className="mt-7"><GoogleAuthButton premium /></div>
      <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-white/45"><span className="h-px flex-1 bg-white/20" />or use a one-time code<span className="h-px flex-1 bg-white/20" /></div>
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-black/15 p-1">
        <button type="button" onClick={() => changeMethod('email')} aria-pressed={method === 'email'} className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition ${method === 'email' ? 'bg-white text-slate-900 shadow' : 'text-white/75 hover:bg-white/10'}`}><Mail className="size-4" /> Email</button>
        <button type="button" onClick={() => changeMethod('phone')} aria-pressed={method === 'phone'} className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition ${method === 'phone' ? 'bg-white text-slate-900 shadow' : 'text-white/75 hover:bg-white/10'}`}><Phone className="size-4" /> Mobile number</button>
      </div>
      {step === 'identifier' ? <form onSubmit={requestCode} className="space-y-3">
        {method === 'email' ? <><label htmlFor="auth-email" className="text-sm font-medium text-white/90">Email address</label><Input id="auth-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" disabled={loading} className="h-12 rounded-xl border-white/20 bg-white text-slate-900 placeholder:text-slate-400" /></> : <><label htmlFor="auth-phone" className="text-sm font-medium text-white/90">Mobile number with country code</label><Input id="auth-phone" type="tel" inputMode="tel" autoComplete="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" disabled={loading} className="h-12 rounded-xl border-white/20 bg-white text-slate-900 placeholder:text-slate-400" /><p className="text-xs leading-relaxed text-white/55">Include the + country code. An SMS service must be configured for code delivery.</p></>}
        <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600">{loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : method === 'email' ? <Mail className="mr-2 size-4" /> : <Phone className="mr-2 size-4" />}{loading ? 'Sending code…' : `Continue with ${method === 'email' ? 'email' : 'mobile number'}`}</Button>
      </form> : <form onSubmit={verifyCode} className="space-y-3"><p className="text-sm text-white/80">Enter the 6-digit code sent to <strong>{method === 'email' ? email : phone}</strong>.</p><Input aria-label="Verification code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" disabled={loading} className="h-12 rounded-xl border-white/20 bg-white text-center text-lg tracking-[0.4em] text-slate-900" /><Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600">{loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}{loading ? 'Verifying…' : 'Verify and continue'}</Button><button type="button" onClick={() => { setStep('identifier'); setCode(''); setError(null) }} className="w-full text-sm text-white/75 underline">Use a different {method === 'email' ? 'email' : 'number'}</button></form>}
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-500/15 p-3 text-sm text-red-100">{error}</p>}
      <p className="mt-6 text-center text-xs leading-relaxed text-white/55">Your account helps us associate your orders with you. By continuing, you agree to our <a href="/privacy" className="text-teal-200 underline">Privacy Policy</a>.</p>
    </div>
  </div>
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: s => s.location.pathname })
  const { isAuthenticated, isLoading } = useConvexAuth()
  const recordLogin = useMutation(api.activity.recordLogin)
  const loggedRef = useRef(false)
  useEffect(() => {
    if (isAuthenticated && !loggedRef.current) { loggedRef.current = true; recordLogin({}).catch(() => { loggedRef.current = false }) }
    if (!isAuthenticated) loggedRef.current = false
  }, [isAuthenticated, recordLogin])
  if (pathname !== '/checkout') return <>{children}</>
  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="size-7 animate-spin text-primary" /></div>
  if (!isAuthenticated) return <LoginScreen />
  return <>{children}</>
}
