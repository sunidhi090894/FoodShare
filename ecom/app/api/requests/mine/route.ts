import { NextRequest, NextResponse } from 'next/server'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { listRequestsForUser } from '@/lib/surplus-requests'

export const dynamic = 'force-dynamic'

export const GET = async (_req: NextRequest) => {
  // TODO: Replace with actual user context
  // const user = await getUserDocumentByFirebaseUid(authUser.uid)


    // TODO: Add user context and request logic here
    // Placeholder: return empty requests
    return NextResponse.json([])
}
