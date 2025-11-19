import { NextRequest, NextResponse } from 'next/server'
import {
  getOrganizationById,
  mapOrganization,
  updateOrganization,
  type OrganizationUpdatePayload,
} from '@/lib/organizations'

import { ObjectId } from 'mongodb'

interface RouteContext {
  params: { id: string }
}

export const dynamic = 'force-dynamic'

export const PATCH = async (req: NextRequest, context: RouteContext) => {
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
