import { NextRequest, NextResponse } from 'next/server'
import { getUserDocumentById } from '@/lib/users'
import { REQUEST_STATUSES, getRequestById, updateRequestStatus } from '@/lib/surplus-requests'
import { getSurplusOfferById, updateSurplusOffer } from '@/lib/surplus-offers'
import { getOrganizationById } from '@/lib/organizations'
import { createNotification } from '@/lib/notifications'
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
    if (!user || user.role !== 'DONOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params

    let body: { status?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    let status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED' = body.status as any
    if (!REQUEST_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const requestDoc = await getRequestById(id)

    if (!requestDoc) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const surplus = await getSurplusOfferById(requestDoc.surplusId)

    if (!surplus) {
      return NextResponse.json({ error: 'Surplus offer not found' }, { status: 404 })
    }

    // Verify the current user is the donor
    if (surplus.createdByUserId.toHexString() !== userId && surplus.createdByUserId.toString() !== userId) {
      return NextResponse.json({ error: 'Not authorized to update this request' }, { status: 403 })
    }

    const updatedRequest = await updateRequestStatus(requestDoc, status)

    if (!updatedRequest) {
      return NextResponse.json({ error: 'Unable to update request' }, { status: 500 })
    }

    if (status === 'APPROVED') {
      await updateSurplusOffer(surplus._id, { status: 'MATCHED' })
    } else if (status === 'FULFILLED') {
      await updateSurplusOffer(surplus._id, { status: 'FULFILLED' })
    }

    if (status === 'APPROVED' || status === 'REJECTED') {
      await createNotification({
        userId: requestDoc.requestedByUserId,
        title: status === 'APPROVED' ? 'Request approved' : 'Request update',
        message:
          status === 'APPROVED'
            ? 'A donor approved your surplus request.'
            : 'A donor was unable to fulfill your request this time.',
        type: status === 'APPROVED' ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED',
      })
    }

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Error updating request', error)
    const message = error instanceof Error ? error.message : 'Unable to update request'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
