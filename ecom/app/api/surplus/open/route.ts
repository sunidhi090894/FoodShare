import { NextResponse } from 'next/server'
import { listOpenSurplusOffers } from '@/lib/surplus-offers'

export const dynamic = 'force-dynamic'

export const GET = async () => {
  const offers = await listOpenSurplusOffers()
  return NextResponse.json(offers)
}
