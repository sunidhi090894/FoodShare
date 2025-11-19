import { NextRequest, NextResponse } from 'next/server'
import { getUserDocumentById } from '@/lib/users'
import { listRequestsForUser } from '@/lib/surplus-requests'
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
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const requests = await listRequestsForUser(new ObjectId(userId))
    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error listing requests', error)
    const message = error instanceof Error ? error.message : 'Unable to list requests'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
