import { getCollection } from '@/lib/mongodb'
import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { surplusId, recipientId, quantity } = await request.json()
    const matchesCol = await getCollection('matches')

    const result = await matchesCol.insertOne({
      surplusId: new ObjectId(surplusId),
      donorId: new ObjectId(userId),
      recipientId: new ObjectId(recipientId),
      quantity,
      status: 'pending',
      createdAt: new Date(),
      confirmedAt: null,
      cancelledAt: null
    })

    // Update surplus status
    const surplusCol = await getCollection('surplus_offers')
    await surplusCol.updateOne(
      { _id: new ObjectId(surplusId) },
      { $set: { status: 'matched', updatedAt: new Date() } }
    )

    return NextResponse.json({ id: result.insertedId }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const matchesCol = await getCollection('matches')
    const matches = await matchesCol.find({
      $or: [
        { donorId: new ObjectId(userId) },
        { recipientId: new ObjectId(userId) }
      ]
    }).toArray()

    return NextResponse.json(matches)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { matchId, status } = await request.json()
    const matchesCol = await getCollection('matches')

    const result = await matchesCol.updateOne(
      { _id: new ObjectId(matchId) },
      {
        $set: {
          status,
          confirmedAt: status === 'confirmed' ? new Date() : null,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
