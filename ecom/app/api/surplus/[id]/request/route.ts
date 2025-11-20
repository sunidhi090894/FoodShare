import { NextRequest, NextResponse } from 'next/server'
import { getUserDocumentById } from '@/lib/users'
import { getSurplusOfferById, updateSurplusOffer } from '@/lib/surplus-offers'
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

    console.log('📝 [REQUEST] Creating request for surplus from user:', userId)

    const user = await getUserDocumentById(userId)
    console.log('📝 [REQUEST] User loaded:', {
      id: user?._id.toHexString(),
      role: user?.role,
      organizationId: (user?.organizationId as any)?.toHexString?.(),
    })

    if (!user) {
      console.log('📝 [REQUEST] ✗ User not found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'RECIPIENT') {
      console.log('📝 [REQUEST] ✗ User is not RECIPIENT, user role:', user.role)
      return NextResponse.json(
        { error: `Forbidden. User must be RECIPIENT to request surplus. Your role is: ${user.role}` },
        { status: 403 }
      )
    }

    if (!user.organizationId) {
      console.log('📝 [REQUEST] ✗ User has no organization set')
      return NextResponse.json({ error: 'Organization not set for user' }, { status: 400 })
    }

    const { id: surplusId } = await context.params
    const surplus = await getSurplusOfferById(new ObjectId(surplusId))
    if (!surplus) {
      console.log('📝 [REQUEST] ✗ Surplus offer not found:', surplusId)
      return NextResponse.json({ error: 'Surplus offer not found' }, { status: 404 })
    }

    if (surplus.status !== 'OPEN') {
      console.log('📝 [REQUEST] ✗ Surplus offer not open, status:', surplus.status)
      return NextResponse.json({ error: 'Surplus offer is not available for requests' }, { status: 400 })
    }

    const recipientOrg = await getOrganizationById(user.organizationId)
    if (!recipientOrg) {
      console.log('📝 [REQUEST] ✗ Recipient organization not found')
      return NextResponse.json({ error: 'Recipient organization not found' }, { status: 404 })
    }

    console.log('📝 [REQUEST] ✓ Creating surplus request')
    const request = await createSurplusRequest(surplus, recipientOrg, new ObjectId(userId))

    // Update surplus status to MATCHED
    console.log('📝 [REQUEST] ✓ Updating surplus status to MATCHED')
    await updateSurplusOffer(surplus._id, { status: 'MATCHED' })
    console.log('📝 [REQUEST] ✓ Surplus status updated to MATCHED')

    // Notify donor
    await createNotification({
      userId: surplus.createdByUserId,
      type: 'REQUEST_RECEIVED',
      title: 'New Surplus Request',
      message: `${recipientOrg.name} has requested your surplus offer.`,
    })

    console.log('📝 [REQUEST] ✓ Request created successfully:', (request as any).id)
    return NextResponse.json(request, { status: 201 })
  } catch (error) {
    console.error('📝 [REQUEST] ✗ Error creating surplus request', error)
    const message = error instanceof Error ? error.message : 'Unable to create request'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
