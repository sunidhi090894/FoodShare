import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/server-auth'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { PICKUP_STATUSES, getPickupTaskById, mapPickupTask, updatePickupTaskStatus, type PickupStatus } from '@/lib/pickup-tasks'
import { getSurplusOfferById, updateSurplusOffer } from '@/lib/surplus-offers'
import { getOrganizationById, incrementOrganizationImpact } from '@/lib/organizations'
import { createDeliveryRecord } from '@/lib/delivery-records'

interface RouteContext {
  params: { id: string }
}

export const dynamic = 'force-dynamic'

export const PATCH = withAuth(async (req: NextRequest, context: RouteContext, authUser) => {
  const user = await getUserDocumentByFirebaseUid(authUser.uid)

  if (!user || user.role !== 'VOLUNTEER') {
    return NextResponse.json({ error: 'Only volunteers can update tasks' }, { status: 403 })
  }

  let body: { status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const nextStatus = body.status as PickupStatus
  if (!nextStatus || !PICKUP_STATUSES.includes(nextStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const task = await getPickupTaskById(context.params.id)
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  if (!task.volunteerUserId.equals(user._id)) {
    return NextResponse.json({ error: 'You are not assigned to this task' }, { status: 403 })
  }

  let deliveryPayload:
    | {
        photos: string[]
        deliveredWeightKg: number
        mealsEquivalent: number
        recipientSignature: string | null
        co2SavedKg: number
      }
    | null = null

  if (nextStatus === 'DELIVERED') {
    const deliveredWeight = Number(body.deliveredWeightKg)
    if (!deliveredWeight || Number.isNaN(deliveredWeight) || deliveredWeight <= 0) {
      return NextResponse.json({ error: 'Delivered weight (kg) is required' }, { status: 400 })
    }

    const photos: string[] = []
    if (typeof body.photoUrl === 'string' && body.photoUrl.trim()) {
      photos.push(body.photoUrl.trim())
    }
    if (Array.isArray(body.photos)) {
      for (const photo of body.photos) {
        if (typeof photo === 'string' && photo.trim()) {
          photos.push(photo.trim())
        }
      }
    }

    const mealsEquivalent =
      typeof body.mealsEquivalent === 'number' && body.mealsEquivalent > 0
        ? body.mealsEquivalent
        : Number((deliveredWeight * 2.2).toFixed(2))

    const co2Saved =
      typeof body.co2SavedKg === 'number' && body.co2SavedKg > 0
        ? body.co2SavedKg
        : Number((deliveredWeight * 1.8).toFixed(2))

    deliveryPayload = {
      photos,
      deliveredWeightKg: deliveredWeight,
      mealsEquivalent,
      recipientSignature: typeof body.recipientSignature === 'string' ? body.recipientSignature : null,
      co2SavedKg: co2Saved,
    }
  }

  const updated = await updatePickupTaskStatus(task, nextStatus)
  if (!updated) {
    return NextResponse.json({ error: 'Unable to update task' }, { status: 500 })
  }

  const [surplus, donor, recipient] = await Promise.all([
    getSurplusOfferById(task.surplusId),
    getOrganizationById(task.donorOrgId),
    getOrganizationById(task.recipientOrgId),
  ])

  if (nextStatus === 'DELIVERED' && deliveryPayload) {
    await createDeliveryRecord({
      pickupTaskId: updated._id,
      photos: deliveryPayload.photos,
      deliveredWeightKg: deliveryPayload.deliveredWeightKg,
      mealsEquivalent: deliveryPayload.mealsEquivalent,
      recipientSignature: deliveryPayload.recipientSignature,
      co2SavedKg: deliveryPayload.co2SavedKg,
    })

    if (surplus) {
      await updateSurplusOffer(surplus._id, { status: 'FULFILLED' })
    }

    await Promise.all([
      incrementOrganizationImpact(updated.donorOrgId, {
        weightKg: deliveryPayload.deliveredWeightKg,
        meals: deliveryPayload.mealsEquivalent,
        deliveries: 1,
        co2SavedKg: deliveryPayload.co2SavedKg,
      }),
      incrementOrganizationImpact(updated.recipientOrgId, {
        weightKg: deliveryPayload.deliveredWeightKg,
        meals: deliveryPayload.mealsEquivalent,
        deliveries: 1,
        co2SavedKg: deliveryPayload.co2SavedKg,
      }),
    ])
  }

  return NextResponse.json(mapPickupTask(updated, surplus ?? undefined, donor ?? undefined, recipient ?? undefined))
})
