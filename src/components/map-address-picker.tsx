import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { toast } from 'sonner'

import { useGeolocation } from '@/hooks/use-geolocation'
import { STORE_LOCATION } from '@/config/store-location'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

type SavedAddress = { label: string; address: string; lat: number; lng: number }
export type SelectedDeliveryLocation = { address: string; lat: number; lng: number }
const SAVED_KEY = 'wellcare-saved-addresses'

function readSaved(): SavedAddress[] {
  try {
    const raw = window.localStorage.getItem(SAVED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}
function writeSaved(list: SavedAddress[]) {
  try { window.localStorage.setItem(SAVED_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
    if (!res.ok) throw new Error('lookup failed')
    const data = await res.json()
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch { return `${lat.toFixed(5)}, ${lng.toFixed(5)}` }
}
function DraggableMarker({ position, onMove }: { position: [number, number]; onMove: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onMove(e.latlng.lat, e.latlng.lng) } })
  return <Marker position={position} icon={markerIcon} draggable eventHandlers={{ dragend: (e) => {
    const pos = (e.target as L.Marker).getLatLng()
    onMove(pos.lat, pos.lng)
  } }} />
}

export function MapAddressPicker({ open, onOpenChange, onConfirm }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (location: SelectedDeliveryLocation) => void
}) {
  const { coords, request } = useGeolocation()
  const [position, setPosition] = useState<[number, number]>([STORE_LOCATION.lat, STORE_LOCATION.lng])
  const [address, setAddress] = useState('')
  const [landmark, setLandmark] = useState('')
  const [loadingAddress, setLoadingAddress] = useState(false)
  const [saved, setSaved] = useState<SavedAddress[]>(() => readSaved())
  const requestedOnOpen = useRef(false)
  useEffect(() => {
    if (open && !requestedOnOpen.current) { requestedOnOpen.current = true; request() }
    if (!open) requestedOnOpen.current = false
  }, [open, request])
  useEffect(() => { if (open && coords) setPosition([coords.lat, coords.lng]) }, [open, coords])
  useEffect(() => {
    if (!open) return
    setLoadingAddress(true)
    reverseGeocode(position[0], position[1]).then(setAddress).finally(() => setLoadingAddress(false))
  }, [open, position[0], position[1]])
  function fullAddress() { return landmark.trim() ? `${address} (Near ${landmark.trim()})` : address }
  function handleConfirm() {
    onConfirm({ address: fullAddress(), lat: position[0], lng: position[1] })
    onOpenChange(false)
  }
  function handleSave(label: string) {
    const entry: SavedAddress = { label, address: fullAddress(), lat: position[0], lng: position[1] }
    const next = [...saved.filter((s) => s.label !== label), entry]
    writeSaved(next); setSaved(next); toast.success(`Saved as ${label}`)
  }
  function useSaved(s: SavedAddress) { setPosition([s.lat, s.lng]); setAddress(s.address) }
  const center = useMemo(() => position, [position])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden rounded-3xl p-0">
        <DialogHeader className="border-b bg-gradient-to-r from-primary/10 via-background to-emerald-50 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg"><span className="rounded-xl bg-primary/10 p-2 text-primary"><MapPinIcon /></span> Pin your delivery location</DialogTitle>
          <p className="text-sm text-muted-foreground">Set the exact doorstep location for a more relevant delivery estimate.</p>
        </DialogHeader>
        <div className="space-y-4 p-5">
          {saved.length > 0 && <div className="flex flex-wrap gap-2">{saved.map((s) => <button key={s.label} onClick={() => useSaved(s)} className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium hover:border-primary">{s.label}</button>)}</div>}
          <div className="h-64 overflow-hidden rounded-2xl border shadow-inner">
            <MapContainer center={center} zoom={15} className="h-full w-full"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" /><DraggableMarker position={position} onMove={(lat, lng) => setPosition([lat, lng])} /></MapContainer>
          </div>
          <p className="text-xs text-muted-foreground">Move the pin or tap the map to fine-tune your location.</p>
          <div className="space-y-1.5"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delivery address</label><Input className="h-11 rounded-xl" value={loadingAddress ? 'Locating address…' : address} onChange={(e) => setAddress(e.target.value)} disabled={loadingAddress} /></div>
          <div className="space-y-1.5"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Landmark (optional)</label><Input className="h-11 rounded-xl" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Apartment, street or nearby landmark" /></div>
          <div className="flex flex-wrap items-center gap-2 text-xs"><span className="text-muted-foreground">Save location:</span>{['Home', 'Work', 'Other'].map((label) => <button key={label} onClick={() => handleSave(label)} className="rounded-full bg-secondary px-3 py-1.5 font-medium text-foreground hover:bg-primary/10">{label}</button>)}</div>
        </div>
        <DialogFooter className="border-t bg-muted/30 px-5 py-4"><Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>Cancel</Button><Button className="rounded-xl" onClick={handleConfirm} disabled={loadingAddress || !address}>Confirm location</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
function MapPinIcon() { return <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg> }
