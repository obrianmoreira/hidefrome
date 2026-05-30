import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${host}`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')
  const baseUrl = getBaseUrl(req)

  if (!code || !userId) {
    return NextResponse.redirect(`${baseUrl}/dashboard?error=missing_params`)
  }

  const tokenRes = await fetch('https://auth.truelayer-sandbox.com/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.TRUELAYER_CLIENT_ID!,
      client_secret: process.env.TRUELAYER_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.NEXT_PUBLIC_TRUELAYER_REDIRECT_URI!,
    }),
  })

  const tokenData = await tokenRes.json()

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${baseUrl}/dashboard?error=token_failed`)
  }

  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

  await supabaseAdmin
    .from('bank_connections')
    .upsert({
      user_id: userId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      expires_at: expiresAt,
      provider: 'truelayer',
    }, { onConflict: 'user_id' })

  return NextResponse.redirect(`${baseUrl}/dashboard?connected=true`)
}
