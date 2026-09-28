import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Lang = 'en' | 'hi'

const DICTIONARY: Record<string, { en: string; hi: string }> = {
  search_placeholder: { en: 'Search medicines, health products…', hi: 'दवाई या प्रोडक्ट खोजें…' },
  shop_by_category: { en: 'Shop by Category', hi: 'श्रेणी अनुसार खरीदें' },
  all_products: { en: 'All Products', hi: 'सभी प्रोडक्ट्स' },
  add_to_cart: { en: 'Add to Cart', hi: 'कार्ट में डालें' },
  buy_now: { en: 'Buy Now', hi: 'अभी खरीदें' },
  out_of_stock: { en: 'Out of stock', hi: 'स्टॉक में नहीं' },
  your_cart: { en: 'Your Cart', hi: 'आपका कार्ट' },
  continue_to_checkout: { en: 'Continue to Checkout', hi: 'चेकआउट पर जाएँ' },
  reorder: { en: 'Reorder', hi: 'दोबारा ऑर्डर करें' },
  recently_viewed: { en: 'Recently Viewed', hi: 'हाल ही में देखे गए' },
  deliver_to: { en: 'Deliver to', hi: 'डिलीवरी पता' },
  home: { en: 'Home', hi: 'होम' },
  categories: { en: 'Categories', hi: 'श्रेणियाँ' },
  cart: { en: 'Cart', hi: 'कार्ट' },
  orders: { en: 'Orders', hi: 'ऑर्डर' },
  profile: { en: 'Profile', hi: 'प्रोफ़ाइल' },
}

type Dictionary = typeof DICTIONARY

const LanguageContext = createContext<{
  lang: Lang
  toggle: () => void
  t: (key: keyof Dictionary) => string
}>({
  lang: 'en',
  toggle: () => {},
  t: (key) => DICTIONARY[key]?.en ?? String(key),
})

const STORAGE_KEY = 'wellcare-lang'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved === 'hi' || saved === 'en') setLang(saved)
    } catch {
      // ignore
    }
  }, [])

  function toggle() {
    setLang((prev) => {
      const next = prev === 'en' ? 'hi' : 'en'
      try {
        window.localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // ignore
      }
      return next
    })
  }

  function t(key: keyof Dictionary) {
    return DICTIONARY[key]?.[lang] ?? String(key)
  }

  return <LanguageContext.Provider value={{ lang, toggle, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}
