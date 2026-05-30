'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Plus, Lock, Unlock, AlertTriangle, LogOut } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { supabase, Vault } from '@/lib/supabase'
import { formatCurrency, getTotalLocked, getCategoryEmoji, getCountdownText, isUnlockable } from '@/lib/utils'

export default function DashboardPage() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [vaults, setVaults] = useState<Vault[]>([])
  const [loading, setLoading] = useState(true)
  const [unlockingId, setUnlockingId] = useState<string | null>(null)
  const [emergencyId, setEmergencyId] = useState<string | null>(null)
  const [emergencyCountdown, setEmergencyCountdown] = useState(0)

  useEffect(() => {
    if (user) fetchVaults()
  }, [user])

  // Emergency countdown timer
  useEffect(() => {
    if (emergencyCountdown > 0) {
      const timer = setTimeout(() => setEmergencyCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [emergencyCountdown])

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
      // Cooldown passed — actually unlock
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
      setEmergencyCountdown(60) // 60 second cooldown
    }
  }

  const lockedVaults = vaults.filter(v => v.status === 'locked')
  const unlockedVaults = vaults.filter(v => v.status !== 'locked')
  const totalLocked = getTotalLocked(vaults)

  return (
    <main className="min-h-screen noise" style={{ background: 'var(--ink)' }}>
      {/* Fixed background grid */}
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
          <button
            onClick={() => signOut()}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--ghost)' }}
          >
            <LogOut size={16} />
          </button>
        </header>

        {/* Total locked */}
        <div className="rounded-2xl p-6 mb-6 animate-slide-up"
          style={{ background: 'var(--locked)', border: '1px solid rgba(74,222,128,0.1)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>
            total bloqueado
          </p>
          <p className="text-4xl font-800 countdown" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)' }}>
            {formatCurrency(totalLocked)}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
            {lockedVaults.length} cofre{lockedVaults.length !== 1 ? 's' : ''} activo{lockedVaults.length !== 1 ? 's' : ''}
          </p>
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
            {/* Active locked vaults */}
            {lockedVaults.map((vault, i) => {
              const unlockable = isUnlockable(vault)
              const isEmergency = emergencyId === vault.id
              const countdown = getCountdownText(vault.unlock_date)

              return (
                <div
                  key={vault.id}
                  className={`rounded-2xl p-5 animate-slide-up ${unlockable ? 'vault-warn' : 'vault-glow'}`}
                  style={{
                    background: 'var(--locked)',
                    animationDelay: `${i * 80}ms`,
                    opacity: 0
                  }}
                >
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
                        {formatCurrency(vault.amount, vault.currency)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${unlockable ? 'badge-unlocked' : 'badge-locked'}`}>
                        {unlockable ? 'pronto' : 'bloqueado'}
                      </span>
                    </div>
                  </div>

                  {/* Countdown bar */}
                  {!unlockable && (
                    <div className="mb-4">
                      <p className="text-xs font-600 countdown" style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
                        {countdown}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {unlockable && (
                      unlockingId === vault.id ? (
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => unlockVault(vault.id)}
                            className="flex-1 py-2 rounded-xl text-xs font-600 transition-all"
                            style={{ background: 'var(--warn)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 600 }}
                          >
                            confirmar liberação
                          </button>
                          <button
                            onClick={() => setUnlockingId(null)}
                            className="px-4 py-2 rounded-xl text-xs transition-all"
                            style={{ background: 'var(--muted)', color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}
                          >
                            cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setUnlockingId(vault.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-600 transition-all"
                          style={{ background: 'rgba(250,204,21,0.15)', color: 'var(--warn)', fontFamily: 'var(--font-body)', fontWeight: 600, border: '1px solid rgba(250,204,21,0.2)' }}
                        >
                          <Unlock size={12} />
                          liberar
                        </button>
                      )
                    )}

                    {/* Emergency button */}
                    {!unlockable && (
                      isEmergency ? (
                        <button
                          onClick={() => triggerEmergency(vault.id)}
                          disabled={emergencyCountdown > 0}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all"
                          style={{
                            background: emergencyCountdown > 0 ? 'rgba(248,113,113,0.05)' : 'rgba(248,113,113,0.15)',
                            color: 'var(--danger)',
                            fontFamily: 'var(--font-body)',
                            border: '1px solid rgba(248,113,113,0.2)',
                            cursor: emergencyCountdown > 0 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <AlertTriangle size={12} />
                          {emergencyCountdown > 0 ? `aguarda ${emergencyCountdown}s...` : 'confirmar emergência'}
                        </button>
                      ) : (
                        <button
                          onClick={() => triggerEmergency(vault.id)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all"
                          style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', border: '1px solid var(--muted)' }}
                        >
                          <AlertTriangle size={12} />
                          emergência
                        </button>
                      )
                    )}
                  </div>

                  {/* Emergency warning message */}
                  {isEmergency && emergencyCountdown > 0 && (
                    <p className="text-xs mt-3 p-3 rounded-xl" style={{ background: 'rgba(248,113,113,0.05)', color: 'var(--danger)', fontFamily: 'var(--font-body)', border: '1px solid rgba(248,113,113,0.1)' }}>
                      ⚠️ Isto é para o teu {vault.name.toLowerCase()}. Tens a certeza absoluta? Aguarda {emergencyCountdown} segundos antes de confirmar.
                    </p>
                  )}
                </div>
              )
            })}

            {/* Unlocked vaults */}
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

        {/* FAB */}
        {(lockedVaults.length > 0 || unlockedVaults.length > 0) && (
          <Link href="/vault/new"
            className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-4 rounded-2xl text-sm font-600 shadow-lg transition-all hover:scale-105 animate-fade-in"
            style={{
              background: 'var(--accent)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
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
