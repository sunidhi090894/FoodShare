import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/server-auth'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { REQUEST_STATUSES, getRequestById, mapSurplusRequest, updateRequestStatus } from '@/lib/surplus-requests'
import { getSurplusOfferById, updateSurplusOffer } from '@/lib/surplus-offers'
import { getOrganizationById } from '@/lib/organizations'
import { createNotification } from '@/lib/notifications'

interface RouteContext {
  params: { id: string }
}

export const dynamic = 'force-dynamic'

export const PATCH = withAuth(async (req: NextRequest, context: RouteContext, authUser) => {
  const user = await getUserDocumentByFirebaseUid(authUser.uid)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let body: { status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const { status } = body

  if (!REQUEST_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const requestDoc = await getRequestById(context.params.id)

  if (!requestDoc) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const surplus = await getSurplusOfferById(requestDoc.surplusId)

  if (!surplus) {
    return NextResponse.json({ error: 'Surplus offer not found' }, { status: 404 })
  }

  const organization = await getOrganizationById(surplus.organizationId)

  const isOwner = surplus.createdByUserId.equals(user._id)
  const isAdmin = user.role === 'ADMIN'

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

  return NextResponse.json(mapSurplusRequest(updatedRequest, surplus, organization ?? undefined))
})
