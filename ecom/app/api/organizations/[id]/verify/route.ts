import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/server-auth'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { mapOrganization, setOrganizationVerification } from '@/lib/organizations'
import { ObjectId } from 'mongodb'

interface RouteContext {
  params: { id: string }
}

export const dynamic = 'force-dynamic'

export const PATCH = withAuth(async (req: NextRequest, context: RouteContext, authUser) => {
  const user = await getUserDocumentByFirebaseUid(authUser.uid)

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { verified } = await req.json()
  const id = new ObjectId(context.params.id)
  const updated = await setOrganizationVerification(id, Boolean(verified))

  if (!updated) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  return NextResponse.json(mapOrganization(updated))
})
