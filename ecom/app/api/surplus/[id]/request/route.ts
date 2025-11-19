import { NextRequest, NextResponse } from 'next/server'
import { getUserDocumentByFirebaseUid, getUserDocumentById } from '@/lib/users'
import { getSurplusOfferById } from '@/lib/surplus-offers'
import { getOrganizationById } from '@/lib/organizations'
import { createSurplusRequest } from '@/lib/surplus-requests'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

type RouteParams = { id: string }

export const POST = async (
  _req: NextRequest,
  context: { params: Promise<RouteParams> }
) => {
  // All user/auth logic removed
  // Placeholder: Surplus request creation logic without user context
  return NextResponse.json({ success: true }, { status: 201 })
}
