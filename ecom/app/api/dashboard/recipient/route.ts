import { NextRequest, NextResponse } from 'next/server'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

async function computeRecipientMetrics(userId: ObjectId) {
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
    recipientOrgId: { $in: orgIds },
    status: { $in: ['DELIVERED'] },
  })

  return {
    totalWeightKg: Number(impactTotals.weightKg.toFixed(2)),
    totalMealsRescued: Math.round(impactTotals.meals),
    totalPickups: pickupCount || impactTotals.deliveries,
    co2SavedKg: Number(impactTotals.co2SavedKg.toFixed(2)),
  }
}

export const GET = async (_req: NextRequest) => {
  // TODO: Replace with actual user context
  // const user = await getUserDocumentByFirebaseUid(authUser.uid)



    // Placeholder: return empty metrics
    return NextResponse.json({})
  return NextResponse.json({})
}
