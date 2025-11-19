import { NextRequest, NextResponse } from 'next/server'
import { listOpenSurplusOffers } from '@/lib/surplus-offers'

export const dynamic = 'force-dynamic'

export const GET = async (req: NextRequest) => {
  // All user/auth logic removed
  const city = req.nextUrl.searchParams.get('city') || undefined
  const offers = await listOpenSurplusOffers(city ? { city } : undefined)
  return NextResponse.json(offers)
}
