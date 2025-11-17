import { getCollection } from '@/lib/mongodb'
import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const surplus = await request.json()
    const surplusCol = await getCollection('surplus_offers')

    const result = await surplusCol.insertOne({
      organizationId: new ObjectId(surplus.organizationId),
      userId: new ObjectId(userId),
      itemType: surplus.itemType,
      quantity: surplus.quantity,
      unit: surplus.unit,
      description: surplus.description,
      expiryTime: new Date(surplus.expiryTime),
      pickupLocation: surplus.pickupLocation,
      latitude: surplus.latitude,
      longitude: surplus.longitude,
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date(),
      images: surplus.images || [],
      allergens: surplus.allergens || [],
      dietary: surplus.dietary || []
    })

    return NextResponse.json({ id: result.insertedId, ...surplus }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status') || 'available'
    const radius = request.nextUrl.searchParams.get('radius') || '5'
    const latitude = request.nextUrl.searchParams.get('latitude')
    const longitude = request.nextUrl.searchParams.get('longitude')

    const surplusCol = await getCollection('surplus_offers')
    let query: any = { status }

    if (latitude && longitude) {
      query.$near = {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        $maxDistance: parseFloat(radius) * 1000
      }
    }

    const surplus = await surplusCol.find(query).toArray()
    return NextResponse.json(surplus)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
