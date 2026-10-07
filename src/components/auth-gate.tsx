import { useMutation } from 'convex/react'
import { useRouterState } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useFirebaseAuthState } from '@/components/convex-client-provider'
import { createAccountWithEmailFirebase, sendFirebasePhoneCode, sendPasswordResetFirebase, signInWithEmailFirebase } from '@/lib/firebase-auth'
import { motion } from 'framer-motion'
import { Pill, Cross, Phone, Loader2, Mail, MapPin } from 'lucide-react'
import { BrandMark } from '@/components/brand'
import { api } from '../../convex/_generated/api'
import { GoogleAuthButton } from '@/components/google-auth-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Country={code:string;name:string;dial:string}
const fallbackCountries:Country[]=[
{code:'IN',name:'India',dial:'+91'},{code:'US',name:'United States',dial:'+1'},{code:'GB',name:'United Kingdom',dial:'+44'},{code:'AE',name:'United Arab Emirates',dial:'+971'},{code:'SA',name:'Saudi Arabia',dial:'+966'},{code:'CA',name:'Canada',dial:'+1'},{code:'AU',name:'Australia',dial:'+61'},{code:'SG',name:'Singapore',dial:'+65'},{code:'PK',name:'Pakistan',dial:'+92'},{code:'BD',name:'Bangladesh',dial:'+880'},{code:'NP',name:'Nepal',dial:'+977'},{code:'LK',name:'Sri Lanka',dial:'+94'}
]
function flag(code:string){return code.toUpperCase().replace(/./g,c=>String.fromCodePoint(127397+c.charCodeAt(0)))}

function CountryPicker({country,setCountry,phone,setPhone,detectedCode}:{country:Country;setCountry:(c:Country)=>void;phone:string;setPhone:(v:string)=>void;detectedCode?:string|null}){
  const [countries,setCountries]=useState<Country[]>(fallbackCountries)
  const [q,setQ]=useState('')
  useEffect(()=>{if(detectedCode){const found=countries.find(c=>c.code===detectedCode);if(found)setCountry(found)}},[detectedCode,countries])
  useEffect(()=>{fetch('https://restcountries.com/v3.1/all?fields=name,cca2,idd').then(r=>r.json()).then((rows:any[])=>{
    const list=rows.map(x=>({code:x.cca2,name:x.name?.common||x.cca2,dial:x.idd?.root?(x.idd.root+(x.idd.suffixes?.length===1?x.idd.suffixes[0]:'')):''})).filter(x=>x.dial)
    list.sort((a,b)=>a.name.localeCompare(b.name)); setCountries(list)
  }).catch(()=>{})},[])
  const filtered=countries.filter(c=>(c.name+' '+c.dial).toLowerCase().includes(q.toLowerCase()))
  return <div className="space-y-2">
    <div className="flex gap-2">
      <div className="w-32 shrink-0">
        <select value={country.code} onChange={e=>{const c=countries.find(x=>x.code===e.target.value);if(c)setCountry(c)}} className="h-12 w-full rounded-xl border border-white/20 bg-white px-2 text-sm text-slate-900">
          {filtered.map(c=><option key={c.code} value={c.code}>{flag(c.code)} {c.dial} {c.name}</option>)}
        </select>
      </div>
      <Input type="tel" inputMode="tel" autoComplete="tel-national" id="auth-phone" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Mobile number" className="h-12 rounded-xl border-white/20 bg-white text-slate-900" />
    </div>
    <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search country or code…" className="h-10 rounded-xl border-white/20 bg-white text-slate-900" />
  </div>
}

function FloatingShape({ className, delay, duration, children }: { className: string; delay: number; duration: number; children: React.ReactNode }) {
  return <motion.div className={`absolute text-white/[0.06] ${className}`} animate={{ y:[0,-18,0],rotate:[0,6,0] }} transition={{duration,delay,repeat:Infinity,ease:'easeInOut'}}>{children}</motion.div>
}

