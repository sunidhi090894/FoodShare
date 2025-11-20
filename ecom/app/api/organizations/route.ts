import { NextRequest, NextResponse } from 'next/server'
import { createOrganizationForUser, type OrganizationPayload } from '@/lib/organizations'
import { getUserDocumentById } from '@/lib/users'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export const POST = async (req: NextRequest) => {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Creating organization for user:', userId)

    const user = await getUserDocumentById(userId)
    if (!user) {
      console.log('❌ User not found:', userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.organizationId) {
      console.log('❌ User already has organization:', user.organizationId.toHexString())
      return NextResponse.json({ error: 'User already belongs to an organization' }, { status: 400 })
    }

    const body = (await req.json()) as OrganizationPayload
    console.log('📦 Organization data:', body)
    
    const newOrganization = await createOrganizationForUser(user, body)

    console.log('✅ Organization created:', newOrganization.id)
    console.log('   Organization name:', newOrganization.name)
    console.log('   City:', newOrganization.city)
    
    // Verify user was updated
    const updatedUser = await getUserDocumentById(userId)
    console.log('👤 User organization link after creation:', updatedUser?.organizationId?.toHexString())
    console.log('   User organization name field:', (updatedUser as any)?.organization)

    return NextResponse.json(newOrganization, { status: 201 })
  } catch (error) {
    console.error('❌ Organization creation error:', error)
    const isSyntaxError = error instanceof SyntaxError
    const status = isSyntaxError ? 400 : 500
    const message = isSyntaxError
      ? 'Invalid JSON payload'
      : error instanceof Error
        ? error.message
        : 'Unable to create organization'
    return NextResponse.json({ error: message }, { status })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Use /api/organizations/mine for listing' }, { status: 405 })
}
