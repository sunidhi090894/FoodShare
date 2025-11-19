import { ObjectId } from 'mongodb'
import { getCollection } from './mongodb'
import type { OrganizationDocument } from './organizations'
import { mapOrganization } from './organizations'
import type { UserDocument } from './users'

export const SURPLUS_STATUSES = ['OPEN', 'MATCHED', 'FULFILLED', 'EXPIRED', 'CANCELLED'] as const
export type SurplusStatus = typeof SURPLUS_STATUSES[number]

export interface SurplusItem {
  name: string
  quantity: number
  unit: string
  category?: string | null
  dietaryTags?: string[]
  allergenTags?: string[]
}

export interface SurplusOfferInput {
  organizationId?: string
  items: SurplusItem[]
  totalWeightKg?: number | null
  pickupWindowStart: string | Date
  pickupWindowEnd: string | Date
  pickupAddress?: string
  geoLocation?: {
    latitude: number
    longitude: number
  } | null
  status?: SurplusStatus
  expiryDateTime?: string | Date
}

export interface SurplusOfferDocument {
  _id: ObjectId
  organizationId: ObjectId
  createdByUserId: ObjectId
  items: SurplusItem[]
  totalWeightKg?: number | null
  pickupWindowStart: Date
  pickupWindowEnd: Date
  pickupAddress: string
  geoLocation?: {
    latitude: number
    longitude: number
  } | null
  status: SurplusStatus
  expiryDateTime: Date
  createdAt: Date
  updatedAt: Date
}

export interface SurplusOfferResponse extends Omit<SurplusOfferDocument, '_id' | 'organizationId' | 'createdByUserId'> {
  id: string
  organizationId: string
  createdByUserId: string
  organization?: ReturnType<typeof mapOrganization>
}

