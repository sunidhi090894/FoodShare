
import { NextRequest, NextResponse } from 'next/server'

export const GET = async (_req: NextRequest) => {
  // All user/auth logic removed
  return NextResponse.json([])
}

export const PATCH = async (_req: NextRequest) => {
  // All user/auth logic removed
  return NextResponse.json({ success: true })
}
