import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: connection } = await supabaseAdmin
    .from('bank_connections')
    .select('access_token')
    .eq('user_id', userId)
    .single()

  if (!connection) return NextResponse.json({ error: 'No connection found' })

  // Get accounts
  const accountsRes = await fetch('https://api.truelayer.com/data/v1/accounts', {
    headers: { Authorization: `Bearer ${connection.access_token}` },
  })
  const accountsData = await accountsRes.json()

  if (!accountsData.results?.length) {
    return NextResponse.json({ error: 'No accounts', accountsData })
  }

  const accountId = accountsData.results[0].account_id

  // Get ALL transactions without date filter
  const txRes = await fetch(
    `https://api.truelayer.com/data/v1/accounts/${accountId}/transactions`,
    { headers: { Authorization: `Bearer ${connection.access_token}` } }
  )
  const txData = await txRes.json()

  return NextResponse.json({
    accounts: accountsData.results,
    transactions_raw: txData,
    total: txData.results?.length || 0
  })
}
