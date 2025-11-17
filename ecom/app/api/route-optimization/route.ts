import { NextRequest, NextResponse } from 'next/server'

// Simple route optimization algorithm using nearest neighbor approach
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function optimizeRoute(deliveries: any[]) {
  if (deliveries.length === 0) return []

  const optimized = [deliveries[0]]
  const remaining = deliveries.slice(1)
  let totalDistance = 0

  while (remaining.length > 0) {
    const lastDelivery = optimized[optimized.length - 1]
    let nearestIdx = 0
    let minDistance = Infinity

    // Find nearest next delivery
    remaining.forEach((delivery, idx) => {
      const distance = calculateDistance(
        lastDelivery.location.latitude,
        lastDelivery.location.longitude,
        delivery.location.latitude,
        delivery.location.longitude
      )
      if (distance < minDistance) {
        minDistance = distance
        nearestIdx = idx
      }
    })

    const nearest = remaining.splice(nearestIdx, 1)[0]
    optimized.push(nearest)
    totalDistance += minDistance
  }

  return { route: optimized, totalDistance, estimatedTime: Math.ceil(totalDistance / 40) * 60 } // 40 km/h average
}

export async function POST(request: NextRequest) {
  try {
    const { deliveries } = await request.json()
    const optimized = optimizeRoute(deliveries)
    return NextResponse.json(optimized)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
