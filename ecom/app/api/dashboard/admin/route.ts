import { NextRequest, NextResponse } from 'next/server'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { getCollection } from '@/lib/mongodb'

export const GET = async (_req: NextRequest) => {
  // TODO: Replace with actual user context

  // TODO: Add user context and authorization logic here
  // if (!user || user.role !== 'ADMIN') {
  //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // }

  const organizations = await getCollection('organizations')
  const pickupTasks = await getCollection('pickup_tasks')
  const surplusOffers = await getCollection('surplus_offers')

  const orgCursor = organizations.find()
  const totals = { weightKg: 0, meals: 0, co2SavedKg: 0, deliveries: 0 }
  for await (const org of orgCursor) {
    const impact = org.impactTotals || {}
    totals.weightKg += impact.weightKg || 0
    totals.meals += impact.meals || 0
    totals.co2SavedKg += impact.co2SavedKg || 0
    totals.deliveries += impact.deliveries || 0
  }

  const [activePickups, openSurplus] = await Promise.all([
    pickupTasks.countDocuments({ status: { $in: ['ASSIGNED', 'ACCEPTED', 'ON_ROUTE', 'PICKED_UP'] } }),
    surplusOffers.countDocuments({ status: 'OPEN' }),
  ])

  return NextResponse.json({
    totalWeightKg: Number(totals.weightKg.toFixed(2)),
    totalMealsRescued: Math.round(totals.meals),
    totalPickups: totals.deliveries,
    co2SavedKg: Number(totals.co2SavedKg.toFixed(2)),
    activePickups,
    openSurplus,
  })
}
