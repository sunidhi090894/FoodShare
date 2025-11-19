import { ObjectId } from 'mongodb'
import { getCollection } from './mongodb'
import { mapSurplusOffer, type SurplusOfferDocument } from './surplus-offers'
import { getOrganizationById, type OrganizationDocument } from './organizations'

export const REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'FULFILLED'] as const
export type RequestStatus = typeof REQUEST_STATUSES[number]

export interface SurplusRequestDocument {
  _id: ObjectId
  surplusId: ObjectId
  recipientOrgId: ObjectId
  requestedByUserId: ObjectId
  status: RequestStatus
  createdAt: Date
  updatedAt: Date
}

export interface SurplusRequestResponse
  extends Omit<SurplusRequestDocument, '_id' | 'surplusId' | 'recipientOrgId' | 'requestedByUserId'> {
  id: string
  surplusId: string
  recipientOrgId: string
  requestedByUserId: string
  surplus?: ReturnType<typeof mapSurplusOffer>
}

export function mapSurplusRequest(
  doc: SurplusRequestDocument,
  surplus?: SurplusOfferDocument | null,
  organization?: OrganizationDocument | null
): SurplusRequestResponse {
  return {
    id: doc._id.toHexString(),
    surplusId: doc.surplusId.toHexString(),
    recipientOrgId: doc.recipientOrgId.toHexString(),
    requestedByUserId: doc.requestedByUserId.toHexString(),
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    surplus: surplus ? mapSurplusOffer(surplus, organization ?? undefined) : undefined,
  }
}

async function getOrganizationsMap(ids: ObjectId[]) {
  if (!ids.length) return new Map<string, OrganizationDocument>()
  const organizations = await getCollection<OrganizationDocument>('organizations')
  const docs = await organizations
    .find({ _id: { $in: ids } })
    .toArray()
  return new Map(docs.map((doc) => [doc._id.toHexString(), doc]))
}

export async function createSurplusRequest(
  surplus: SurplusOfferDocument,
  recipientOrganization: OrganizationDocument,
  userId: ObjectId
) {
  const requests = await getCollection<SurplusRequestDocument>('surplus_requests')
  const existing = await requests.findOne({
    surplusId: surplus._id,
    requestedByUserId: userId,
  })

  if (existing) {
    throw new Error('You have already requested this offer.')
  }

  const now = new Date()
  const doc: SurplusRequestDocument = {
    _id: new ObjectId(),
    surplusId: surplus._id,
    recipientOrgId: recipientOrganization._id,
    requestedByUserId: userId,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  }
  
  console.log('Creating surplus request with data:', {
    surplusId: doc.surplusId.toString(),
    recipientOrgId: doc.recipientOrgId.toString(),
    requestedByUserId: doc.requestedByUserId.toString(),
    status: doc.status,
  })
  
  await requests.insertOne(doc)
  
  console.log('Successfully inserted request:', doc._id.toString())

  const donorOrg = await getOrganizationById(surplus.organizationId)

  return mapSurplusRequest(
    doc,
    surplus,
    donorOrg ?? undefined
  )
}

export async function listRequestsForUser(userId: ObjectId) {
  const requestsCol = await getCollection<SurplusRequestDocument>('surplus_requests')
  const docs = await requestsCol
    .find({ requestedByUserId: userId })
    .sort({ createdAt: -1 })
    .toArray()

  if (!docs.length) {
    return []
  }

  const offerIds = docs.map((doc) => doc.surplusId)
  const offersCol = await getCollection<SurplusOfferDocument>('surplus_offers')
  const offers = await offersCol
    .find({ _id: { $in: offerIds } })
    .toArray()
  const offerMap = new Map(offers.map((offer) => [offer._id.toHexString(), offer]))

  const orgIds = offers.map((offer) => offer.organizationId)
  const orgMap = await getOrganizationsMap(orgIds)

  return docs.map((doc) => {
    const offer = offerMap.get(doc.surplusId.toHexString()) ?? null
    const organization = offer ? orgMap.get(offer.organizationId.toHexString()) ?? null : null
    return mapSurplusRequest(doc, offer, organization)
  })
}

export async function getRequestById(id: string | ObjectId) {
  const requestsCol = await getCollection<SurplusRequestDocument>('surplus_requests')
  const objectId = typeof id === 'string' ? new ObjectId(id) : id
  return requestsCol.findOne({ _id: objectId })
}

export async function getRequestsBySurplusId(surplusId: ObjectId) {
  const requestsCol = await getCollection<SurplusRequestDocument>('surplus_requests')
  const docs = await requestsCol
    .find({ surplusId })
    .sort({ createdAt: -1 })
    .toArray()

  return docs
}

export async function updateRequestStatus(request: SurplusRequestDocument, status: RequestStatus) {
  const requestsCol = await getCollection<SurplusRequestDocument>('surplus_requests')
  const updated = await requestsCol.findOneAndUpdate(
    { _id: request._id },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: 'after' }
  )

  return updated ?? null
}
