const STORAGE_KEY = 'wellcare-recently-viewed-v1'
const MAX_ITEMS = 12

export function trackRecentlyViewed(id: string) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const list: string[] = raw ? JSON.parse(raw) : []
    const next = [id, ...list.filter((x) => x !== id)].slice(0, MAX_ITEMS)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

export function getRecentlyViewed(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const PHONE_KEY = 'wellcare-last-phone-v1'

export function saveLastPhone(phone: string) {
  try {
    window.localStorage.setItem(PHONE_KEY, phone)
  } catch {
    // ignore
  }
}

export function getLastPhone(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(PHONE_KEY) ?? ''
  } catch {
    return ''
  }
}
