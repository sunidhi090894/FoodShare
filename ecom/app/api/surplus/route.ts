import { NextResponse } from 'next/server'
import { createSurplusOffer, type SurplusOfferInput } from '@/lib/surplus-offers'
import { getOrganizationById } from '@/lib/organizations'


export const POST = async (req: Request) => {
  try {
    // All user/auth logic removed
    let payload: SurplusOfferInput
    try {
      payload = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }
    // Placeholder: Surplus offer creation logic without user context
    return NextResponse.json({ success: true, payload }, { status: 201 })
  } catch (error) {
    console.error('Error creating surplus offer', error)
    const message = error instanceof Error ? error.message : 'Unable to create offer'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Use /api/surplus/my or /api/surplus/open' }, { status: 405 })
}
