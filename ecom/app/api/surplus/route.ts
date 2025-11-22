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
    console.log('📝 [POST /api/surplus] userId from cookie:', userId)
    
    if (!userId) {
      console.log('📝 [POST /api/surplus] ✗ No userId in cookie')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserDocumentById(userId)
    console.log('📝 [POST /api/surplus] User loaded:', {
      id: user?._id.toHexString(),
      role: user?.role,
      organizationId: (user?.organizationId as any)?.toHexString?.(),
    })

    if (!user) {
      console.log('📝 [POST /api/surplus] ✗ User not found')
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      )
    }

    if (user.role !== 'DONOR') {
      console.log('📝 [POST /api/surplus] ✗ User is not a DONOR. Role:', user.role)
      return NextResponse.json(
        { 
          error: `Only DONORS can create surplus offers. Your role is: ${user.role}` 
        }, 
        { status: 403 }
      )
    }

    if (!user.organizationId) {
      console.log('📝 [POST /api/surplus] ✗ User has no organization')
      return NextResponse.json({ error: 'Organization not set for user' }, { status: 400 })
    }

    const organization = await getOrganizationById(user.organizationId)
    console.log('📝 [POST /api/surplus] Organization loaded:', organization?._id.toHexString())
    
    if (!organization) {
      console.log('📝 [POST /api/surplus] ✗ Donor organization not found')
      return NextResponse.json({ error: 'Donor organization not found' }, { status: 404 })
    }

    let payload: SurplusOfferInput
    try {
      payload = await req.json()
      console.log('📝 [POST /api/surplus] ✓ Payload parsed:', {
        items_count: payload.items?.length,
        pickupWindowStart: payload.pickupWindowStart,
        pickupWindowEnd: payload.pickupWindowEnd,
      })
    } catch {
      console.log('📝 [POST /api/surplus] ✗ Invalid JSON payload')
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    console.log('📝 [POST /api/surplus] Creating surplus offer for user:', userId)
    const newOffer = await createSurplusOffer(user, organization, payload)

    console.log('📝 [POST /api/surplus] ✅ Surplus offer created:', newOffer.id)
    return NextResponse.json(newOffer, { status: 201 })
  } catch (error) {
    console.error('📝 [POST /api/surplus] ✗ Error creating surplus offer', error)
    const message = error instanceof Error ? error.message : 'Unable to create offer'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Use /api/surplus/my or /api/surplus/available' }, { status: 405 })
}
