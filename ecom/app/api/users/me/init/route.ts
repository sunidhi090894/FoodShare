import { NextRequest, NextResponse } from 'next/server'
// import { withAuth } from '@/lib/server-auth' (removed)
// import { UserProfileInput } from '@/lib/users' (removed initOrUpdateUserProfile)

export const dynamic = 'force-dynamic'

// TODO: Implement authentication middleware or logic here
export const POST = async (req: NextRequest) => {
  let payload = {}

  try {
    if (req.headers.get('content-type')?.includes('application/json')) {
      payload = await req.json()
    }
  } catch (err) {
    console.error('/api/users/me/init: Failed to parse JSON body', err)
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
  // Authentication removed. Cannot create/update user profile without user context.
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  } catch (err: any) {
    console.error('/api/users/me/init: initOrUpdateUserProfile failed', { message: err?.message, error: err })
    return NextResponse.json({ error: err?.message || 'Failed to initialize user profile' }, { status: 500 })
  }

}
