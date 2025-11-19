import { NextRequest, NextResponse } from 'next/server'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { listUpcomingForecasts } from '@/lib/potential-forecast'

export const GET = async (_req: NextRequest) => {
  // TODO: Replace with actual user context
  // const user = await getUserDocumentByFirebaseUid(authUser.uid)



  const today = new Date()
  const date = today.toISOString().slice(0, 10)
  // TODO: Add user context and organization logic here
  // Placeholder: return empty forecasts
  return NextResponse.json([])
}
