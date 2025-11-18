import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/server-auth'
import { listOpenSurplusOffers } from '@/lib/surplus-offers'
import { getUserDocumentByFirebaseUid } from '@/lib/users'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (req: NextRequest, _ctx, authUser) => {
  const user = await getUserDocumentByFirebaseUid(authUser.uid)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const city = req.nextUrl.searchParams.get('city') || undefined
  const offers = await listOpenSurplusOffers(city ? { city } : undefined)
  return NextResponse.json(offers)
})