function toDate(value: string | Date, field: string): Date {
  if (!value) {
    throw new Error(`${field} is required`)
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date provided for ${field}`)
  }
  return date
}

function sanitizeItems(items: SurplusItem[]): SurplusItem[] {
  if (!Array.isArray(items) || !items.length) {
    throw new Error('At least one item must be provided')
  }

  return items.map((item) => {
    if (!item.name || typeof item.quantity !== 'number' || !item.unit) {
      throw new Error('Each item must include a name, quantity, and unit')
    }

    return {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category ?? null,
      dietaryTags: Array.isArray(item.dietaryTags) ? item.dietaryTags : [],
      allergenTags: Array.isArray(item.allergenTags) ? item.allergenTags : [],
    }
  })
}

type GeoInput = { latitude?: number | null; longitude?: number | null } | null | undefined

function normalizeGeoLocation(location: GeoInput) {
  if (!location) return null
  const { latitude, longitude } = location
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null
  }
  return { latitude, longitude }
}

export function mapSurplusOffer(doc: SurplusOfferDocument, org?: OrganizationDocument | null): SurplusOfferResponse {
  return {
    id: doc._id.toHexString(),
    organizationId: doc.organizationId.toHexString(),
    createdByUserId: doc.createdByUserId.toHexString(),
    items: doc.items,
    totalWeightKg: doc.totalWeightKg,
    pickupWindowStart: doc.pickupWindowStart,
    pickupWindowEnd: doc.pickupWindowEnd,
    pickupAddress: doc.pickupAddress,
    geoLocation: doc.geoLocation,
    status: doc.status,
    expiryDateTime: doc.expiryDateTime,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    organization: org ? mapOrganization(org) : undefined,
  }
}

export async function createSurplusOffer(
  user: UserDocument,
  organization: OrganizationDocument,
  payload: SurplusOfferInput
) {
  const surplus = await getCollection<SurplusOfferDocument>('surplus_offers')
  const now = new Date()

  // Default expiry to 7 days from now if not provided
  const defaultExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const doc: SurplusOfferDocument = {
    _id: new ObjectId(),
    organizationId: organization._id,
    createdByUserId: user._id,
    items: sanitizeItems(payload.items),
    totalWeightKg: typeof payload.totalWeightKg === 'number' ? payload.totalWeightKg : null,
    pickupWindowStart: toDate(payload.pickupWindowStart, 'pickupWindowStart'),
    pickupWindowEnd: toDate(payload.pickupWindowEnd, 'pickupWindowEnd'),
    pickupAddress: payload.pickupAddress || organization.address,
    geoLocation: normalizeGeoLocation(payload.geoLocation) ?? normalizeGeoLocation(organization.geoLocation) ?? null,
    status: payload.status && SURPLUS_STATUSES.includes(payload.status) ? payload.status : 'OPEN',
    expiryDateTime: payload.expiryDateTime ? toDate(payload.expiryDateTime, 'expiryDateTime') : defaultExpiry,
    createdAt: now,
    updatedAt: now,
  }

  await surplus.insertOne(doc)
  return mapSurplusOffer(doc, organization)
}

async function getOrganizationsForOffers(docs: SurplusOfferDocument[]) {
  const ids = Array.from(new Set(docs.map((doc) => doc.organizationId.toHexString()))).map((id) => new ObjectId(id))
  if (!ids.length) {
    return new Map<string, OrganizationDocument>()
  }

  const organizations = await getCollection<OrganizationDocument>('organizations')
  const orgDocs = await organizations
    .find({ _id: { $in: ids } })
    .toArray()
  return new Map(orgDocs.map((org) => [org._id.toHexString(), org]))
}

export async function listSurplusOffersForUser(userId: ObjectId, status?: SurplusStatus) {
  const surplus = await getCollection<SurplusOfferDocument>('surplus_offers')
  const filter: Record<string, unknown> = { createdByUserId: userId }
  if (status && SURPLUS_STATUSES.includes(status)) {
    filter.status = status
  }
  const docs = await surplus
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray()

  return docs.map((doc) => mapSurplusOffer(doc))
}

export async function listOpenSurplusOffers(filters?: { city?: string }) {
  const surplus = await getCollection<SurplusOfferDocument>('surplus_offers')
  const docs = await surplus
    .find({ status: 'OPEN' })
    .sort({ pickupWindowStart: 1 })
    .toArray()

  const orgMap = await getOrganizationsForOffers(docs)

  return docs
    .filter((doc) => {
      if (!filters?.city) return true
      const org = orgMap.get(doc.organizationId.toHexString())
      return org ? org.city?.toLowerCase() === filters.city.toLowerCase() : false
    })
    .map((doc) => mapSurplusOffer(doc, orgMap.get(doc.organizationId.toHexString())))
}

export async function getSurplusOfferById(id: string | ObjectId) {
  const surplus = await getCollection<SurplusOfferDocument>('surplus_offers')
  const _id = typeof id === 'string' ? new ObjectId(id) : id
  return surplus.findOne({ _id })
}

export async function updateSurplusOffer(
  id: ObjectId,
  updates: Partial<SurplusOfferInput> & { status?: SurplusStatus }
) {
  const surplus = await getCollection<SurplusOfferDocument>('surplus_offers')
  const $set: Record<string, unknown> = { updatedAt: new Date() }

  if (updates.items) $set.items = sanitizeItems(updates.items)
  if (typeof updates.totalWeightKg === 'number') $set.totalWeightKg = updates.totalWeightKg
  if (updates.pickupWindowStart) $set.pickupWindowStart = toDate(updates.pickupWindowStart, 'pickupWindowStart')
  if (updates.pickupWindowEnd) $set.pickupWindowEnd = toDate(updates.pickupWindowEnd, 'pickupWindowEnd')
  if (typeof updates.pickupAddress === 'string') $set.pickupAddress = updates.pickupAddress
  if (updates.geoLocation !== undefined) {
    $set.geoLocation = normalizeGeoLocation(updates.geoLocation)
  }
  if (updates.expiryDateTime) $set.expiryDateTime = toDate(updates.expiryDateTime, 'expiryDateTime')
  if (updates.status && SURPLUS_STATUSES.includes(updates.status)) $set.status = updates.status

  const updated = await surplus.findOneAndUpdate({ _id: id }, { $set }, { returnDocument: 'after' })
  return updated ? mapSurplusOffer(updated) : null
}
