import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Home, LayoutGrid, ClipboardList, ShoppingCart, User } from 'lucide-react'

import { useCart } from '@/hooks/use-cart'
import { useLanguage } from '@/hooks/use-language'
import { Badge } from '@/components/ui/badge'

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const navigate = useNavigate()
  const { count } = useCart()
  const { t } = useLanguage()

  const isActive = (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path))

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 lg:hidden border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-5">
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 py-2.5 text-xs ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Home className="size-5" />
          {t('home')}
        </Link>
        <Link
          to="/categories"
          className={`flex flex-col items-center gap-0.5 py-2.5 text-xs ${isActive('/categories') ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <LayoutGrid className="size-5" />
          {t('categories')}
        </Link>
        <button
          onClick={() => navigate({ to: '/cart' })}
          className="relative flex flex-col items-center gap-0.5 py-2.5 text-xs text-muted-foreground"
        >
          <ShoppingCart className="size-5" />
          {t('cart')}
          {count > 0 && (
            <Badge className="absolute right-1/2 top-1 translate-x-3 bg-highlight px-1 py-0 text-[9px] text-highlight-foreground">
              {count}
            </Badge>
          )}
        </button>
        <Link
          to="/orders"
          className={`flex flex-col items-center gap-0.5 py-2.5 text-xs ${isActive('/orders') ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <ClipboardList className="size-5" />
          {t('orders')}
        </Link>
        <Link
          to="/profile"
          className={`flex flex-col items-center gap-0.5 py-2.5 text-xs ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <User className="size-5" />
          {t('profile')}
        </Link>
      </div>
    </nav>
  )
}
