import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/server-auth'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { listPendingOrganizations } from '@/lib/organizations'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (_req, _ctx, authUser) => {
  const user = await getUserDocumentByFirebaseUid(authUser.uid)

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const organizations = await listPendingOrganizations()
  return NextResponse.json(organizations)
})
