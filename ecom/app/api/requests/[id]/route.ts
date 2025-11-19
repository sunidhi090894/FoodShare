import { NextRequest, NextResponse } from 'next/server'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { REQUEST_STATUSES, getRequestById, mapSurplusRequest, updateRequestStatus } from '@/lib/surplus-requests'
import { getSurplusOfferById, updateSurplusOffer } from '@/lib/surplus-offers'
import { getOrganizationById } from '@/lib/organizations'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'
type RouteParams = { id: string }

export const PATCH = async (
  req: NextRequest,
  context: { params: Promise<RouteParams> }
) => {
  // All user/auth logic removed

  const { id } = await context.params

  let body: { status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  let status: "PENDING" | "APPROVED" | "REJECTED" | "FULFILLED" = body.status as any
  if (!REQUEST_STATUSES.includes(status)) {
    status = "PENDING"
  }

  const requestDoc = await getRequestById(id)

  if (!requestDoc) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const surplus = await getSurplusOfferById(requestDoc.surplusId)

  if (!surplus) {
    return NextResponse.json({ error: 'Surplus offer not found' }, { status: 404 })
  }

  const organization = await getOrganizationById(surplus.organizationId)

  // Authorization logic removed

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

  // Return placeholder data to avoid type errors
  return NextResponse.json({ success: true, updatedRequest })
}
