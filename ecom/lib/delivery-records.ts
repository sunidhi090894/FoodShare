import { ObjectId } from 'mongodb'
import { getCollection } from './mongodb'

export interface DeliveryRecordDocument {
  _id: ObjectId
  pickupTaskId: ObjectId
  photos: string[]
  deliveredWeightKg: number
  mealsEquivalent: number
  recipientSignature: string | null
  co2SavedKg: number
  createdAt: Date
}

export interface DeliveryRecordInput {
  pickupTaskId: ObjectId
  photos?: string[]
  deliveredWeightKg: number
  mealsEquivalent: number
  recipientSignature?: string | null
  co2SavedKg: number
}

export async function createDeliveryRecord(input: DeliveryRecordInput) {
  const collection = await getCollection('delivery_records')
  const now = new Date()
  const doc: Omit<DeliveryRecordDocument, '_id'> = {
    pickupTaskId: input.pickupTaskId,
    photos: input.photos && input.photos.length ? input.photos : [],
    deliveredWeightKg: input.deliveredWeightKg,
    mealsEquivalent: input.mealsEquivalent,
    recipientSignature: input.recipientSignature ?? null,
    co2SavedKg: input.co2SavedKg,
    createdAt: now,
  }

  const result = await collection.insertOne(doc)
  return { ...doc, _id: result.insertedId }
}
