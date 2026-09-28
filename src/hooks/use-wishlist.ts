import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'wellcare-wishlist-v1'
const EVENT_NAME = 'wellcare-wishlist-updated'

function readWishlist(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeWishlist(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    window.dispatchEvent(new CustomEvent(EVENT_NAME))
  } catch {
    // ignore
  }
}

export function useWishlist() {
  const [ids, setIds] = useState<string[]>(() => readWishlist())

  useEffect(() => {
    function sync() {
      setIds(readWishlist())
    }
    window.addEventListener(EVENT_NAME, sync)
    return () => window.removeEventListener(EVENT_NAME, sync)
  }, [])

  const isSaved = useCallback((id: string) => ids.includes(id), [ids])

  const toggle = useCallback((id: string) => {
    const current = readWishlist()
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    writeWishlist(next)
    setIds(next)
  }, [])

  return { ids, isSaved, toggle }
}
