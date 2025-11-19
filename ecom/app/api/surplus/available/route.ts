import { NextRequest, NextResponse } from 'next/server'
import { listOpenSurplusOffers } from '@/lib/surplus-offers'
import { getUserDocumentById } from '@/lib/users'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

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

    const city = req.nextUrl.searchParams.get('city') || undefined
    const offers = await listOpenSurplusOffers(city ? { city } : undefined)
    return NextResponse.json(offers)
  } catch (error) {
    console.error('Error listing available surplus offers', error)
    const message = error instanceof Error ? error.message : 'Unable to list offers'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
