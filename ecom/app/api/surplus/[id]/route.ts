import { NextRequest, NextResponse } from 'next/server'
import { getSurplusOfferById, updateSurplusOffer, type SurplusOfferInput } from '@/lib/surplus-offers'
import { ObjectId } from 'mongodb'

interface RouteContext {
  params: { id: string }
}

export const dynamic = 'force-dynamic'

export const PATCH = async (req: NextRequest, context: RouteContext) => {
  // All user/auth logic removed
  const offer = await getSurplusOfferById(context.params.id)
  if (!offer) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
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
}
