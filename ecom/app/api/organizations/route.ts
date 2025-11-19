import { NextRequest, NextResponse } from 'next/server'
import { createOrganizationForUser, type OrganizationPayload } from '@/lib/organizations'
import { getUserDocumentByFirebaseUid } from '@/lib/users'

export const dynamic = 'force-dynamic'

export const POST = async (req: NextRequest) => {
  try {
    const body = (await req.json()) as OrganizationPayload
    // All user/auth logic removed
    // Placeholder: Organization creation logic without user context
    return NextResponse.json({ success: true, body }, { status: 201 })
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
