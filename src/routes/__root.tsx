import { useEffect } from 'react'
import { HeadContent, Scripts, createRootRoute, useRouterState } from '@tanstack/react-router'
import { MessageCircle } from 'lucide-react'
import { MotionConfig } from 'framer-motion'
import AppConvexProvider from '@/components/convex-client-provider'
import { Toaster } from '@/components/ui/sonner'
import { BottomNav } from '@/components/bottom-nav'
import { CartDrawer } from '@/components/cart-drawer'
import { LanguageProvider } from '@/hooks/use-language'
import { AuthGate } from '@/components/auth-gate'
import { PageTransition } from '@/components/page-transition'
import { CartConfirmationToast } from '@/components/cart-confirmation-toast'

// CSS imported as a side effect — do NOT add `?url` or `?inline`.
//
// Why: TanStack Start runs two Vite build environments (client + ssr) with
// independent module graphs. A `?url` import resolves the CSS URL twice and
// the two passes can produce different hashes; the SSR pass bakes its hash
// into the prerendered HTML, but only the client's asset actually exists in
// `dist/client/assets/`, so the stylesheet 404s and the page loads unstyled.
//
// A bare side-effect import sidesteps the issue: only the client environment
// emits the CSS asset, and TanStack Start's manifest collection injects the
// correct hashed `<link rel="stylesheet">` into the rendered head from the
// client manifest. The CSS stays a shared, cacheable asset (important if
// prerender is expanded to multiple static pages — `?inline` would duplicate
// the CSS into every HTML file).
import '../styles.css'
import siteMetadata from '../metadata.json'

const rootMeta = siteMetadata['/']
const STORE_WHATSAPP = '917088252556'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: rootMeta.title },
      { name: 'description', content: rootMeta.description },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  }),
  shellComponent: RootDocument,
})

function useIsAdminRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

// The customer site and the admin portal have separate colour themes. This adds
// class "admin" to <html> on /admin so the admin keeps its own palette.
function ThemeScope() {
  const isAdmin = useIsAdminRoute()
  useEffect(() => {
    document.documentElement.classList.toggle('admin', isAdmin)
  }, [isAdmin])
  return null
}

// Customer-only chrome (bottom nav, WhatsApp bubble, cart drawer/toast) has no
// place on the admin dashboard, which has its own sidebar/header layout.
function CustomerChrome({ children }: { children: React.ReactNode }) {
  const isAdmin = useIsAdminRoute()
  if (isAdmin) return null
  return <>{children}</>
}

// Reserves space for the fixed customer bottom nav — not needed on /admin,
// which has its own sidebar layout instead.
function ContentWrapper({ children }: { children: React.ReactNode }) {
  const isAdmin = useIsAdminRoute()
  return <div className={isAdmin ? '' : 'pb-16 lg:pb-0'}>{children}</div>
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
          <script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js" />
          <script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js" />
      </head>
        <body>
          <AppConvexProvider>
            <ThemeScope />
            <LanguageProvider>
              <MotionConfig reducedMotion="user">
                <AuthGate>
                  <ContentWrapper>
                    <PageTransition>{children}</PageTransition>
                  </ContentWrapper>
                  <CustomerChrome>
                    <a
                      href={`https://wa.me/${STORE_WHATSAPP}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Chat with us on WhatsApp"
                      className="fixed bottom-20 right-4 z-20 lg:bottom-6" flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
                    >
                      <MessageCircle className="size-6" />
                    </a>
                    <BottomNav />
                    <CartDrawer />
                    <CartConfirmationToast />
                  </CustomerChrome>
                </AuthGate>
              </MotionConfig>
              <Toaster position="top-center" />
            </LanguageProvider>
          </AppConvexProvider>
          <Scripts />
        </body>
    </html>
  )
}
