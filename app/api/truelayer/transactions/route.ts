import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: connection } = await supabaseAdmin
    .from('bank_connections')
    .select('access_token')
    .eq('user_id', userId)
    .single()

  if (!connection) {
    return NextResponse.json({ error: 'No bank connected' }, { status: 404 })
  }

  const accountsRes = await fetch('https://api.truelayer-sandbox.com/data/v1/accounts', {
    headers: { Authorization: `Bearer ${connection.access_token}` },
  })
  const accountsData = await accountsRes.json()

  if (!accountsData.results?.length) {
    return NextResponse.json({ transactions: [] })
  }

  const accountId = accountsData.results[0].account_id

  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const to = new Date().toISOString().split('T')[0]

  const txRes = await fetch(
    `https://api.truelayer-sandbox.com/data/v1/accounts/${accountId}/transactions?from=${from}&to=${to}`,
    { headers: { Authorization: `Bearer ${connection.access_token}` } }
  )
  const txData = await txRes.json()

  const incoming = (txData.results || []).filter((tx: any) => tx.amount > 0)

  return NextResponse.json({ transactions: incoming, account_id: accountId })
}
