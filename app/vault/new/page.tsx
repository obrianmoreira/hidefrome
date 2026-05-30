'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'

const CATEGORIES = [
  { value: 'rent', label: 'Renda / Aluguel', emoji: '🏠' },
  { value: 'tax', label: 'Impostos / IVA', emoji: '📋' },
  { value: 'salary', label: 'Salários', emoji: '💼' },
  { value: 'savings', label: 'Poupança', emoji: '💰' },
  { value: 'emergency', label: 'Fundo de emergência', emoji: '🚨' },
  { value: 'other', label: 'Outro', emoji: '📦' },
]

export default function NewVaultPage() {
  const { user } = useUser()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    amount: '',
    unlock_date: '',
    category: 'rent',
    notes: '',
  })

  const amountNum = parseFloat(form.amount) || 0

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit() {
    if (!user || !form.name || !form.amount || !form.unlock_date) return
    setSaving(true)

    const { error } = await supabase.from('vaults').insert({
      user_id: user.id,
      name: form.name,
      amount: amountNum,
      currency: 'EUR',
      unlock_date: form.unlock_date,
      category: form.category,
      notes: form.notes,
      status: 'locked',
    })

    if (!error) {
      router.push('/dashboard')
    } else {
      console.error(error)
      setSaving(false)
    }
  }

  const isValid = form.name && amountNum > 0 && form.unlock_date

  return (
    <main className="min-h-screen noise" style={{ background: 'var(--ink)' }}>
      <div className="fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(var(--muted) 1px, transparent 1px), linear-gradient(90deg, var(--muted) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto px-5 py-8">
        {/* Back */}
        <Link href="/dashboard"
          className="inline-flex items-center gap-2 mb-8 text-sm transition-colors"
          style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>
          <ArrowLeft size={16} />
          voltar
        </Link>

        <h1 className="text-3xl font-800 mb-2 animate-slide-up" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
          novo cofre
        </h1>
        <p className="text-sm mb-8 animate-slide-up" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)', animationDelay: '50ms', opacity: 0 }}>
          Define o que queres guardar e quando precisas dele.
        </p>

        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '100ms', opacity: 0 }}>

          {/* Name */}
          <div>
            <label className="block text-xs mb-2" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>
              nome do cofre
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="ex: Renda de junho"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'var(--locked)',
                border: '1px solid var(--muted)',
                color: '#E8E8F0',
                fontFamily: 'var(--font-body)',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.4)'}
              onBlur={e => e.target.style.borderColor = 'var(--muted)'}
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs mb-2" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>
              valor (€)
            </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'var(--locked)',
                border: '1px solid var(--muted)',
                color: '#E8E8F0',
                fontFamily: 'var(--font-body)',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.4)'}
              onBlur={e => e.target.style.borderColor = 'var(--muted)'}
            />
            {amountNum > 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}>
                {formatCurrency(amountNum)} bloqueados
              </p>
            )}
          </div>

          {/* Unlock date */}
          <div>
            <label className="block text-xs mb-2" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>
              data de liberação
            </label>
            <input
              type="date"
              name="unlock_date"
              value={form.unlock_date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'var(--locked)',
                border: '1px solid var(--muted)',
                color: '#E8E8F0',
                fontFamily: 'var(--font-body)',
                colorScheme: 'dark',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.4)'}
              onBlur={e => e.target.style.borderColor = 'var(--muted)'}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs mb-2" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>
              categoria
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setForm(prev => ({ ...prev, category: cat.value }))}
                  className="px-3 py-3 rounded-xl text-xs transition-all text-center"
                  style={{
                    background: form.category === cat.value ? 'rgba(74,222,128,0.1)' : 'var(--locked)',
                    border: form.category === cat.value ? '1px solid rgba(74,222,128,0.3)' : '1px solid var(--muted)',
                    color: form.category === cat.value ? 'var(--accent)' : 'var(--ghost)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <div className="text-lg mb-1">{cat.emoji}</div>
                  <div className="leading-tight" style={{ fontSize: '0.65rem' }}>{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs mb-2" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>
              nota (opcional)
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="ex: Renda do apartamento, 1º andar"
              rows={2}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
              style={{
                background: 'var(--locked)',
                border: '1px solid var(--muted)',
                color: '#E8E8F0',
                fontFamily: 'var(--font-body)',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.4)'}
              onBlur={e => e.target.style.borderColor = 'var(--muted)'}
            />
          </div>

          {/* Preview */}
          {isValid && (
            <div className="p-4 rounded-xl animate-fade-in"
              style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>resumo</p>
              <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                <span style={{ color: 'var(--accent)' }}>{formatCurrency(amountNum)}</span>
                {' '}bloqueados até{' '}
                <span style={{ color: '#E8E8F0' }}>
                  {new Date(form.unlock_date + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || saving}
            className="w-full py-4 rounded-xl text-sm font-600 transition-all flex items-center justify-center gap-2"
            style={{
              background: isValid ? 'var(--accent)' : 'var(--muted)',
              color: isValid ? 'var(--ink)' : 'var(--ghost)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              cursor: isValid ? 'pointer' : 'not-allowed',
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Lock size={16} />
            {saving ? 'a bloquear...' : 'bloquear agora'}
          </button>
        </div>
      </div>
    </main>
  )
}
