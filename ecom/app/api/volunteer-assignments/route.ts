import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const volunteerId = searchParams.get('volunteerId')
    const volunteerCity = searchParams.get('volunteerCity')

    const { db } = await connectToDatabase()
    const assignments = db.collection('volunteer_assignments')

    if (volunteerCity) {
      // Get assignments for a volunteer's city, filtered by city match
      const result = await assignments
        .find({
          donorCity: volunteerCity,
          $or: [{ status: 'ASSIGNED' }, { status: 'ACCEPTED' }, { status: 'COMPLETED' }],
        })
        .toArray()
      
      const response = new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      })
      
      return response
    }

    return Response.json([])
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return Response.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { surplusId, donorOrg, donorCity, donorAddress, donorContact, items, pickupWindow } = body

    const { db } = await connectToDatabase()
    const assignments = db.collection('volunteer_assignments')

    // Create a new assignment from a matched offer
    const result = await assignments.insertOne({
      surplusId,
      donorOrg,
      donorCity,
      donorAddress,
      donorContact,
      items,
      pickupWindow,
      status: 'ASSIGNED',
      createdAt: new Date(),
      acceptedAt: null,
      completedAt: null,
      volunteerId: null,
    })

    return Response.json({ id: result.insertedId, ...body, status: 'ASSIGNED' })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return Response.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { assignmentId, status, volunteerId } = body

    const { db } = await connectToDatabase()
    const assignments = db.collection('volunteer_assignments')

    const updateData: any = { status }

    if (status === 'ACCEPTED') {
      updateData.volunteerId = volunteerId
      updateData.acceptedAt = new Date()
    }

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date()
    }

    const result = await assignments.updateOne(
      { _id: new ObjectId(assignmentId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return Response.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return Response.json({ success: true, status })
  } catch (error) {
    console.error('Error updating assignment:', error)
    return Response.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}
