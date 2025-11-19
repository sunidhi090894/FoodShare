import { NextRequest, NextResponse } from 'next/server'
import { getUserDocumentByFirebaseUid, getUserDocumentById } from '@/lib/users'
import { getSurplusOfferById } from '@/lib/surplus-offers'
import { getOrganizationById } from '@/lib/organizations'
import { createSurplusRequest } from '@/lib/surplus-requests'
import { createNotification } from '@/lib/notifications'

interface RouteContext {
  params: { id: string }
}

export const dynamic = 'force-dynamic'

export const POST = async (_req: NextRequest, context: RouteContext) => {
  // All user/auth logic removed
  // Placeholder: Surplus request creation logic without user context
  return NextResponse.json({ success: true }, { status: 201 })
}
