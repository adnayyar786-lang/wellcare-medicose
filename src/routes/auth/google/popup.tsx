import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { useMountEffect } from '@/hooks/use-mount-effect'
import { storeGoogleAuthPopupProof } from '@/lib/google-auth-handoff'

export const Route = createFileRoute('/auth/google/popup')({
  component: GoogleAuthPopupPage,
})

const POPUP_READY_MESSAGE = 'macaly-google-popup-ready'
const POPUP_START_MESSAGE = 'macaly-google-popup-start'

function GoogleAuthPopupPage() {
  const [error, setError] = useState<string | null>(null)

  useMountEffect(() => {
    const opener = window.opener
    if (!opener) {
      setError('Return to the app and start Google sign-in again.')
      return
    }
    const announceReady = () =>
      opener.postMessage({ type: POPUP_READY_MESSAGE }, window.location.origin)
    const interval = window.setInterval(announceReady, 250)
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as Record<string, unknown>
      if (
        event.origin !== window.location.origin ||
        event.source !== opener ||
        data.type !== POPUP_START_MESSAGE ||
        typeof data.flowId !== 'string' ||
        typeof data.authorizationUrl !== 'string' ||
        typeof data.popupVerifier !== 'string'
      ) {
        return
      }
      const authorizationUrl = new URL(data.authorizationUrl as string)
      if (authorizationUrl.protocol !== 'https:') return
      window.clearInterval(interval)
      window.removeEventListener('message', handleMessage)
      storeGoogleAuthPopupProof(data.flowId as string, data.popupVerifier as string)
      window.opener = null
      window.location.replace(authorizationUrl.toString())
    }
    window.addEventListener('message', handleMessage)
    announceReady()
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('message', handleMessage)
    }
  })

  return error ? <p role="alert">{error}</p> : <p>Opening Google…</p>
}
