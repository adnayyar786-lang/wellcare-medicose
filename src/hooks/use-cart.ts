import { useCallback, useEffect, useState } from 'react'

export type CartLine = {
  medicineId: string
  name: string
  price: number
  mrpPrice?: number
  quantity: number
}

const STORAGE_KEY = 'wellcare-cart-v1'
const EVENT_NAME = 'wellcare-cart-updated'

function readCart(): Record<string, CartLine> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeCart(cart: Record<string, CartLine>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent(EVENT_NAME))
  } catch {
    // ignore storage errors (private browsing, quota, etc.)
  }
}

export function useCart() {
  const [cart, setCartState] = useState<Record<string, CartLine>>(() => readCart())

  useEffect(() => {
    function sync() {
      setCartState(readCart())
    }
    window.addEventListener(EVENT_NAME, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT_NAME, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const addToCart = useCallback(
    (
      med: { _id: string; name: string; price: number; mrpPrice?: number; stock: number },
      onError?: (msg: string) => void,
    ) => {
      const current = readCart()
      const existing = current[med._id]
      const nextQty = (existing?.quantity ?? 0) + 1
      if (med.stock <= 0) {
        onError?.('Out of stock')
        return
      }
      if (nextQty > med.stock) {
        onError?.('Not enough stock available')
        return
      }
      const next = {
        ...current,
        [med._id]: {
          medicineId: med._id,
          name: med.name,
          price: med.price,
          mrpPrice: med.mrpPrice,
          quantity: nextQty,
        },
      }
      writeCart(next)
      setCartState(next)
    },
    [],
  )

  const changeQty = useCallback((id: string, delta: number) => {
    const current = readCart()
    const line = current[id]
    if (!line) return
    const nextQty = line.quantity + delta
    const next = { ...current }
    if (nextQty <= 0) {
      delete next[id]
    } else {
      next[id] = { ...line, quantity: nextQty }
    }
    writeCart(next)
    setCartState(next)
  }, [])

  const clearCart = useCallback(() => {
    writeCart({})
    setCartState({})
  }, [])

  const lines = Object.values(cart)
  const count = lines.reduce((sum, l) => sum + l.quantity, 0)
  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
  const mrpTotal = lines.reduce((sum, l) => sum + (l.mrpPrice ?? l.price) * l.quantity, 0)

  return { cart, lines, count, total, mrpTotal, addToCart, changeQty, clearCart }
}
