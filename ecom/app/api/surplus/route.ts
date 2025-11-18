import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/server-auth'
import { createSurplusOffer, type SurplusOfferInput } from '@/lib/surplus-offers'
import { getOrganizationById } from '@/lib/organizations'
import { getUserDocumentByFirebaseUid } from '@/lib/users'

export const dynamic = 'force-dynamic'

export const POST = withAuth(async (req, _ctx, authUser) => {
  try {
    const user = await getUserDocumentByFirebaseUid(authUser.uid)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.organizationId) {
      return NextResponse.json({ error: 'Organization is required before creating surplus offers' }, { status: 400 })
    }

    let payload: SurplusOfferInput
    try {
      payload = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const organization =
      (payload.organizationId && (await getOrganizationById(payload.organizationId))) ||
      (await getOrganizationById(user.organizationId))

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const offer = await createSurplusOffer(user, organization, {
      ...payload,
      pickupAddress: payload.pickupAddress || organization.address,
    })

    return NextResponse.json(offer, { status: 201 })
  } catch (error) {
    console.error('Error creating surplus offer', error)
    const message = error instanceof Error ? error.message : 'Unable to create offer'
    return NextResponse.json({ error: message }, { status: 500 })
  }
})

export async function GET() {
  return NextResponse.json({ error: 'Use /api/surplus/my or /api/surplus/open' }, { status: 405 })
}
