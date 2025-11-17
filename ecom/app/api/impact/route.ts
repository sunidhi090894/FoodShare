import { getCollection } from '@/lib/mongodb'
import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const impactCol = await getCollection('impact_metrics')
    let impact = await impactCol.findOne({ userId: new ObjectId(userId) })

    if (!impact) {
      const result = await impactCol.insertOne({
        userId: new ObjectId(userId),
        mealServed: 0,
        wasteReduced: 0,
        carbonSaved: 0,
        costSaved: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      impact = await impactCol.findOne({ _id: result.insertedId })
    }

    return NextResponse.json(impact)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { mealServed, wasteReduced, carbonSaved } = await request.json()
    const impactCol = await getCollection('impact_metrics')

    const result = await impactCol.updateOne(
      { userId: new ObjectId(userId) },
      {
        $inc: {
          mealServed,
          wasteReduced,
          carbonSaved,
          costSaved: mealServed * 2.5
        },
        $set: { updatedAt: new Date() }
      }
    )

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
