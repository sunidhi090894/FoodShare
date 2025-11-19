import { NextResponse, NextRequest } from 'next/server'
import { createSurplusOffer, type SurplusOfferInput } from '@/lib/surplus-offers'
import { getOrganizationById } from '@/lib/organizations'
import { getUserDocumentById } from '@/lib/users'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export const POST = async (req: NextRequest) => {
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

    if (!user.organizationId) {
      return NextResponse.json({ error: 'Organization not set for user' }, { status: 400 })
    }

    const organization = await getOrganizationById(user.organizationId)
    if (!organization) {
      return NextResponse.json({ error: 'Donor organization not found' }, { status: 404 })
    }

    let payload: SurplusOfferInput
    try {
      payload = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const newOffer = await createSurplusOffer(user, organization, payload)

    return NextResponse.json(newOffer, { status: 201 })
  } catch (error) {
    console.error('Error creating surplus offer', error)
    const message = error instanceof Error ? error.message : 'Unable to create offer'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Use /api/surplus/my or /api/surplus/available' }, { status: 405 })
}
