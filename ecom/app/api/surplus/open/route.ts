import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/server-auth'
import { listOpenSurplusOffers } from '@/lib/surplus-offers'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async () => {
  const offers = await listOpenSurplusOffers()
  return NextResponse.json(offers)
})
