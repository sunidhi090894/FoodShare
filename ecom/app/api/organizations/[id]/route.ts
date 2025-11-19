import { NextRequest, NextResponse } from 'next/server'
import {
  getOrganizationById,
  mapOrganization,
  updateOrganization,
  type OrganizationUpdatePayload,
} from '@/lib/organizations'

import { ObjectId } from 'mongodb'

// The 'RouteContext' interface was removed to resolve a TypeScript compilation error
// due to conflicting type definitions in Next.js dynamic route handlers.

export const dynamic = 'force-dynamic'

export const PATCH = async (req: NextRequest, context: { params: { id: string } }) => {
  const { id } = context.params

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


  const updatedDoc = await updateOrganization(new ObjectId(id), payload)

  if (!updatedDoc) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }



  return NextResponse.json(mapOrganization(updatedDoc))
}