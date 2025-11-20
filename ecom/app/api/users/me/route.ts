import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getUserById } from '@/lib/auth'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    console.log('📖 [GET /api/users/me] userId from cookie:', userId)

    if (!userId) {
      console.log('📖 [GET /api/users/me] ✗ No userId in cookie')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await getUserById(userId)
    console.log('📖 [GET /api/users/me] ✓ User fetched from DB')
    console.log('   - User._id:', (user as any)?._id?.toString?.())
    console.log('   - User.email:', (user as any)?.email)
    console.log('   - User.organizationId:', (user as any)?.organizationId?.toString?.() || (user as any)?.organizationId)
    console.log('   - User.organization:', (user as any)?.organization)

    if (!user) {
      console.log('📖 [GET /api/users/me] ✗ User not found in database')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { _id, password, ...rest } = user as Record<string, any>

    const organizationId =
      typeof rest.organizationId === 'string'
        ? rest.organizationId
        : rest.organizationId?.toString?.() ?? null

    const createdAt =
      rest.createdAt instanceof Date
        ? rest.createdAt.toISOString()
        : rest.createdAt ?? null

    const updatedAt =
      rest.updatedAt instanceof Date
        ? rest.updatedAt.toISOString()
        : rest.updatedAt ?? null

    const response = {
      id: _id?.toString(),
      email: rest.email ?? null,
      name: rest.name ?? null,
      role: rest.role ?? 'DONOR',
      organization: rest.organization ?? null,
      organizationId,
      phone: rest.phone ?? null,
      verified: rest.verified ?? false,
      active: rest.active ?? false,
      location: rest.location ?? null,
      availability: rest.availability ?? null,
      createdAt,
      updatedAt,
    }

    console.log('📖 [GET /api/users/me] ✓ Returning user response:')
    console.log('   - organization:', response.organization)
    console.log('   - organizationId:', response.organizationId)

    return NextResponse.json(response)
  } catch (error) {
    console.error('📖 [GET /api/users/me] ✗ Failed:', error)
    return NextResponse.json({ error: 'Failed to load user profile' }, { status: 500 })
  }
}
