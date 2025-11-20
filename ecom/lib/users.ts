import { ObjectId } from 'mongodb'
import { getCollection } from './mongodb'
// import { RequestUser } from './server-auth' (removed)

export const USER_ROLES = ['DONOR', 'RECIPIENT', 'VOLUNTEER', 'ADMIN'] as const
export type UserRole = typeof USER_ROLES[number]

export interface UserLocation {
  city?: string
  latitude?: number
  longitude?: number
}

export interface VolunteerAvailability {
  days?: string[]
  timeSlots?: string[]
  notes?: string
}

export interface UserDocument {
  _id: ObjectId
  firebaseUid: string
  name: string | null
  email: string | null
  role: UserRole
  organizationId: ObjectId | null
  phone: string | null
  photoURL?: string | null
  location: UserLocation | null
  availability: VolunteerAvailability | null
  createdAt: Date
  updatedAt: Date
}

export interface PersistedUser extends Omit<UserDocument, '_id' | 'organizationId'> {
  id: string
  organizationId: string | null
}

export interface UserProfileInput {
  role?: UserRole | string | null
  organizationId?: string | null
  phone?: string | null
  location?: UserLocation | null
  availability?: VolunteerAvailability | null
}

export function coerceUserRole(role?: string | null, fallback?: UserRole | null): UserRole | null {
  if (!role) {
    return fallback ?? null
  }

  const normalized = role.toUpperCase() as UserRole
  if (USER_ROLES.includes(normalized)) {
    return normalized
  }

  return fallback ?? null
}

function toObjectId(id?: string | null): ObjectId | null {
  if (!id) return null
  try {
    return new ObjectId(id)
  } catch {
    return null
  }
}

function mapUserDocument(doc: UserDocument | null): PersistedUser | null {
  if (!doc) return null

  return {
    id: doc._id.toHexString(),
    firebaseUid: doc.firebaseUid,
    name: doc.name,
    email: doc.email,
    role: doc.role,
    organizationId: doc.organizationId ? doc.organizationId.toHexString() : null,
    phone: doc.phone,
    photoURL: doc.photoURL,
    location: doc.location,
    availability: doc.availability,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export async function findUserByFirebaseUid(uid: string) {
  const doc = await getUserDocumentByFirebaseUid(uid)
  return mapUserDocument(doc)
}

export async function getUserDocumentByFirebaseUid(uid: string) {
  const users = await getCollection<UserDocument>('users')
  return users.findOne({ firebaseUid: uid })
}

export async function getUserDocumentById(id: string | ObjectId) {
  const users = await getCollection<UserDocument>('users')
  const objectId = typeof id === 'string' ? new ObjectId(id) : id
  return users.findOne({ _id: objectId })
}


export async function updateUserOrganizationLink(
  userId: ObjectId,
  organizationId: ObjectId | null,
  role?: UserRole | null,
  organizationName?: string | null
) {
  console.log('👤 [LIB] updateUserOrganizationLink called')
  console.log('   - userId:', userId.toHexString())
  console.log('   - organizationId:', organizationId?.toHexString?.() || organizationId)
  console.log('   - role:', role)
  console.log('   - organizationName:', organizationName)

  const users = await getCollection<UserDocument>('users')
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
    organizationId,
  }

  if (role) {
    updates.role = role
  }

  if (organizationName) {
    updates.organization = organizationName
  }

  console.log('👤 [LIB] About to update user document with:', updates)

  const result = await users.updateOne(
    { _id: userId },
    {
      $set: updates,
    }
  )

  console.log('👤 [LIB] ✓ Update result:', {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    acknowledged: result.acknowledged,
  })

  // Verify the update
  const updatedUser = await users.findOne({ _id: userId })
  console.log('👤 [LIB] ✓ Verified user after update:')
  console.log('   - organizationId:', updatedUser?.organizationId?.toHexString?.() || updatedUser?.organizationId)
  console.log('   - organization:', (updatedUser as any)?.organization)
}
