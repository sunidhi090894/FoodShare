import { registerOrLoginSocialUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, name, role, firebaseId } = await request.json()

    if (!email || !name || !role || !firebaseId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // This function handles both registration and login in MongoDB
    const user = await registerOrLoginSocialUser(email, name, role, firebaseId)
    
    // Set the secure cookie as a successful login
    const response = NextResponse.json(user)
    response.cookies.set('userId', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}