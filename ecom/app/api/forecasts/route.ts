import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/server-auth'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { listUpcomingForecasts } from '@/lib/potential-forecast'

export const GET = withAuth(async (_req: NextRequest, _ctx, authUser) => {
  const user = await getUserDocumentByFirebaseUid(authUser.uid)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (!user.organizationId) {
    return NextResponse.json({ forecasts: [] })
  }

  const today = new Date()
  const date = today.toISOString().slice(0, 10)
  const forecasts = await listUpcomingForecasts(user.organizationId, date)

  return NextResponse.json(
    forecasts.map((forecast) => ({
      date: forecast.date,
      predictedSurplusKg: forecast.predictedSurplusKg,
    }))
  )
})
