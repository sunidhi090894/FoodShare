import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/server-auth'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { listRequestsForUser } from '@/lib/surplus-requests'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (_req: NextRequest, _ctx, authUser) => {
  const user = await getUserDocumentByFirebaseUid(authUser.uid)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const requests = await listRequestsForUser(user._id)
  return NextResponse.json(requests)
})
