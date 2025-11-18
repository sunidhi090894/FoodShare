import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/server-auth'
import { createOrganizationForUser, type OrganizationPayload } from '@/lib/organizations'
import { getUserDocumentByFirebaseUid } from '@/lib/users'

export const dynamic = 'force-dynamic'

export const POST = withAuth(async (req: NextRequest, _ctx, authUser) => {
  try {
    const body = (await req.json()) as OrganizationPayload
    const user = await getUserDocumentByFirebaseUid(authUser.uid)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const organization = await createOrganizationForUser(user, body)
    return NextResponse.json(organization, { status: 201 })
  } catch (error) {
    const isSyntaxError = error instanceof SyntaxError
    const status = isSyntaxError ? 400 : 500
    const message = isSyntaxError
      ? 'Invalid JSON payload'
      : error instanceof Error
        ? error.message
        : 'Unable to create organization'
    return NextResponse.json({ error: message }, { status })
  }
})

export async function GET() {
  return NextResponse.json({ error: 'Use /api/organizations/mine for listing' }, { status: 405 })
}
