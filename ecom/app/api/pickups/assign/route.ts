import { NextRequest, NextResponse } from 'next/server'
import { getUserDocumentById } from '@/lib/users'
import { getSurplusOfferById } from '@/lib/surplus-offers'
import { createPickupTask } from '@/lib/pickup-tasks'
import { createNotification } from '@/lib/notifications'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'

interface AssignPayload {
  surplusId: string
  volunteerUserId: string
  donorOrgId?: string
  recipientOrgId: string
  routeOrder?: number
}

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getUserDocumentById(userId)
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can assign pickups' }, { status: 403 })
    }

    let payload: AssignPayload
    try {
      payload = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    if (!payload.surplusId || !payload.volunteerUserId || !payload.recipientOrgId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const surplus = await getSurplusOfferById(new ObjectId(payload.surplusId))
    if (!surplus) {
      return NextResponse.json({ error: 'Surplus offer not found' }, { status: 404 })
    }

    const volunteer = await getUserDocumentById(payload.volunteerUserId)
    if (!volunteer || volunteer.role !== 'VOLUNTEER') {
      return NextResponse.json({ error: 'Volunteer not found or invalid role' }, { status: 400 })
    }

    let donorOrgId: ObjectId
    let recipientOrgId: ObjectId
    try {
      donorOrgId = payload.donorOrgId ? new ObjectId(payload.donorOrgId) : surplus.organizationId
      recipientOrgId = new ObjectId(payload.recipientOrgId)
    } catch {
      return NextResponse.json({ error: 'Invalid organization identifier' }, { status: 400 })
    }

    const task = await createPickupTask({
      surplusId: surplus._id,
      volunteerUserId: volunteer._id,
      donorOrgId,
      recipientOrgId,
      routeOrder: payload.routeOrder,
    })

    await createNotification({
      userId: volunteer._id,
      title: 'New pickup assigned',
      message: `You have a new pickup for ${payload.routeOrder ? `stop #${payload.routeOrder}` : 'AaharSetu'}.`,
      type: 'TASK_ASSIGNED',
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error assigning pickup task', error)
    const message = error instanceof Error ? error.message : 'Unable to assign task'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
