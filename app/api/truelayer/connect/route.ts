import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.TRUELAYER_CLIENT_ID!,
    scope: 'info accounts balance transactions',
    redirect_uri: process.env.NEXT_PUBLIC_TRUELAYER_REDIRECT_URI!,
    providers: 'mock',
    state: userId,
  })

  const authUrl = `https://auth.truelayer-sandbox.com/?${params.toString()}`
  return NextResponse.redirect(authUrl)
}
