import { useRouterState } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={pathname}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0 }}
        transition={{
          duration: reduceMotion ? 0 : 0.18,
          ease: 'easeOut',
        }}
        className="min-h-[60vh] w-full min-w-0"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  )
}
