import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: connections } = await supabaseAdmin
    .from('bank_connections')
    .select('user_id, access_token')

  if (!connections?.length) {
    return NextResponse.json({ message: 'No connections', processed: 0 })
  }

  let processed = 0

  for (const connection of connections) {
    try {
      const { data: vaults } = await supabaseAdmin
        .from('vaults')
        .select('*')
        .eq('user_id', connection.user_id)
        .eq('status', 'locked')
        .not('trigger_threshold', 'is', null)
        .not('trigger_percent', 'is', null)

      if (!vaults?.length) continue

      const accountsRes = await fetch('https://api.truelayer-sandbox.com/data/v1/accounts', {
        headers: { Authorization: `Bearer ${connection.access_token}` },
      })
      const accountsData = await accountsRes.json()
      if (!accountsData.results?.length) continue

      const accountId = accountsData.results[0].account_id

      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const to = new Date().toISOString().split('T')[0]

      const txRes = await fetch(
        `https://api.truelayer-sandbox.com/data/v1/accounts/${accountId}/transactions?from=${from}&to=${to}`,
        { headers: { Authorization: `Bearer ${connection.access_token}` } }
      )
      const txData = await txRes.json()

      const incoming = (txData.results || []).filter((tx: any) => tx.amount > 0)

      for (const tx of incoming) {
        for (const vault of vaults) {
          if (tx.amount < vault.trigger_threshold) continue

          const { data: existing } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('vault_id', vault.id)
            .eq('transaction_id', tx.transaction_id)
            .single()

          if (existing) continue

          const blockAmount = Math.round((tx.amount * vault.trigger_percent) / 100 * 100) / 100

          await supabaseAdmin.from('notifications').insert({
            user_id: connection.user_id,
            vault_id: vault.id,
            type: 'auto_block_proposal',
            amount: blockAmount,
            incoming_amount: tx.amount,
            status: 'pending',
            transaction_id: tx.transaction_id,
          })

          processed++
        }
      }
    } catch (err) {
      console.error('[cron] error for user', connection.user_id, err)
    }
  }

  return NextResponse.json({ message: 'Done', processed })
}
