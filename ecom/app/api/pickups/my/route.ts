import { NextRequest, NextResponse } from 'next/server'
import { getUserDocumentById } from '@/lib/users'
import { listPickupTasksForVolunteer } from '@/lib/pickup-tasks'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export const GET = async (_req: NextRequest) => {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserDocumentById(userId)
    if (!user || user.role !== 'VOLUNTEER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const tasks = await listPickupTasksForVolunteer(new ObjectId(userId))
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error listing pickup tasks', error)
    const message = error instanceof Error ? error.message : 'Unable to list tasks'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
