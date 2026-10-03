import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signInWithGoogleFirebase } from '@/lib/firebase-auth'

export function GoogleAuthButton({ premium = false }: { premium?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const start = async () => {
    setError(null); setLoading(true)
    try {
      await signInWithGoogleFirebase()
      // Firebase LOCAL persistence is already set before the popup. Reload the
      // current Cloudflare page so the auth provider reads the persisted user
      // immediately instead of leaving the checkout/login screen mounted.
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed. Please try again.')
      setLoading(false)
    }
  }
  return <div className="w-full">
    <motion.div whileHover={premium ? { scale: 1.02 } : undefined} whileTap={premium ? { scale: 0.98 } : undefined} className="rounded-md">
      <Button type="button" variant={premium ? 'default' : 'outline'} size="lg"
        className={premium ? 'w-full gap-2 border-0 bg-white py-6 text-base font-semibold text-slate-800 hover:bg-white/90' : 'w-full gap-2 border-2'}
        onClick={() => void start()} disabled={loading}>
        {loading ? <Loader2 className="size-5 animate-spin" /> : <span className="flex size-5 items-center justify-center rounded-full font-bold text-[#4285F4]">G</span>}
        {loading ? 'Signing in…' : 'Continue with Google'}
      </Button>
    </motion.div>
    {error && <p role="alert" className={`mt-2 text-center text-xs ${premium ? 'text-red-300' : 'text-destructive'}`}>{error}</p>}
  </div>
}