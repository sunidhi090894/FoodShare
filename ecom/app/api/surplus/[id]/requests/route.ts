import { NextRequest, NextResponse } from 'next/server'
import { getSurplusOfferById } from '@/lib/surplus-offers'
import { getUserDocumentById } from '@/lib/users'
import { getRequestsBySurplusId } from '@/lib/surplus-requests'
import { getOrganizationById } from '@/lib/organizations'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

type RouteParams = { id: string }

export const GET = async (
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
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    if (user.role !== 'DONOR') {
      return NextResponse.json({ error: `Forbidden: Only donors can view requests. Your role is: ${user.role}` }, { status: 403 })
    }

    const { id } = await context.params
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid surplus ID format' }, { status: 400 })
    }

    // Verify offer exists and user owns it
    const offer = await getSurplusOfferById(id)
    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    const offerOwnerId = offer.createdByUserId.toHexString() || offer.createdByUserId.toString()
    if (offerOwnerId !== userId) {
      return NextResponse.json({ error: `Not authorized: You are not the owner of this offer. Owner: ${offerOwnerId}, You: ${userId}` }, { status: 403 })
    }

    // Get all requests for this surplus
    const requests = await getRequestsBySurplusId(new ObjectId(id))
    console.log(`Found ${requests.length} requests for surplus ${id}`)

    // Enrich requests with recipient org name
    const enrichedRequests = await Promise.all(
      requests.map(async (req: any) => {
        try {
          const recipientOrg = await getOrganizationById(req.recipientOrgId)
          return {
            id: req._id?.toString(),
            surplusId: req.surplusId?.toString(),
            status: req.status,
            recipientOrgName: recipientOrg?.name || 'Unknown Organization',
            requestedByUserId: req.requestedByUserId?.toString(),
            items: req.items,
            notes: req.notes,
            createdAt: req.createdAt?.toISOString(),
          }
        } catch (err) {
          console.error('Error enriching request:', err)
          return {
            id: req._id?.toString(),
            surplusId: req.surplusId?.toString(),
            status: req.status,
            recipientOrgName: 'Unknown Organization',
            requestedByUserId: req.requestedByUserId?.toString(),
            items: req.items,
            notes: req.notes,
            createdAt: req.createdAt?.toISOString(),
          }
        }
      })
    )

    return NextResponse.json(enrichedRequests)
  } catch (error) {
    console.error('Error fetching requests for surplus:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch requests'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
