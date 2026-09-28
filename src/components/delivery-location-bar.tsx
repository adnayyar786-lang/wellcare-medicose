import { useEffect, useRef, useState } from 'react'
import { Zap, MapPin, LoaderCircle } from 'lucide-react'

import { useGeolocation } from '@/hooks/use-geolocation'
import { STORE_LOCATION } from '@/config/store-location'
import { distanceKm, etaLabelForDistance } from '@/lib/distance'
import { Input } from '@/components/ui/input'

export function DeliveryLocationBar() {
  const { coords, status, request } = useGeolocation()
  const asked = useRef(false)
  const [manualLocation, setManualLocation] = useState('')
  const [manualDistance, setManualDistance] = useState<number | null>(null)
  const [searching, setSearching] = useState(false)
  const [manualError, setManualError] = useState('')

  useEffect(() => {
    if (!asked.current && status === 'idle') {
      asked.current = true
      request()
    }
  }, [status, request])

  async function checkManualLocation() {
    const query = manualLocation.trim()
    if (!query) return
    setSearching(true)
    setManualError('')
    setManualDistance(null)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(query + ', Roorkee, Uttarakhand')}`)
      if (!response.ok) throw new Error('Search unavailable')
      const matches = await response.json()
      if (!Array.isArray(matches) || !matches[0]) {
        setManualError('Location not found. Try a nearby area or 6-digit pincode.')
        return
      }
      const lat = Number(matches[0].lat)
      const lng = Number(matches[0].lon)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Invalid location')
      setManualDistance(distanceKm(lat, lng, STORE_LOCATION.lat, STORE_LOCATION.lng))
    } catch {
      setManualError('Could not look up that location. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const km = coords ? distanceKm(coords.lat, coords.lng, STORE_LOCATION.lat, STORE_LOCATION.lng) : manualDistance

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground" data-testid="delivery-location">
      <MapPin className="size-3.5 shrink-0 text-primary" />
      {coords ? (
        <>
          <span className="font-medium text-foreground">{etaLabelForDistance(km ?? 0)}</span>
          <span>· Approx. {km?.toFixed(1)} km from store</span>
        </>
      ) : manualDistance !== null ? (
        <>
          <span className="font-medium text-foreground">{etaLabelForDistance(manualDistance)}</span>
          <span>· Approx. {manualDistance.toFixed(1)} km from store</span>
          <button type="button" onClick={() => { setManualDistance(null); setManualLocation('') }} className="text-primary underline">Change</button>
        </>
      ) : status === 'requesting' ? (
        <span className="inline-flex items-center gap-1.5"><LoaderCircle className="size-3.5 animate-spin" /> Requesting location permission…</span>
      ) : (
        <>
          <span className="font-medium text-foreground">Set your delivery area</span>
          <Input
            aria-label="Enter area or pincode"
            value={manualLocation}
            onChange={(event) => setManualLocation(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && void checkManualLocation()}
            placeholder="Area or pincode"
            className="h-7 w-36 px-2 py-0 text-xs"
          />
          <button type="button" disabled={searching || !manualLocation.trim()} onClick={() => void checkManualLocation()} className="font-medium text-primary underline disabled:opacity-50">
            {searching ? 'Checking…' : 'Check ETA'}
          </button>
          {status === 'denied' && <button type="button" onClick={request} className="text-primary underline">Try location again</button>}
          {manualError && <span role="status" className="w-full text-destructive">{manualError}</span>}
          <span className="w-full text-[11px]">Allow location for a more precise estimate, or enter your area/pincode.</span>
        </>
      )}
    </div>
  )
}
