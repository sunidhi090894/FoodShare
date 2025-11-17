import { getCollection } from '@/lib/mongodb'
import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const org = await request.json()
    const organizations = await getCollection('organizations')

    const result = await organizations.insertOne({
      userId: new ObjectId(userId),
      name: org.name,
      type: org.type,
      address: org.address,
      phone: org.phone,
      latitude: org.latitude,
      longitude: org.longitude,
      createdAt: new Date(),
      updatedAt: new Date(),
      verified: false,
      capacity: org.capacity || 0,
      activeOffers: 0
    })

    return NextResponse.json({ id: result.insertedId, ...org }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const organizations = await getCollection('organizations')
    const orgs = await organizations.find({ userId: new ObjectId(userId) }).toArray()

    return NextResponse.json(orgs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
