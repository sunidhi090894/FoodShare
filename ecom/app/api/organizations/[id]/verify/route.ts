import { NextRequest, NextResponse } from 'next/server'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { mapOrganization, setOrganizationVerification } from '@/lib/organizations'
import { ObjectId } from 'mongodb'

interface RouteContext {
  params: { id: string }
}

export const dynamic = 'force-dynamic'

export const PATCH = async (req: NextRequest, context: RouteContext) => {
  // TODO: Replace with actual user context
  // const user = await getUserDocumentByFirebaseUid(authUser.uid)

    // TODO: Add user context and authorization logic here

  const { verified } = await req.json()
  const id = new ObjectId(context.params.id)
  const updated = await setOrganizationVerification(id, Boolean(verified))

  if (!updated) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

    // TODO: Fix type issues for OrganizationDocument
    return NextResponse.json({})
}

