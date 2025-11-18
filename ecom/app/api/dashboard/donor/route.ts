import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/server-auth'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

async function computeDonorMetrics(userId: ObjectId) {
  const organizations = await getCollection('organizations')
  const pickupTasks = await getCollection('pickup_tasks')

  const orgDocs = await organizations.find({ createdByUserId: userId }).toArray()
  const orgIds = orgDocs.map((org) => org._id)

  const impactTotals = orgDocs.reduce(
    (acc, org: any) => {
      const totals = org.impactTotals || {}
      acc.weightKg += totals.weightKg || 0
      acc.meals += totals.meals || 0
      acc.co2SavedKg += totals.co2SavedKg || 0
      acc.deliveries += totals.deliveries || 0
      return acc
    },
    { weightKg: 0, meals: 0, co2SavedKg: 0, deliveries: 0 }
  )

  const pickupCount = await pickupTasks.countDocuments({
    donorOrgId: { $in: orgIds },
    status: { $in: ['DELIVERED'] },
  })

  return {
    totalWeightKg: Number(impactTotals.weightKg.toFixed(2)),
    totalMealsRescued: Math.round(impactTotals.meals),
    totalPickups: pickupCount || impactTotals.deliveries,
    co2SavedKg: Number(impactTotals.co2SavedKg.toFixed(2)),
  }
}

export const GET = withAuth(async (_req: NextRequest, _ctx, authUser) => {
  const user = await getUserDocumentByFirebaseUid(authUser.uid)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.role !== 'DONOR' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const metrics = await computeDonorMetrics(user._id)
  return NextResponse.json(metrics)
})
