import { ObjectId } from 'mongodb'
import { getCollection } from './mongodb'
import { getOrganizationById, mapOrganization, type OrganizationDocument } from './organizations'
import { getSurplusOfferById, mapSurplusOffer, type SurplusOfferDocument } from './surplus-offers'

export const PICKUP_STATUSES = ['ASSIGNED', 'ACCEPTED', 'ON_ROUTE', 'PICKED_UP', 'DELIVERED', 'CANCELLED'] as const
export type PickupStatus = typeof PICKUP_STATUSES[number]

export interface PickupTaskDocument {
  _id: ObjectId
  surplusId: ObjectId
  volunteerUserId: ObjectId
  donorOrgId: ObjectId
  recipientOrgId: ObjectId
  status: PickupStatus
  routeOrder?: number | null
  pickupTimeActual?: Date | null
  deliveryTimeActual?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface PickupTaskResponse
  extends Omit<PickupTaskDocument, '_id' | 'surplusId' | 'volunteerUserId' | 'donorOrgId' | 'recipientOrgId'> {
  id: string
  surplusId: string
  volunteerUserId: string
  donorOrgId: string
  recipientOrgId: string
  surplus?: ReturnType<typeof mapSurplusOffer>
  donorOrg?: ReturnType<typeof mapOrganization>
  recipientOrg?: ReturnType<typeof mapOrganization>
}

const STATUS_TRANSITIONS: Record<PickupStatus, PickupStatus[]> = {
  ASSIGNED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['ON_ROUTE', 'CANCELLED'],
  ON_ROUTE: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
}

export function mapPickupTask(
  doc: PickupTaskDocument,
  surplus?: SurplusOfferDocument | null,
  donor?: OrganizationDocument | null,
  recipient?: OrganizationDocument | null
): PickupTaskResponse {
  return {
    id: doc._id.toHexString(),
    surplusId: doc.surplusId.toHexString(),
    volunteerUserId: doc.volunteerUserId.toHexString(),
    donorOrgId: doc.donorOrgId.toHexString(),
    recipientOrgId: doc.recipientOrgId.toHexString(),
    status: doc.status,
    routeOrder: doc.routeOrder ?? null,
    pickupTimeActual: doc.pickupTimeActual ?? null,
    deliveryTimeActual: doc.deliveryTimeActual ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    surplus: surplus ? mapSurplusOffer(surplus) : undefined,
    donorOrg: donor ? mapOrganization(donor) : undefined,
    recipientOrg: recipient ? mapOrganization(recipient) : undefined,
  }
}

export async function createPickupTask({
  surplusId,
  volunteerUserId,
  donorOrgId,
  recipientOrgId,
  routeOrder,
}: {
  surplusId: ObjectId
  volunteerUserId: ObjectId
  donorOrgId: ObjectId
  recipientOrgId: ObjectId
  routeOrder?: number | null
}) {
  const collection = await getCollection('pickup_tasks')
  const now = new Date()

  const doc: Omit<PickupTaskDocument, '_id'> = {
    surplusId,
    volunteerUserId,
    donorOrgId,
    recipientOrgId,
    status: 'ASSIGNED',
    routeOrder: typeof routeOrder === 'number' ? routeOrder : null,
    pickupTimeActual: null,
    deliveryTimeActual: null,
    createdAt: now,
    updatedAt: now,
  }

  const result = await collection.insertOne(doc)
  const [surplus, donor, recipient] = await Promise.all([
    getSurplusOfferById(surplusId),
    getOrganizationById(donorOrgId),
    getOrganizationById(recipientOrgId),
  ])

  return mapPickupTask({ ...doc, _id: result.insertedId }, surplus ?? undefined, donor ?? undefined, recipient ?? undefined)
}

export async function listPickupTasksForVolunteer(volunteerId: ObjectId) {
  const collection = await getCollection('pickup_tasks')
  const docs = await collection
    .find<PickupTaskDocument>({ volunteerUserId: volunteerId })
    .sort({ createdAt: -1 })
    .toArray()

  if (!docs.length) return []

  const surplusIds = docs.map((doc) => doc.surplusId)
  const surplusCollection = await getCollection('surplus_offers')
  const surplusDocs = await surplusCollection
    .find<SurplusOfferDocument>({ _id: { $in: surplusIds } })
    .toArray()
  const surplusMap = new Map(surplusDocs.map((doc) => [doc._id.toHexString(), doc]))

  const orgIds = docs.flatMap((doc) => [doc.donorOrgId, doc.recipientOrgId])
  const organizations = await getCollection('organizations')
  const orgDocs = await organizations
    .find<OrganizationDocument>({ _id: { $in: orgIds } })
    .toArray()
  const orgMap = new Map(orgDocs.map((doc) => [doc._id.toHexString(), doc]))

  return docs.map((doc) =>
    mapPickupTask(
      doc,
      surplusMap.get(doc.surplusId.toHexString()) ?? undefined,
      orgMap.get(doc.donorOrgId.toHexString()) ?? undefined,
      orgMap.get(doc.recipientOrgId.toHexString()) ?? undefined
    )
  )
}

export async function getPickupTaskById(id: string | ObjectId) {
  const collection = await getCollection('pickup_tasks')
  const _id = typeof id === 'string' ? new ObjectId(id) : id
  return collection.findOne<PickupTaskDocument>({ _id })
}

export async function updatePickupTaskStatus(task: PickupTaskDocument, status: PickupStatus) {
  if (!STATUS_TRANSITIONS[task.status].includes(status)) {
    throw new Error(`Cannot change status from ${task.status} to ${status}`)
  }

  const collection = await getCollection('pickup_tasks')
  const now = new Date()
  const $set: Record<string, unknown> = { status, updatedAt: now }

  if (status === 'PICKED_UP') {
    $set.pickupTimeActual = now
  } else if (status === 'DELIVERED') {
    $set.deliveryTimeActual = now
  }

  const result = await collection.findOneAndUpdate<PickupTaskDocument>({ _id: task._id }, { $set }, { returnDocument: 'after' })
  return result.value ?? null
}
