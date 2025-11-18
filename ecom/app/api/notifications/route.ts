import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/server-auth'
import { getUserDocumentByFirebaseUid } from '@/lib/users'
import { listNotificationsForUser, markNotificationsRead } from '@/lib/notifications'
import { ObjectId } from 'mongodb'

export const GET = withAuth(async (_req: NextRequest, _ctx, authUser) => {
  const user = await getUserDocumentByFirebaseUid(authUser.uid)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const notifications = await listNotificationsForUser(user._id)
  return NextResponse.json(notifications.map((notification) => ({
    id: notification._id.toHexString(),
    title: notification.title,
    message: notification.message,
    type: notification.type,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  })))
})

export const PATCH = withAuth(async (req: NextRequest, _ctx, authUser) => {
  const user = await getUserDocumentByFirebaseUid(authUser.uid)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  let ids: ObjectId[] | undefined
  if (Array.isArray(body.ids)) {
    ids = body.ids
      .filter((id: unknown) => typeof id === 'string')
      .map((id: string) => new ObjectId(id))
  }

  await markNotificationsRead(user._id, ids)
  return NextResponse.json({ success: true })
})
