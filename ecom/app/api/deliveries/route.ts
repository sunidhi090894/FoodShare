import { getCollection } from '@/lib/mongodb'
import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { matchId, volunteerId, estimatedTime } = await request.json()
    const deliveriesCol = await getCollection('deliveries')

    const result = await deliveriesCol.insertOne({
      matchId: new ObjectId(matchId),
      volunteerId: volunteerId ? new ObjectId(volunteerId) : null,
      assignedBy: new ObjectId(userId),
      status: 'pending',
      estimatedTime: new Date(estimatedTime),
      actualTime: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      location: { latitude: 0, longitude: 0 },
      notes: ''
    })

    return NextResponse.json({ id: result.insertedId }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const deliveriesCol = await getCollection('deliveries')
    const deliveries = await deliveriesCol.find({
      $or: [
        { volunteerId: new ObjectId(userId) },
        { assignedBy: new ObjectId(userId) }
      ]
    }).toArray()

    return NextResponse.json(deliveries)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
