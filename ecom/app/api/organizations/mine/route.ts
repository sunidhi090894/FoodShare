import { NextRequest, NextResponse } from 'next/server'


export const dynamic = 'force-dynamic'

export const GET = async (_req: NextRequest) => {
  // All user/auth logic removed
  return NextResponse.json([])
}
