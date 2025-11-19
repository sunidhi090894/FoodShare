import { NextRequest, NextResponse } from 'next/server'
import { getUserDocumentById } from '@/lib/users'
import { getSurplusOfferById } from '@/lib/surplus-offers'
import { getOrganizationById } from '@/lib/organizations'
import { createSurplusRequest } from '@/lib/surplus-requests'
import { createNotification } from '@/lib/notifications'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

type RouteParams = { id: string }

export const POST = async (
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
    if (!user || user.role !== 'RECIPIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'Organization not set for user' }, { status: 400 })
    }

    const { id: surplusId } = await context.params
    const surplus = await getSurplusOfferById(new ObjectId(surplusId))
    if (!surplus) {
      return NextResponse.json({ error: 'Surplus offer not found' }, { status: 404 })
    }

    if (surplus.status !== 'OPEN') {
      return NextResponse.json({ error: 'Surplus offer is not available for requests' }, { status: 400 })
    }

    const recipientOrg = await getOrganizationById(user.organizationId)
    if (!recipientOrg) {
      return NextResponse.json({ error: 'Recipient organization not found' }, { status: 404 })
    }

    const request = await createSurplusRequest(surplus, recipientOrg, new ObjectId(userId))

    // Notify donor
    await createNotification({
      userId: surplus.createdByUserId,
      type: 'REQUEST_RECEIVED',
      title: 'New Surplus Request',
      message: `${recipientOrg.name} has requested your surplus offer.`,
    })

    return NextResponse.json(request, { status: 201 })
  } catch (error) {
    console.error('Error creating surplus request', error)
    const message = error instanceof Error ? error.message : 'Unable to create request'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
