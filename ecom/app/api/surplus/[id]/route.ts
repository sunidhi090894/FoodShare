import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/server-auth'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { getSurplusOfferById, updateSurplusOffer, type SurplusOfferInput } from '@/lib/surplus-offers'
import { ObjectId } from 'mongodb'

interface RouteContext {
  params: { id: string }
}

export const dynamic = 'force-dynamic'

export const PATCH = withAuth(async (req: NextRequest, context: RouteContext, authUser) => {
  const user = await getUserDocumentByFirebaseUid(authUser.uid)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const offer = await getSurplusOfferById(context.params.id)

  if (!offer) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
  }

  const isOwner = offer.createdByUserId.equals(user._id)
  const isAdmin = user.role === 'ADMIN'

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let payload: Partial<SurplusOfferInput>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const updated = await updateSurplusOffer(new ObjectId(context.params.id), payload)

  if (!updated) {
    return NextResponse.json({ error: 'Unable to update offer' }, { status: 404 })
  }

  return NextResponse.json(updated)
})
