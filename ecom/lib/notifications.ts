import { ObjectId } from 'mongodb'
import { getCollection } from './mongodb'

export const NOTIFICATION_TYPES = [
  'REQUEST_RECEIVED',
  'REQUEST_APPROVED',
  'REQUEST_REJECTED',
  'TASK_ASSIGNED',
] as const

export type NotificationType = typeof NOTIFICATION_TYPES[number]

export interface NotificationDocument {
  _id: ObjectId
  userId: ObjectId
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: Date
}

export async function createNotification(input: {
  userId: ObjectId
  title: string
  message: string
  type: NotificationType
}) {
  const notifications = await getCollection('notifications')
  const doc: Omit<NotificationDocument, '_id'> = {
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type,
    isRead: false,
    createdAt: new Date(),
  }
  await notifications.insertOne(doc)
}

export async function listNotificationsForUser(userId: ObjectId, limit = 20) {
  const notifications = await getCollection('notifications')
  return notifications
    .find<NotificationDocument>({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()
}

export async function countUnreadNotifications(userId: ObjectId) {
  const notifications = await getCollection('notifications')
  return notifications.countDocuments({ userId, isRead: false })
}

export async function markNotificationsRead(userId: ObjectId, notificationIds?: ObjectId[]) {
  const notifications = await getCollection('notifications')
  const filter: Record<string, unknown> = { userId }
  if (notificationIds && notificationIds.length) {
    filter._id = { $in: notificationIds }
  }

  await notifications.updateMany(filter, { $set: { isRead: true } })
}
