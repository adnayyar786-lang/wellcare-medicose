import { useAuthActions } from '@convex-dev/auth/react'
import { useAction } from 'convex/react'
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

import { api } from '@/convex/_generated/api'
import {
  createGoogleAuthChallenge,
  createGoogleAuthHandoff,
  createGoogleAuthVerifier,
  describeGoogleAuthError,
  takeGoogleAuthHandoff,
} from '@/lib/google-auth-handoff'
import { Button } from '@/components/ui/button'

const POPUP_POLL_INTERVAL_MS = 2_000
const POPUP_TIMEOUT_MS = 10 * 60 * 1000
const POPUP_READY_TIMEOUT_MS = 10_000
const POPUP_READY_MESSAGE = 'macaly-google-popup-ready'
const POPUP_START_MESSAGE = 'macaly-google-popup-start'

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function openGoogleAuthPopup(): Window | null {
  const width = 520
  const height = 720
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2)
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2)
  return window.open(
    '/auth/google/popup',
    '_blank',
    `popup=yes,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)}`,
  )
}

function waitForGoogleAuthPopup(authWindow: Window): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener('message', handleMessage)
      reject(new Error('Google sign-in popup timed out'))
    }, POPUP_READY_TIMEOUT_MS)
    function handleMessage(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== authWindow ||
        event.data?.type !== POPUP_READY_MESSAGE
      ) {
        return
      }
      window.clearTimeout(timeout)
      window.removeEventListener('message', handleMessage)
      resolve()
    }
    window.addEventListener('message', handleMessage)
  })
}

export function GoogleAuthButton({ premium = false }: { premium?: boolean }) {
  const { signIn } = useAuthActions()
  const createAuthorizationUrl = useAction(api.googleAuth.createAuthorizationUrl)
  const getAuthorizationStatus = useAction(api.googleAuth.getAuthorizationStatus)
  const attempt = useRef(0)
  const popup = useRef<Window | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const start = async () => {
    const attemptId = ++attempt.current
    setError(null)
    setLoading(true)
    let authWindow: Window | null = null
    try {
      const flowMode = window.top === window ? 'redirect' : 'popup'
      const handoffChallengePromise = createGoogleAuthHandoff('sign-in')
      const popupVerifier = flowMode === 'popup' ? createGoogleAuthVerifier() : null
      const popupChallengePromise = popupVerifier
        ? createGoogleAuthChallenge(popupVerifier)
        : Promise.resolve(null)
      let popupReady: Promise<void> | null = null
      if (flowMode === 'popup') {
        authWindow = openGoogleAuthPopup()
        if (!authWindow) throw new Error('Google sign-in popup was blocked')
        popup.current = authWindow
        popupReady = waitForGoogleAuthPopup(authWindow)
      }
      const [handoffChallenge, popupChallenge] = await Promise.all([
        handoffChallengePromise,
        popupChallengePromise,
      ])
      const authorizationPromise = createAuthorizationUrl({
        appOrigin: window.location.origin,
        handoffChallenge,
        flowMode,
        ...(popupChallenge ? { popupChallenge } : {}),
      })
      const authorization = authWindow
        ? (
            await Promise.all([
              authorizationPromise,
              popupReady ?? Promise.reject(new Error('Google popup failed')),
            ])
          )[0]
        : await authorizationPromise
      if (authWindow && popupVerifier) {
        authWindow.postMessage(
          {
            type: POPUP_START_MESSAGE,
            flowId: authorization.flowId,
            authorizationUrl: authorization.authorizationUrl,
            popupVerifier,
          },
          window.location.origin,
        )
      } else {
        window.location.href = authorization.authorizationUrl
      }
      if (!authWindow) return

      const deadline = Date.now() + POPUP_TIMEOUT_MS
      while (attempt.current === attemptId && Date.now() < deadline) {
        const status = await getAuthorizationStatus({ flowId: authorization.flowId })
        if (status.status === 'pending') {
          await wait(POPUP_POLL_INTERVAL_MS)
          continue
        }
        const handoff = takeGoogleAuthHandoff()
        if (status.status === 'error') {
          throw new Error(
            status.error === 'access_denied' ? 'Google sign-in was cancelled.' : 'Google sign-in failed.',
          )
        }
        if (!handoff) throw new Error('Google sign-in handoff expired.')
        await signIn('macaly-google', {
          grant: status.grant,
          handoffVerifier: handoff.verifier,
          linkToCurrentUser: handoff.mode === 'link',
        })
        authWindow.close()
        popup.current = null
        setLoading(false)
        return
      }
      if (attempt.current === attemptId) {
        throw new Error('Google sign-in timed out. Please try again.')
      }
    } catch (caught) {
      if (attempt.current !== attemptId) return
      authWindow?.close()
      popup.current = null
      takeGoogleAuthHandoff()
      setError(describeGoogleAuthError(caught, 'sign-in'))
      setLoading(false)
    }
  }

  const cancel = () => {
    attempt.current += 1
    popup.current?.close()
    popup.current = null
    takeGoogleAuthHandoff()
    setLoading(false)
    setError(null)
  }

  return (
    <div className="w-full">
      <motion.div
        whileHover={premium ? { scale: 1.02 } : undefined}
        whileTap={premium ? { scale: 0.98 } : undefined}
        className="rounded-md"
        style={premium ? { filter: 'drop-shadow(0 0 18px rgba(45,212,191,0.35))' } : undefined}
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
            <svg className="size-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09A6.62 6.62 0 0 1 5.5 12c0-.73.12-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </Button>
      </motion.div>
      {loading && (
        <button
          type="button"
          onClick={cancel}
          className={`mt-2 w-full text-center text-xs underline ${premium ? 'text-white/50' : 'text-muted-foreground'}`}
        >
          Cancel
        </button>
      )}
      {error && (
        <p role="alert" className={`mt-2 text-center text-xs ${premium ? 'text-red-300' : 'text-destructive'}`}>
          {error}
        </p>
      )}
    </div>
  )
}
