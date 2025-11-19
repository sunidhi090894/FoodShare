import { NextResponse } from 'next/server'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { listPendingOrganizations } from '@/lib/organizations'

export const dynamic = 'force-dynamic'

export const GET = async (_req: Request) => {
  // TODO: Replace with actual user context
  // const user = await getUserDocumentByFirebaseUid(authUser.uid)

    // TODO: Add user context and authorization logic here

  const organizations = await listPendingOrganizations()
  return NextResponse.json(organizations)
}
