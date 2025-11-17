import { registerUser } from '@/lib/auth'
import { initializeDatabase } from '@/lib/mongodb'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()
    const { email, password, role, name } = await request.json()

    if (!email || !password || !role || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await registerUser(email, password, role, name)
    const response = NextResponse.json(user, { status: 201 })
    response.cookies.set('userId', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
