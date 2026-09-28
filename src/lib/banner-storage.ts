export type PromoBanner = { title: string; sub: string; code: string | null }

const STORAGE_KEY = 'wellcare-promo-banners'

export function readPromoBanners<T extends PromoBanner>(defaults: T[]): T[] {
  if (typeof window === 'undefined') return defaults
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const value: unknown = JSON.parse(raw)
    if (!Array.isArray(value) || value.length !== defaults.length) return defaults
    if (!value.every((item) => item && typeof item.title === 'string' && typeof item.sub === 'string')) return defaults
    return value as T[]
  } catch {
    return defaults
  }
}

export function writePromoBanners(banners: PromoBanner[]): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(banners))
    return true
  } catch {
    return false
  }
}
