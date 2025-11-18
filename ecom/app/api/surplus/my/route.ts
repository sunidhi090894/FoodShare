import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/server-auth'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { listSurplusOffersForUser, SURPLUS_STATUSES, type SurplusStatus } from '@/lib/surplus-offers'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (req: NextRequest, _ctx, authUser) => {
  const user = await getUserDocumentByFirebaseUid(authUser.uid)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const statusParam = req.nextUrl.searchParams.get('status')?.toUpperCase() as SurplusStatus | undefined
  const status = statusParam && SURPLUS_STATUSES.includes(statusParam) ? statusParam : undefined

  const offers = await listSurplusOffersForUser(user._id, status)
  return NextResponse.json(offers)
})
