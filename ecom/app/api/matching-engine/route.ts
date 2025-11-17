import { getCollection } from '@/lib/mongodb'
import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

// AI-powered matching algorithm considering distance, timing, and recipient needs
async function calculateMatchScore(surplus: any, recipient: any) {
  // Distance score (closer is better)
  const dx = surplus.latitude - recipient.latitude
  const dy = surplus.longitude - recipient.longitude
  const distance = Math.sqrt(dx * dx + dy * dy)
  const distanceScore = Math.max(0, 100 - distance * 10)

  // Timing score (more time is better)
  const timeUntilExpiry = new Date(surplus.expiryTime).getTime() - Date.now()
  const hoursRemaining = timeUntilExpiry / (1000 * 60 * 60)
  const timingScore = Math.min(100, hoursRemaining * 5)

  // Quantity match score
  const quantityScore = surplus.quantity >= 10 ? 100 : (surplus.quantity / 10) * 100

  // Combined score (weighted average)
  const totalScore = (distanceScore * 0.4 + timingScore * 0.3 + quantityScore * 0.3)
  
  return Math.round(totalScore)
}

export async function POST(request: NextRequest) {
  try {
    const { surplusId } = await request.json()
    const surplusCol = await getCollection('surplus_offers')
    const recipientCol = await getCollection('organizations')

    const surplus = await surplusCol.findOne({ _id: new ObjectId(surplusId) })
    if (!surplus) {
      return NextResponse.json({ error: 'Surplus not found' }, { status: 404 })
    }

    // Find all potential recipients
    const recipients = await recipientCol.find({}).toArray()

    // Calculate match scores for each recipient
    const matches = await Promise.all(
      recipients.map(async (recipient) => {
        const score = await calculateMatchScore(surplus, recipient)
        return { recipient, score }
      })
    )

    // Sort by score and return top 5
    const topMatches = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    return NextResponse.json(topMatches)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
