import { NextRequest, NextResponse } from 'next/server'
import { listSurplusOffersForUser, SURPLUS_STATUSES, type SurplusStatus } from '@/lib/surplus-offers'

export const dynamic = 'force-dynamic'

export const GET = async (req: NextRequest) => {
  // All user/auth logic removed
  const statusParam = req.nextUrl.searchParams.get('status')?.toUpperCase() as SurplusStatus | undefined
  const status = statusParam && SURPLUS_STATUSES.includes(statusParam) ? statusParam : undefined
  return NextResponse.json([])
}
