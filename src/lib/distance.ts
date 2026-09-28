// Haversine great-circle distance in kilometres. This is straight-line
// distance, not driving distance (no paid routing API is configured) — but
// it's exactly what's needed for simple distance-tier delivery estimates.
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function etaLabelForDistance(km: number): string {
  if (km <= 6) return 'Delivery in 10 mins'
  if (km <= 8) return 'Delivery in 20 mins'
  if (km <= 10) return 'Delivery in 30 mins'
  return 'Delivered as soon as possible'
}
