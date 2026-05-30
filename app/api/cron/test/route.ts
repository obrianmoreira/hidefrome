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

  if (!connection) return NextResponse.json({ error: 'No bank connected' })

  const { data: vaults } = await supabaseAdmin
    .from('vaults')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'locked')
    .not('trigger_threshold', 'is', null)

  if (!vaults?.length) return NextResponse.json({ error: 'No vaults with triggers', tip: 'Cria um cofre com bloqueio automático ativado' })

  const accountsRes = await fetch('https://api.truelayer.com/data/v1/accounts', {
    headers: { Authorization: `Bearer ${connection.access_token}` },
  })
  const accountsData = await accountsRes.json()

  if (!accountsData.results?.length) return NextResponse.json({ error: 'No accounts', raw: accountsData })

  const accountId = accountsData.results[0].account_id

  const txRes = await fetch(
    `https://api.truelayer.com/data/v1/accounts/${accountId}/transactions`,
    { headers: { Authorization: `Bearer ${connection.access_token}` } }
  )
  const txData = await txRes.json()
  const incoming = (txData.results || []).filter((tx: any) => tx.amount > 0)

  let created = 0
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
        user_id: userId,
        vault_id: vault.id,
        type: 'auto_block_proposal',
        amount: blockAmount,
        incoming_amount: tx.amount,
        status: 'pending',
        transaction_id: tx.transaction_id,
      })
      created++
    }
  }

  return NextResponse.json({
    vaults_with_triggers: vaults.length,
    incoming_transactions: incoming.length,
    notifications_created: created,
    message: created > 0 ? 'Abre o dashboard para ver as notificações!' : 'Nenhuma transação acima do threshold'
  })
}
