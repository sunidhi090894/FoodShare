import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getUserById } from '@/lib/auth'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await getUserById(userId)

    if (!user) {
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

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('GET /api/users/me failed:', error)
    return NextResponse.json({ error: 'Failed to load user profile' }, { status: 500 })
  }
}
