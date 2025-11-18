import { ObjectId } from 'mongodb'
import { getCollection } from './mongodb'
import { updateUserOrganizationLink, type UserDocument, type UserRole } from './users'

export const ORGANIZATION_TYPES = ['DONOR', 'RECIPIENT'] as const
export type OrganizationType = typeof ORGANIZATION_TYPES[number]

export interface GeoLocation {
  latitude?: number
  longitude?: number
}

export interface ServiceWindow {
  day: string
  open: string
  close: string
}

export interface OrganizationDocument {
  _id: ObjectId
  name: string
  type: OrganizationType
  address: string
  city: string
  pincode: string
  geoLocation?: GeoLocation | null
  storageCapabilities: string[]
  serviceHours: ServiceWindow[]
  contactPerson: string
  contactPhone: string
  verified: boolean
  createdByUserId: ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface OrganizationPayload {
  name: string
  type: OrganizationType
  address: string
  city: string
  pincode: string
  geoLocation?: GeoLocation | null
  storageCapabilities?: string[]
  serviceHours?: ServiceWindow[]
  contactPerson: string
  contactPhone: string
}

export type OrganizationUpdatePayload = Partial<OrganizationPayload> & {
  verified?: boolean
}

export interface OrganizationResponse extends Omit<OrganizationDocument, '_id' | 'createdByUserId'> {
  id: string
  createdByUserId: string
}

function normalizeOrganizationType(type?: string | null): OrganizationType | null {
  if (!type) return null
  const upper = type.toUpperCase() as OrganizationType
  return ORGANIZATION_TYPES.includes(upper) ? upper : null
}

export function mapOrganization(doc: OrganizationDocument): OrganizationResponse {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    type: doc.type,
    address: doc.address,
    city: doc.city,
    pincode: doc.pincode,
    geoLocation: doc.geoLocation ?? null,
    storageCapabilities: doc.storageCapabilities,
    serviceHours: doc.serviceHours,
    contactPerson: doc.contactPerson,
    contactPhone: doc.contactPhone,
    verified: doc.verified,
    createdByUserId: doc.createdByUserId.toHexString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

function sanitizePayload(input: Partial<OrganizationPayload>, fallbackType?: OrganizationType | null) {
  const normalizedType = normalizeOrganizationType(input.type) ?? fallbackType

  if (!normalizedType) {
    throw new Error('Organization type must be DONOR or RECIPIENT')
  }

  return {
    ...input,
    type: normalizedType,
    storageCapabilities: Array.isArray(input.storageCapabilities) ? input.storageCapabilities : [],
    serviceHours: Array.isArray(input.serviceHours) ? input.serviceHours : [],
  }
}

export async function createOrganizationForUser(user: UserDocument, payload: OrganizationPayload) {
  const organizations = await getCollection('organizations')
  const now = new Date()
  const data = sanitizePayload(payload)

  const document: Omit<OrganizationDocument, '_id'> = {
    name: data.name,
    type: data.type,
    address: data.address,
    city: data.city,
    pincode: data.pincode,
    geoLocation: data.geoLocation ?? null,
    storageCapabilities: data.storageCapabilities ?? [],
    serviceHours: data.serviceHours ?? [],
    contactPerson: data.contactPerson,
    contactPhone: data.contactPhone,
    verified: false,
    createdByUserId: user._id,
    createdAt: now,
    updatedAt: now,
  }

  const result = await organizations.insertOne(document)
  const inserted = { ...document, _id: result.insertedId }

  await updateUserOrganizationLink(user._id, result.insertedId, data.type as UserRole)

  return mapOrganization(inserted)
}

export async function listOrganizationsForUser(userId: ObjectId) {
  const organizations = await getCollection('organizations')
  const docs = await organizations
    .find<OrganizationDocument>({ createdByUserId: userId })
    .sort({ createdAt: -1 })
    .toArray()

  return docs.map(mapOrganization)
}

export async function getOrganizationById(id: string | ObjectId) {
  const organizations = await getCollection('organizations')
  const objectId = typeof id === 'string' ? new ObjectId(id) : id
  return organizations.findOne<OrganizationDocument>({ _id: objectId })
}

export async function updateOrganization(
  id: ObjectId,
  updates: OrganizationUpdatePayload
): Promise<OrganizationDocument | null> {
  const organizations = await getCollection('organizations')
  const payload = { ...updates }
  const data: Record<string, unknown> = { updatedAt: new Date() }

  if (typeof payload.name === 'string') data.name = payload.name
  if (typeof payload.address === 'string') data.address = payload.address
  if (typeof payload.city === 'string') data.city = payload.city
  if (typeof payload.pincode === 'string') data.pincode = payload.pincode
  if (typeof payload.contactPerson === 'string') data.contactPerson = payload.contactPerson
  if (typeof payload.contactPhone === 'string') data.contactPhone = payload.contactPhone
  if (payload.geoLocation) data.geoLocation = payload.geoLocation
  if (Array.isArray(payload.storageCapabilities)) data.storageCapabilities = payload.storageCapabilities
  if (Array.isArray(payload.serviceHours)) data.serviceHours = payload.serviceHours
  if (typeof payload.verified === 'boolean') data.verified = payload.verified

  if (payload.type) {
    const normalizedType = normalizeOrganizationType(payload.type)
    if (!normalizedType) {
      throw new Error('Invalid organization type')
    }
    data.type = normalizedType
  }

  const result = await organizations.findOneAndUpdate<OrganizationDocument>(
    { _id: id },
    { $set: data },
    { returnDocument: 'after' }
  )

  return result.value ?? null
}

export async function incrementOrganizationImpact(
  organizationId: ObjectId,
  delta: { weightKg?: number; meals?: number; deliveries?: number; co2SavedKg?: number }
) {
  const organizations = await getCollection('organizations')
  const inc: Record<string, number> = {}

  if (typeof delta.weightKg === 'number') inc['impactTotals.weightKg'] = delta.weightKg
  if (typeof delta.meals === 'number') inc['impactTotals.meals'] = delta.meals
  if (typeof delta.deliveries === 'number') inc['impactTotals.deliveries'] = delta.deliveries
  if (typeof delta.co2SavedKg === 'number') inc['impactTotals.co2SavedKg'] = delta.co2SavedKg

  if (Object.keys(inc).length === 0) return

  await organizations.updateOne(
    { _id: organizationId },
    {
      $inc: inc,
      $setOnInsert: { impactTotals: { weightKg: 0, meals: 0, deliveries: 0, co2SavedKg: 0 } },
    },
    { upsert: true }
  )
}

export async function listPendingOrganizations() {
  const organizations = await getCollection('organizations')
  const docs = await organizations
    .find<OrganizationDocument>({ verified: false })
    .sort({ createdAt: 1 })
    .toArray()

  return docs.map(mapOrganization)
}

export async function setOrganizationVerification(id: ObjectId, verified: boolean) {
  const organizations = await getCollection('organizations')
  const result = await organizations.findOneAndUpdate<OrganizationDocument>(
    { _id: id },
    { $set: { verified, updatedAt: new Date() } },
    { returnDocument: 'after' }
  )

  return result.value ?? null
}
