import { NextRequest, NextResponse } from 'next/server'
import { createOrganizationForUser, type OrganizationPayload } from '@/lib/organizations'
import { getUserDocumentById } from '@/lib/users'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export const POST = async (req: NextRequest) => {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserDocumentById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.organizationId) {
      return NextResponse.json({ error: 'User already belongs to an organization' }, { status: 400 })
    }

    const body = (await req.json()) as OrganizationPayload
    const newOrganization = await createOrganizationForUser(user, body)

    return NextResponse.json(newOrganization, { status: 201 })
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
}

export async function GET() {
  return NextResponse.json({ error: 'Use /api/organizations/mine for listing' }, { status: 405 })
}
