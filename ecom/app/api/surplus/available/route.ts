import { NextRequest, NextResponse } from 'next/server'
import { listOpenSurplusOffers } from '@/lib/surplus-offers'
import { getUserDocumentById } from '@/lib/users'
import { getOrganizationById } from '@/lib/organizations'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const GET = async (req: NextRequest) => {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserDocumentById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get recipient's organization city
    let city: string | undefined
    if (user.organizationId) {
      const org = await getOrganizationById(user.organizationId)
      if (org) {
        city = org.city
        console.log(`📍 Filtering available surplus for city: ${city}`)
      }
    }

    const queryCity = req.nextUrl.searchParams.get('city') || city
    const offers = await listOpenSurplusOffers(queryCity ? { city: queryCity } : undefined)
    
    console.log(`📦 Found ${offers.length} available surplus offers${queryCity ? ` in city ${queryCity}` : ''}`)
    
    const response = NextResponse.json(offers)
    // Disable caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error listing available surplus offers', error)
    const message = error instanceof Error ? error.message : 'Unable to list offers'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
