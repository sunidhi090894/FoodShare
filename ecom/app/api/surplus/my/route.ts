import { NextRequest, NextResponse } from 'next/server'
import { listSurplusOffersForUser, SURPLUS_STATUSES, type SurplusStatus } from '@/lib/surplus-offers'
import { getUserDocumentById } from '@/lib/users'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const GET = async (req: NextRequest) => {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    if (!userId) {
      console.log('⚠️  No userId in cookie')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📖 Fetching offers for user:', userId)

    const user = await getUserDocumentById(userId)
    if (!user) {
      console.log('⚠️  User not found for ID:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('   User role:', user.role)
    console.log('   User _id (ObjectId):', user._id)

    const statusParam = req.nextUrl.searchParams.get('status')?.toUpperCase() as SurplusStatus | undefined
    const status = statusParam && SURPLUS_STATUSES.includes(statusParam) ? statusParam : undefined

    const offers = await listSurplusOffersForUser(new ObjectId(userId), status)
    
    console.log(`✅ Found ${offers.length} offers for user ${userId}`)
    
    const response = NextResponse.json(offers)
    // Disable caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('❌ Error listing surplus offers', error)
    const message = error instanceof Error ? error.message : 'Unable to list offers'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
