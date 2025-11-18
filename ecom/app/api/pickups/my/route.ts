import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/server-auth'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { listPickupTasksForVolunteer } from '@/lib/pickup-tasks'

export const dynamic = 'force-dynamic'

export const GET = withAuth(async (_req: NextRequest, _ctx, authUser) => {
  const user = await getUserDocumentByFirebaseUid(authUser.uid)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.role !== 'VOLUNTEER') {
    return NextResponse.json({ error: 'Only volunteers can access tasks' }, { status: 403 })
  }

  const tasks = await listPickupTasksForVolunteer(user._id)
  return NextResponse.json(tasks)
})