export function LoginScreen(){
  const [mode,setMode]=useState<'signin'|'signup'>('signin')
  const [method,setMethod]=useState<'email'|'phone'>('email')
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [name,setName]=useState('')
  const [phone,setPhone]=useState(''); const [code,setCode]=useState(''); const [confirmation,setConfirmation]=useState<any>(null)
  const [step,setStep]=useState<'identifier'|'code'>('identifier'); const [loading,setLoading]=useState(false); const [error,setError]=useState<string|null>(null)
  const [country,setCountry]=useState<Country>(fallbackCountries[0])
  const [locationTried,setLocationTried]=useState(false); const [detectedCountryCode,setDetectedCountryCode]=useState<string|null>(null)
  const [recaptchaId]=useState(()=>`firebase-recaptcha-${Math.random().toString(36).slice(2)}`)

  useEffect(()=>{
    if(locationTried)return
    setLocationTried(true)
    if(!navigator.geolocation)return
    navigator.geolocation.getCurrentPosition(async p=>{
      try{
        const r=await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${p.coords.latitude}&longitude=${p.coords.longitude}&localityLanguage=en`)
        const x=await r.json(); const cc=x.countryCode
        if(cc)setDetectedCountryCode(cc)
      }catch{}
    },()=>{}, {enableHighAccuracy:false,timeout:5000,maximumAge:86400000})
  },[locationTried])

  async function submitEmail(e:React.FormEvent){
    e.preventDefault();setLoading(true);setError(null)
    try{
      const user = mode==='signin'
        ? await signInWithEmailFirebase(email,password)
        : await createAccountWithEmailFirebase(email,password,name)
      window.dispatchEvent(new CustomEvent('wellcare-firebase-signed-in', { detail: user }))
    }catch(err){setError(err instanceof Error?err.message:'Email authentication failed. Please try again.')}finally{setLoading(false)}
  }
  async function requestCode(e:React.FormEvent){
    e.preventDefault();setLoading(true);setError(null)
    try{
      const digits=phone.replace(/\D/g,'')
      const dialDigits=country.dial.replace(/\D/g,'')
      if(!digits || digits.length<6 || digits.length>15) throw new Error('Enter a valid mobile number.')
      const local=digits.startsWith(dialDigits) && digits.length>country.dial.replace(/\D/g,'').length
        ? digits.slice(dialDigits.length)
        : digits
      if(!local || local.length<6 || local.length>12) throw new Error('Enter a valid mobile number.')
      const full=`+${dialDigits}${local}`
      const result=await sendFirebasePhoneCode(full,recaptchaId)
      setPhone(local);setConfirmation(result);setStep('code')
    }catch(err){setError(err instanceof Error?err.message:'Could not send the SMS code. Please try again.')}finally{setLoading(false)}
  }
  async function verifyCode(e:React.FormEvent){
    e.preventDefault();setLoading(true);setError(null)
    try{
      if(!confirmation)throw new Error('Please request a mobile verification code first.')
      const result = await confirmation.confirm(code.trim())
      const user = result?.user
      if (!user) throw new Error('Phone verification completed but Firebase did not return a signed-in user.')
      await user.getIdToken(true)
      window.dispatchEvent(new CustomEvent('wellcare-firebase-signed-in', { detail: user }))
    }
    catch(err){setError(err instanceof Error?err.message:'That code could not be verified. Please try again.')}finally{setLoading(false)}
  }

  return <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-10" style={{background:'linear-gradient(160deg,#0A2540 0%,#0B3F72 55%,#0A5C6E 100%)'}}>
    <FloatingShape className="left-[8%] top-[15%]" delay={0} duration={9}><Pill className="size-16" strokeWidth={1}/></FloatingShape>
    <FloatingShape className="right-[10%] top-[22%]" delay={1.2} duration={11}><Cross className="size-12" strokeWidth={1}/></FloatingShape>
    <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-white/[0.08] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="flex flex-col items-center text-center"><div className="flex size-16 items-center justify-center"><BrandMark className="size-16"/></div><h1 className="mt-4 text-2xl font-bold text-white">{mode==='signin'?'Sign In':'Create Your Account'}</h1><p className="mt-2 text-sm text-white/70">{mode==='signin'?'Welcome back. Choose how you want to sign in.':'Create your Wellcare Medicos customer account.'}</p></div>
      <div className="mt-6 grid grid-cols-2 rounded-xl bg-black/20 p-1"><button type="button" onClick={()=>{setMode('signin');setError(null)}} className={`rounded-lg py-2.5 text-sm font-semibold ${mode==='signin'?'bg-white text-slate-900':'text-white/70'}`}>Sign In</button><button type="button" onClick={()=>{setMode('signup');setError(null)}} className={`rounded-lg py-2.5 text-sm font-semibold ${mode==='signup'?'bg-white text-slate-900':'text-white/70'}`}>Create Account</button></div>
      <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={()=>setMethod('email')} className={`rounded-xl border py-2.5 text-sm ${method==='email'?'border-white bg-white text-slate-900':'border-white/20 text-white'}`}><Mail className="mr-2 inline size-4"/>Email</button><button type="button" onClick={()=>setMethod('phone')} className={`rounded-xl border py-2.5 text-sm ${method==='phone'?'border-white bg-white text-slate-900':'border-white/20 text-white'}`}><Phone className="mr-2 inline size-4"/>Phone</button></div>
      <div className="mt-4"><GoogleAuthButton premium/></div>
      <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-wider text-white/45"><span className="h-px flex-1 bg-white/20"/>or continue with {method}<span className="h-px flex-1 bg-white/20"/></div>
      {method==='email' && <form onSubmit={submitEmail} className="space-y-3">
        {mode==='signup'&&<Input required value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" className="h-12 rounded-xl bg-white text-slate-900"/>}
        <Input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" className="h-12 rounded-xl bg-white text-slate-900"/>
        <Input required type="password" autoComplete={mode==='signin'?'current-password':'new-password'} minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (minimum 6 characters)" className="h-12 rounded-xl bg-white text-slate-900"/>
        <Button disabled={loading} className="h-12 w-full rounded-xl bg-emerald-500 font-semibold text-white">{loading?<Loader2 className="mr-2 size-4 animate-spin"/>:<Mail className="mr-2 size-4"/>}{mode==='signin'?'Sign In with Email':'Create Account with Email'}</Button>
        {mode==='signin'&&<button type="button" onClick={async()=>{if(!email)return setError('Enter your email first.');try{await sendPasswordResetFirebase(email);setError('Password reset email sent. Check your inbox.')}catch(err){setError(err instanceof Error?err.message:'Could not send reset email.')}}} className="w-full text-xs text-white/70 underline">Forgot password? (set/reset email password)</button>}
      </form>}
      {method==='phone' && step==='identifier' && <form onSubmit={requestCode} className="space-y-3">
        <CountryPicker country={country} setCountry={setCountry} phone={phone} setPhone={setPhone} detectedCode={detectedCountryCode}/>
        <p className="flex items-center gap-1 text-xs text-white/55"><MapPin className="size-3"/>Country code can be detected from your location after you allow location access.</p>
        <Button id={recaptchaId} disabled={loading} className="h-12 w-full rounded-xl bg-emerald-500 font-semibold text-white">{loading?<Loader2 className="mr-2 size-4 animate-spin"/>:<Phone className="mr-2 size-4"/>}{loading?'Sending code…':'Send mobile code'}</Button>
      </form>}
      {method==='phone' && step==='code' && <form onSubmit={verifyCode} className="space-y-3"><p className="text-sm text-white/80">Enter the 6-digit code sent to <strong>{phone}</strong>.</p><Input aria-label="Verification code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6-digit code" disabled={loading} className="h-12 rounded-xl bg-white text-center text-lg tracking-[0.4em] text-slate-900"/><Button disabled={loading} className="h-12 w-full rounded-xl bg-emerald-500 font-semibold text-white">{loading?'Verifying…':'Verify and continue'}</Button><button type="button" onClick={()=>{setStep('identifier');setCode('');setConfirmation(null)}} className="w-full text-sm text-white/75 underline">Change number</button></form>}
      
      {error&&<p role="alert" className="mt-3 rounded-lg bg-red-500/15 p-3 text-sm text-red-100">{error}</p>}
      <p className="mt-6 text-center text-xs text-white/55">By continuing, you agree to our <a href="/privacy" className="text-teal-200 underline">Privacy Policy</a>.</p>
    </div>
  </div>
}

export function AuthGate({children}:{children:React.ReactNode}){
  const pathname=useRouterState({select:s=>s.location.pathname}); const {user,isLoading}=useFirebaseAuthState(); const recordLogin=useMutation(api.activity.recordLogin); const loggedRef=useRef(false)
  useEffect(()=>{if(user&&!loggedRef.current){loggedRef.current=true;recordLogin({}).catch(()=>{loggedRef.current=false})}if(!user)loggedRef.current=false},[user,recordLogin])
  if(pathname!=='/checkout')return <>{children}</>
  if(isLoading)return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="size-7 animate-spin text-primary"/></div>
  if(!user)return <LoginScreen/>
  return <>{children}</>
}