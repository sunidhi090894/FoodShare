import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/server-auth'
import {
  getOrganizationById,
  mapOrganization,
  updateOrganization,
  type OrganizationUpdatePayload,
} from '@/lib/organizations'
import { getUserDocumentByFirebaseUid, updateUserOrganizationLink } from '@/lib/users'
import { ObjectId } from 'mongodb'

interface RouteContext {
  params: { id: string }
}

export const dynamic = 'force-dynamic'

export const PATCH = withAuth(async (req: NextRequest, context: RouteContext, authUser) => {
  const { id } = context.params
  const user = await getUserDocumentByFirebaseUid(authUser.uid)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let payload: OrganizationUpdatePayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const organization = await getOrganizationById(id)
  if (!organization) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const isOwner = organization.createdByUserId.equals(user._id)
  const isAdmin = user.role === 'ADMIN'
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updatedDoc = await updateOrganization(new ObjectId(id), payload)

  if (!updatedDoc) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  if (payload.type && isOwner) {
    await updateUserOrganizationLink(user._id, updatedDoc._id, updatedDoc.type)
  }

  return NextResponse.json(mapOrganization(updatedDoc))
})
