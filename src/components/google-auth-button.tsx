import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signInWithGoogleFirebase } from '@/lib/firebase-auth'

export function GoogleAuthButton({ premium = false }: { premium?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = async () => {
    setError(null)
    setLoading(true)
    try {
      // FirebaseAuthProvider owns the authenticated state and persistence.
      // The sign-in page navigates only after that state is restored, so we
      // never race navigation against Firebase/Convex session setup.
      const user = await signInWithGoogleFirebase()
      window.dispatchEvent(new CustomEvent('wellcare-firebase-signed-in', { detail: user }))
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : 'Google sign-in failed. Please try again.',
      )
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <motion.div
        whileHover={premium ? { scale: 1.02 } : undefined}
        whileTap={premium ? { scale: 0.98 } : undefined}
        className="rounded-md"
      >
        <Button
          type="button"
          variant={premium ? 'default' : 'outline'}
          size="lg"
          className={
            premium
              ? 'w-full gap-2 border-0 bg-white py-6 text-base font-semibold text-slate-800 hover:bg-white/90'
              : 'w-full gap-2 border-2'
          }
          onClick={() => void start()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.32v2.77h-5.88v3.16h9.46c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09A6.62 6.62 0 0 1 5.5 12c0-.73.12-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </Button>
      </motion.div>

      {error && (
        <p
          role="alert"
          className={`mt-2 text-center text-xs ${premium ? 'text-red-300' : 'text-destructive'}`}
        >
          {error}
        </p>
      )}
    </div>
  )
}
