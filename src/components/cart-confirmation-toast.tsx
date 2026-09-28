import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

export const CART_TOAST_EVENT = 'wellcare-cart-toast'

export function fireCartToast(message: string) {
  window.dispatchEvent(new CustomEvent(CART_TOAST_EVENT, { detail: message }))
}

export function CartConfirmationToast() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let timeout: number | undefined
    function onEvent(e: Event) {
      const detail = (e as CustomEvent<string>).detail
      setMessage(detail)
      window.clearTimeout(timeout)
      timeout = window.setTimeout(() => setMessage(null), 1800)
    }
    window.addEventListener(CART_TOAST_EVENT, onEvent)
    return () => {
      window.removeEventListener(CART_TOAST_EVENT, onEvent)
      window.clearTimeout(timeout)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-4">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg"
          >
            <motion.span
              initial={{ scale: 0.4 }}
              animate={{ scale: [0.4, 1.25, 1] }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <CheckCircle2 className="size-4" />
            </motion.span>
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
