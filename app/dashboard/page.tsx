'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, Lock, Unlock, AlertTriangle, LogOut, Landmark, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { supabase, Vault } from '@/lib/supabase'
import { formatCurrency, getTotalLocked, getCategoryEmoji, getCountdownText, isUnlockable } from '@/lib/utils'

type Transaction = {
  transaction_id: string
  amount: number
  currency: string
  timestamp: string
  description: string
}

export default function DashboardPage() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const searchParams = useSearchParams()
  const [vaults, setVaults] = useState<Vault[]>([])
  const [loading, setLoading] = useState(true)
  const [unlockingId, setUnlockingId] = useState<string | null>(null)
  const [emergencyId, setEmergencyId] = useState<string | null>(null)
  const [emergencyCountdown, setEmergencyCountdown] = useState(0)
  const [bankConnected, setBankConnected] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTx, setLoadingTx] = useState(false)
  const [showTx, setShowTx] = useState(false)
  const [justConnected, setJustConnected] = useState(false)

  useEffect(() => {
    if (user) {
      fetchVaults()
      checkBankConnection()
    }
  }, [user])

  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      setJustConnected(true)
      setBankConnected(true)
      setTimeout(() => setJustConnected(false), 4000)
    }
  }, [searchParams])

  useEffect(() => {
    if (emergencyCountdown > 0) {
      const timer = setTimeout(() => setEmergencyCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [emergencyCountdown])

  async function checkBankConnection() {
    const { data } = await supabase
      .from('bank_connections')
      .select('id')
      .eq('user_id', user!.id)
      .single()
    setBankConnected(!!data)
  }

  async function fetchVaults() {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('vaults')
      .select('*')
      .eq('user_id', user.id)
      .order('unlock_date', { ascending: true })
    if (!error && data) setVaults(data)
    setLoading(false)
  }

  async function fetchTransactions() {
    setLoadingTx(true)
    setShowTx(true)
    const res = await fetch('/api/truelayer/transactions')
    const data = await res.json()
    if (data.transactions) setTransactions(data.transactions)
    setLoadingTx(false)
  }

  async function unlockVault(vaultId: string) {
    const { error } = await supabase
      .from('vaults')
      .update({ status: 'unlocked', unlocked_at: new Date().toISOString() })
      .eq('id', vaultId)
    if (!error) {
      setUnlockingId(null)
      fetchVaults()
    }
  }

  async function triggerEmergency(vaultId: string) {
    if (emergencyId === vaultId) {
      if (emergencyCountdown > 0) return
      const { error } = await supabase
        .from('vaults')
        .update({ status: 'emergency', unlocked_at: new Date().toISOString() })
        .eq('id', vaultId)
      if (!error) {
        setEmergencyId(null)
        setEmergencyCountdown(0)
        fetchVaults()
      }
    } else {
      setEmergencyId(vaultId)
      setEmergencyCountdown(60)
    }
  }

  const lockedVaults = vaults.filter(v => v.status === 'locked')
  const unlockedVaults = vaults.filter(v => v.status !== 'locked')
  const totalLocked = getTotalLocked(vaults)

  return (
    <main className="min-h-screen noise" style={{ background: 'var(--ink)' }}>
      <div className="fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(var(--muted) 1px, transparent 1px), linear-gradient(90deg, var(--muted) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-8">

        {/* Header */}
        <header className="flex items-center justify-between mb-10 animate-fade-in">
          <div>
            <h1 className="text-3xl font-800 tracking-tight" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              hide.
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>
              {user?.firstName ? `olá, ${user.firstName.toLowerCase()}` : 'os teus cofres'}
            </p>
          </div>
          <button onClick={() => signOut()} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--ghost)' }}>
            <LogOut size={16} />
          </button>
        </header>

        {/* Just connected banner */}
        {justConnected && (
          <div className="rounded-xl px-4 py-3 mb-4 animate-fade-in flex items-center gap-2 text-sm"
            style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: 'var(--accent)', fontFamily: 'var(--font-body)' }}>
            ✓ Banco conectado com sucesso
          </div>
        )}

        {/* Total locked */}
        <div className="rounded-2xl p-6 mb-4 animate-slide-up"
          style={{ background: 'var(--locked)', border: '1px solid rgba(74,222,128,0.1)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>total bloqueado</p>
          <p className="text-4xl font-800 countdown" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)' }}>
            {formatCurrency(totalLocked)}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
            {lockedVaults.length} cofre{lockedVaults.length !== 1 ? 's' : ''} activo{lockedVaults.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Bank connection card */}
        <div className="rounded-2xl p-4 mb-6 animate-slide-up"
          style={{
            background: 'var(--locked)',
            border: bankConnected ? '1px solid rgba(74,222,128,0.15)' : '1px solid var(--muted)',
            animationDelay: '80ms', opacity: 0
          }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: bankConnected ? 'rgba(74,222,128,0.1)' : 'rgba(107,107,154,0.1)' }}>
                <Landmark size={15} style={{ color: bankConnected ? 'var(--accent)' : 'var(--ghost)' }} />
              </div>
              <div>
                <p className="text-sm font-600" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                  {bankConnected ? 'Banco conectado' : 'Conectar banco'}
                </p>
                <p className="text-xs" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>
                  {bankConnected ? 'Detecção automática de salário ativa' : 'Deteta o salário e bloqueia automaticamente'}
                </p>
              </div>
            </div>
            {bankConnected ? (
              <button
                onClick={fetchTransactions}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--accent)', fontFamily: 'var(--font-body)', border: '1px solid rgba(74,222,128,0.2)' }}
              >
                <RefreshCw size={11} />
                ver entradas
              </button>
            ) : (
              <a href="/api/truelayer/connect"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{ background: 'var(--accent)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                conectar
              </a>
            )}
          </div>

          {/* Transactions panel */}
          {showTx && bankConnected && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--muted)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>
                  entradas nos últimos 30 dias
                </p>
                <button onClick={() => setShowTx(false)} style={{ color: 'var(--muted)' }}>
                  <ChevronUp size={14} />
                </button>
              </div>
              {loadingTx ? (
                <p className="text-xs" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>a carregar...</p>
              ) : transactions.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>nenhuma entrada encontrada</p>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 5).map(tx => (
                    <div key={tx.transaction_id} className="flex items-center justify-between py-2 rounded-lg px-3"
                      style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.08)' }}>
                      <div>
                        <p className="text-xs" style={{ fontFamily: 'var(--font-body)', color: '#E8E8F0' }}>
                          {tx.description || 'Transferência recebida'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>
                          {new Date(tx.timestamp).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                      <p className="text-sm font-600" style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                        +{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vaults list */}
        {loading ? (
          <div className="text-center py-16" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)', fontSize: '0.875rem' }}>
            a carregar...
          </div>
        ) : lockedVaults.length === 0 && unlockedVaults.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-5xl mb-4">🔐</div>
            <p className="text-sm mb-6" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>
              Nenhum cofre ainda.<br />Cria o primeiro agora.
            </p>
            <Link href="/vault/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-600 transition-all hover:scale-105"
              style={{ background: 'var(--accent)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
              <Plus size={16} />
              Criar cofre
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {lockedVaults.map((vault, i) => {
              const unlockable = isUnlockable(vault)
              const isEmergency = emergencyId === vault.id
              const countdown = getCountdownText(vault.unlock_date)

              return (
                <div key={vault.id}
                  className={`rounded-2xl p-5 animate-slide-up ${unlockable ? 'vault-warn' : 'vault-glow'}`}
                  style={{ background: 'var(--locked)', animationDelay: `${i * 80}ms`, opacity: 0 }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCategoryEmoji(vault.category)}</span>
                      <div>
                        <h3 className="font-700 text-sm" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                          {vault.name}
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>
                          libera em {new Date(vault.unlock_date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-700 text-sm countdown" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                        {(vault as any).amount_type === 'percent'
                          ? `${vault.amount}%`
                          : formatCurrency(vault.amount, vault.currency)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${unlockable ? 'badge-unlocked' : 'badge-locked'}`}>
                        {unlockable ? 'pronto' : 'bloqueado'}
                      </span>
                    </div>
                  </div>

                  {!unlockable && (
                    <div className="mb-4">
                      <p className="text-xs font-600 countdown" style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
                        {countdown}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {unlockable && (
                      unlockingId === vault.id ? (
                        <div className="flex gap-2 w-full">
                          <button onClick={() => unlockVault(vault.id)}
                            className="flex-1 py-2 rounded-xl text-xs font-600 transition-all"
                            style={{ background: 'var(--warn)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                            confirmar liberação
                          </button>
                          <button onClick={() => setUnlockingId(null)}
                            className="px-4 py-2 rounded-xl text-xs transition-all"
                            style={{ background: 'var(--muted)', color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>
                            cancelar
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setUnlockingId(vault.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-600 transition-all"
                          style={{ background: 'rgba(250,204,21,0.15)', color: 'var(--warn)', fontFamily: 'var(--font-body)', fontWeight: 600, border: '1px solid rgba(250,204,21,0.2)' }}>
                          <Unlock size={12} />
                          liberar
                        </button>
                      )
                    )}

                    {!unlockable && (
                      isEmergency ? (
                        <button onClick={() => triggerEmergency(vault.id)} disabled={emergencyCountdown > 0}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all"
                          style={{
                            background: emergencyCountdown > 0 ? 'rgba(248,113,113,0.05)' : 'rgba(248,113,113,0.15)',
                            color: 'var(--danger)', fontFamily: 'var(--font-body)', border: '1px solid rgba(248,113,113,0.2)',
                            cursor: emergencyCountdown > 0 ? 'not-allowed' : 'pointer'
                          }}>
                          <AlertTriangle size={12} />
                          {emergencyCountdown > 0 ? `aguarda ${emergencyCountdown}s...` : 'confirmar emergência'}
                        </button>
                      ) : (
                        <button onClick={() => triggerEmergency(vault.id)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all"
                          style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', border: '1px solid var(--muted)' }}>
                          <AlertTriangle size={12} />
                          emergência
                        </button>
                      )
                    )}
                  </div>

                  {isEmergency && emergencyCountdown > 0 && (
                    <p className="text-xs mt-3 p-3 rounded-xl"
                      style={{ background: 'rgba(248,113,113,0.05)', color: 'var(--danger)', fontFamily: 'var(--font-body)', border: '1px solid rgba(248,113,113,0.1)' }}>
                      ⚠️ Isto é para o teu {vault.name.toLowerCase()}. Tens a certeza absoluta? Aguarda {emergencyCountdown} segundos antes de confirmar.
                    </p>
                  )}
                </div>
              )
            })}

            {unlockedVaults.length > 0 && (
              <div className="mt-8">
                <p className="text-xs mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>histórico</p>
                {unlockedVaults.map((vault) => (
                  <div key={vault.id} className="rounded-2xl p-4 mb-2 opacity-50"
                    style={{ background: 'var(--vault)', border: '1px solid var(--muted)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span>{getCategoryEmoji(vault.category)}</span>
                        <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>{vault.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>{formatCurrency(vault.amount)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${vault.status === 'emergency' ? 'badge-emergency' : 'badge-unlocked'}`}>
                          {vault.status === 'emergency' ? 'emergência' : 'liberado'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(lockedVaults.length > 0 || unlockedVaults.length > 0) && (
          <Link href="/vault/new"
            className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-4 rounded-2xl text-sm font-600 shadow-lg transition-all hover:scale-105 animate-fade-in"
            style={{
              background: 'var(--accent)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 600,
              boxShadow: '0 8px 32px rgba(74,222,128,0.25)'
            }}>
            <Plus size={18} />
            novo cofre
          </Link>
        )}
      </div>
    </main>
  )
}
