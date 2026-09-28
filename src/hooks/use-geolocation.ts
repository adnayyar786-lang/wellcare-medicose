import { useCallback, useEffect, useState } from 'react'

type Coords = { lat: number; lng: number }
type Status = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'

const STORAGE_KEY = 'wellcare-user-location'

function readCached(): Coords | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(() => readCached())
  const [status, setStatus] = useState<Status>(coords ? 'granted' : 'idle')

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable')
      return
    }
    setStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(next)
        setStatus('granted')
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
          // ignore
        }
      },
      () => setStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  useEffect(() => {
    if (!coords && status === 'idle') {
      // Try silently on mount; if permission was already granted before,
      // most browsers resolve this without another prompt.
    }
  }, [coords, status])

  return { coords, status, request }
}
