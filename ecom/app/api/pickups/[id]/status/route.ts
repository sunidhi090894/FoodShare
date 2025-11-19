import { NextRequest, NextResponse } from 'next/server'
import { getUserDocumentById } from '@/lib/users'
import { PICKUP_STATUSES, getPickupTaskById, updatePickupTaskStatus, type PickupStatus } from '@/lib/pickup-tasks'
import { getSurplusOfferById, updateSurplusOffer } from '@/lib/surplus-offers'
import { getOrganizationById, incrementOrganizationImpact } from '@/lib/organizations'
import { createDeliveryRecord } from '@/lib/delivery-records'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

type RouteParams = { id: string }

export const PATCH = async (
  req: NextRequest,
  context: { params: Promise<RouteParams> }
) => {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserDocumentById(userId)
    if (!user || user.role !== 'VOLUNTEER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: {
      status?: string
      deliveredWeightKg?: number
      photoUrl?: string
      photos?: string[]
      mealsEquivalent?: number
      co2SavedKg?: number
      recipientSignature?: string | null
    }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const nextStatus = body.status as PickupStatus
    if (!nextStatus || !PICKUP_STATUSES.includes(nextStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { id } = await context.params
    const task = await getPickupTaskById(id)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify the current user is assigned to this task
    if (task.volunteerUserId.toHexString() !== userId && task.volunteerUserId.toString() !== userId) {
      return NextResponse.json({ error: 'Not authorized to update this task' }, { status: 403 })
    }

    let deliveryPayload: {
      photos: string[]
      deliveredWeightKg: number
      mealsEquivalent: number
      recipientSignature: string | null
      co2SavedKg: number
    } | null = null

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
      getOrganizationById(task.donorOrgId.toString()),
      getOrganizationById(task.recipientOrgId.toString()),
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

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating pickup task status', error)
    const message = error instanceof Error ? error.message : 'Unable to update task'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}