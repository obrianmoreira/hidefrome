import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')

  if (!code || !userId) {
    return NextResponse.redirect('/dashboard?error=missing_params')
  }

  // Exchange code for tokens
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
    return NextResponse.redirect('/dashboard?error=token_failed')
  }

  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

  // Save tokens to Supabase
  await supabaseAdmin
    .from('bank_connections')
    .upsert({
      user_id: userId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      provider: 'truelayer',
    }, { onConflict: 'user_id' })

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_TRUELAYER_REDIRECT_URI!.replace('/api/truelayer/callback', '')}/dashboard?connected=true`)
}
