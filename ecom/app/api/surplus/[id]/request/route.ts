import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/server-auth'
import { getUserDocumentByFirebaseUid, getUserDocumentById } from '@/lib/users'
import { getSurplusOfferById } from '@/lib/surplus-offers'
import { getOrganizationById } from '@/lib/organizations'
import { createSurplusRequest } from '@/lib/surplus-requests'
import { createNotification } from '@/lib/notifications'

interface RouteContext {
  params: { id: string }
}

export const dynamic = 'force-dynamic'

export const POST = withAuth(async (_req: NextRequest, context: RouteContext, authUser) => {
  const user = await getUserDocumentByFirebaseUid(authUser.uid)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.role !== 'RECIPIENT') {
    return NextResponse.json({ error: 'Only recipients can request surplus' }, { status: 403 })
  }

  if (!user.organizationId) {
    return NextResponse.json({ error: 'Please complete organization onboarding first.' }, { status: 400 })
  }

  const [surplus, organization] = await Promise.all([
    getSurplusOfferById(context.params.id),
    getOrganizationById(user.organizationId),
  ])

  if (!surplus) {
    return NextResponse.json({ error: 'Surplus offer not found' }, { status: 404 })
  }

  if (surplus.status !== 'OPEN') {
    return NextResponse.json({ error: 'This offer is no longer available.' }, { status: 400 })
  }

  if (!organization) {
    return NextResponse.json({ error: 'Recipient organization not found' }, { status: 404 })
  }

  const request = await createSurplusRequest(surplus, organization, user._id)

  // Notify donor of new request
  const donorUser = await getUserDocumentById(request.surplus?.createdByUserId ?? surplus.createdByUserId)
  if (donorUser) {
    await createNotification({
      userId: donorUser._id,
      title: 'New surplus request',
      message: `${user.name ?? 'A recipient'} requested your offer.`,
      type: 'REQUEST_RECEIVED',
    })
  }

  return NextResponse.json(request, { status: 201 })
})
