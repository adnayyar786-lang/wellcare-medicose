import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { useState } from 'react'
import { Loader2, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '../../convex/_generated/api'
import { signInWithGoogleFirebase, signOutFirebase } from '@/lib/firebase-auth'

export const Route = createFileRoute('/staff-login')({ head:()=>({meta:[{title:'Staff sign in — Wellcare Medicose'}]}), component:StaffLoginPage })

function StaffLoginPage(){
 const navigate=useNavigate()
 const [email,setEmail]=useState(''); const [name,setName]=useState(''); const [code,setCode]=useState(''); const [step,setStep]=useState<'email'|'code'|'pending'>('email'); const [loading,setLoading]=useState(false); const [error,setError]=useState('')
 const normalized=email.trim().toLowerCase()
 const access=useQuery(api.staff.accessStatus, normalized ? {email:normalized} : 'skip')
 const requestAccess=useMutation(api.staff.requestAccess)
 async function requestCode(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setLoading(true);setError('')
  try{
    if(access?.status!=='approved'){
      if(!name.trim()){setError('Enter your name first.');return}
      await requestAccess({email:normalized,name:name.trim()})
      setStep('pending');return
    }
    const user=await signInWithGoogleFirebase()
    const signedEmail=(user.email??'').trim().toLowerCase()
    if(!signedEmail || signedEmail!==normalized){
      await signOutFirebase()
      throw new Error('Please sign in with the exact approved staff Gmail.')
    }
    await navigate({to:'/staff'})
  }catch(err){setError(err instanceof Error?err.message:'Could not sign in to the staff portal.')}
  finally{setLoading(false)}
 }
 async function verify(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setStep('email');setCode('');setError('Use Google sign-in with the approved staff Gmail.')}
 return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-7 text-white shadow-2xl sm:p-9"><div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300"><ShieldCheck className="size-7"/></div><h1 className="text-center text-2xl font-bold">Staff sign in</h1><p className="mt-2 text-center text-sm text-slate-300">Wellcare Medicose · Admin-approved staff only</p>{step==='email'&&<form onSubmit={requestCode} className="mt-7 space-y-4"><label className="block text-sm">Staff Gmail</label><Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your registered Gmail" className="h-12 bg-white text-slate-900"/><label className="block text-sm">Your name</label><Input required value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your name" className="h-12 bg-white text-slate-900"/><Button className="h-12 w-full bg-emerald-500 hover:bg-emerald-600" disabled={loading||access===undefined}>{loading?<Loader2 className="mr-2 size-4 animate-spin"/>:<Mail className="mr-2 size-4"/>}{access?.status==='approved'?'Send sign-in code':'Send access request'}</Button><p className="text-center text-xs text-slate-400">New staff accounts must be approved by the admin before login is enabled.</p></form>}{step==='pending'&&<div className="mt-7 space-y-4 text-center"><div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4"><p className="font-semibold">Verification request sent</p><p className="mt-1 text-sm text-slate-300">Your Gmail is waiting for admin approval. Login will be enabled only after the admin verifies it.</p></div><Button variant="outline" className="w-full" onClick={()=>setStep('email')}>Back</Button></div>}{step==='code'&&<form onSubmit={verify} className="mt-7 space-y-4"><p className="text-sm text-slate-300">Enter the code sent to <b className="text-white">{email}</b>.</p><Input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6-digit code" className="h-12 bg-white text-center text-lg tracking-[0.4em] text-slate-900"/><Button className="h-12 w-full bg-emerald-500 hover:bg-emerald-600" disabled={loading}>{loading?'Verifying…':'Verify and enter'}</Button><button type="button" onClick={()=>{setStep('email');setCode('')}} className="w-full text-sm underline">Use a different email</button></form>}{error&&<p role="alert" className="mt-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">{error}</p>}</section></main>
}
