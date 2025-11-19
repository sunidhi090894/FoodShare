import { NextRequest, NextResponse } from 'next/server'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { listPickupTasksForVolunteer } from '@/lib/pickup-tasks'

export const dynamic = 'force-dynamic'

export const GET = async (_req: NextRequest) => {
  // All user/auth logic removed
  // Placeholder: Return empty array for tasks
  return NextResponse.json([])
}
