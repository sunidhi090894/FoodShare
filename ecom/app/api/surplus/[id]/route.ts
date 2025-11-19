import { NextRequest, NextResponse } from 'next/server'
import { getSurplusOfferById, updateSurplusOffer, type SurplusOfferInput } from '@/lib/surplus-offers'
import { getUserDocumentById } from '@/lib/users'
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

    const offer = await getSurplusOfferById(id)
    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    // Check if user is the creator of this offer
    if (offer.createdByUserId.toHexString() !== userId) {
      return NextResponse.json({ error: 'You can only modify your own offers' }, { status: 403 })
    }

    let payload: Partial<SurplusOfferInput>
    try {
      payload = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const updated = await updateSurplusOffer(new ObjectId(id), payload)
    if (!updated) {
      return NextResponse.json({ error: 'Unable to update offer' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update offer'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
