import { useRouterState } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={pathname}
        initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.995, filter: 'blur(3px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -5, scale: 0.998 }}
        transition={{
          duration: reduceMotion ? 0 : 0.42,
          ease: [0.22, 1, 0.36, 1],
          filter: { duration: 0.32 },
        }}
        className="min-h-[60vh]"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  )
}
