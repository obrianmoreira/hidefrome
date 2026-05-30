'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { ArrowLeft, Lock, Zap } from 'lucide-react'
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

const AMOUNT_TYPES = [
  { value: 'fixed', label: '€ fixo' },
  { value: 'percent', label: '% percentagem' },
  { value: 'auto', label: '⚡ automático' },
]

export default function NewVaultPage() {
  const { user } = useUser()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    amount: '',
    amount_type: 'fixed',
    unlock_date: '',
    category: 'rent',
    notes: '',
    trigger_threshold: '',
    trigger_percent: '',
    trigger_max: '',
  })

  const amountNum = parseFloat(form.amount) || 0
  const thresholdNum = parseFloat(form.trigger_threshold) || 0
  const triggerPercentNum = parseFloat(form.trigger_percent) || 0
  const triggerMaxNum = parseFloat(form.trigger_max) || 0

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit() {
    if (!user || !form.name || !form.unlock_date) return
    if (form.amount_type !== 'auto' && !form.amount) return
    if (form.amount_type === 'auto' && (!form.trigger_threshold || !form.trigger_percent)) return
    setSaving(true)

    const { error } = await supabase.from('vaults').insert({
      user_id: user.id,
      name: form.name,
      amount: form.amount_type === 'auto' ? (triggerMaxNum || 0) : amountNum,
      amount_type: form.amount_type,
      currency: 'EUR',
      unlock_date: form.unlock_date,
      category: form.category,
      notes: form.notes,
      status: 'locked',
      trigger_threshold: form.amount_type === 'auto' ? thresholdNum : null,
      trigger_percent: form.amount_type === 'auto' ? triggerPercentNum : null,
      trigger_max: form.amount_type === 'auto' && triggerMaxNum > 0 ? triggerMaxNum : null,
    })

    if (!error) {
      router.push('/dashboard')
    } else {
      console.error(error)
      setSaving(false)
    }
  }

  const isValid = form.name && form.unlock_date && (
    (form.amount_type === 'fixed' && amountNum > 0) ||
    (form.amount_type === 'percent' && amountNum > 0 && amountNum <= 100) ||
    (form.amount_type === 'auto' && thresholdNum > 0 && triggerPercentNum > 0 && triggerPercentNum <= 100)
  )

  const inputStyle = {
    background: 'var(--locked)',
    border: '1px solid var(--muted)',
    color: '#E8E8F0',
    fontFamily: 'var(--font-body)',
  }

  return (
    <main className="min-h-screen noise" style={{ background: 'var(--ink)' }}>
      <div className="fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(var(--muted) 1px, transparent 1px), linear-gradient(90deg, var(--muted) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto px-5 py-8">
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
            <label className="block text-xs mb-2" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>nome do cofre</label>
            <input type="text" name="name" value={form.name} onChange={handleChange}
              placeholder="ex: Renda de junho"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.4)'}
              onBlur={e => e.target.style.borderColor = 'var(--muted)'}
            />
          </div>

          {/* Amount type */}
          <div>
            <label className="block text-xs mb-2" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>tipo de valor</label>
            <div className="flex gap-2 mb-3">
              {AMOUNT_TYPES.map(opt => (
                <button key={opt.value}
                  onClick={() => setForm(prev => ({ ...prev, amount_type: opt.value, amount: '' }))}
                  className="flex-1 py-2 rounded-xl text-xs transition-all"
                  style={{
                    background: form.amount_type === opt.value ? 'rgba(74,222,128,0.1)' : 'var(--locked)',
                    border: form.amount_type === opt.value ? '1px solid rgba(74,222,128,0.3)' : '1px solid var(--muted)',
                    color: form.amount_type === opt.value ? 'var(--accent)' : 'var(--ghost)',
                    fontFamily: 'var(--font-body)',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Fixed amount */}
            {form.amount_type === 'fixed' && (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--ghost)' }}>€</span>
                <input type="number" name="amount" value={form.amount} onChange={handleChange}
                  placeholder="0.00" min="0" step="0.01"
                  className="w-full pl-8 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'var(--muted)'}
                />
              </div>
            )}

            {/* Percent amount */}
            {form.amount_type === 'percent' && (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--ghost)' }}>%</span>
                <input type="number" name="amount" value={form.amount} onChange={handleChange}
                  placeholder="60" min="1" max="100"
                  className="w-full pl-8 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'var(--muted)'}
                />
              </div>
            )}

            {/* Auto trigger */}
            {form.amount_type === 'auto' && (
              <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(74,222,128,0.03)', border: '1px solid rgba(74,222,128,0.1)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={13} style={{ color: 'var(--accent)' }} />
                  <p className="text-xs" style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}>
                    bloqueia automaticamente quando o salário entrar
                  </p>
                </div>

                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>a partir de (€)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--ghost)' }}>€</span>
                    <input type="number" name="trigger_threshold" value={form.trigger_threshold} onChange={handleChange}
                      placeholder="400"
                      className="w-full pl-8 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'var(--muted)'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>percentagem a bloquear (%)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--ghost)' }}>%</span>
                    <input type="number" name="trigger_percent" value={form.trigger_percent} onChange={handleChange}
                      placeholder="60" min="1" max="100"
                      className="w-full pl-8 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'var(--muted)'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>
                    meta / limite máximo (€) <span style={{ color: 'var(--muted)' }}>— opcional</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--ghost)' }}>€</span>
                    <input type="number" name="trigger_max" value={form.trigger_max} onChange={handleChange}
                      placeholder="800"
                      className="w-full pl-8 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'var(--muted)'}
                    />
                  </div>
                  {triggerMaxNum > 0 && (
                    <p className="text-xs mt-1" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>
                      para de bloquear quando atingir {formatCurrency(triggerMaxNum)}
                    </p>
                  )}
                </div>

                {thresholdNum > 0 && triggerPercentNum > 0 && (
                  <p className="text-xs p-2 rounded-lg" style={{ background: 'rgba(74,222,128,0.05)', color: 'var(--accent)', fontFamily: 'var(--font-body)', border: '1px solid rgba(74,222,128,0.1)' }}>
                    ⚡ Entrada ≥ {formatCurrency(thresholdNum)} → bloqueia {triggerPercentNum}%
                    {triggerMaxNum > 0 ? ` até {formatCurrency(triggerMaxNum)}` : ''}
                  </p>
                )}
              </div>
            )}

            {form.amount_type === 'fixed' && amountNum > 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}>
                {formatCurrency(amountNum)} bloqueados
              </p>
            )}
            {form.amount_type === 'percent' && amountNum > 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}>
                {amountNum}% do valor que entrar na conta
              </p>
            )}
          </div>

          {/* Unlock date */}
          <div>
            <label className="block text-xs mb-2" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>data de liberação</label>
            <input type="date" name="unlock_date" value={form.unlock_date} onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.4)'}
              onBlur={e => e.target.style.borderColor = 'var(--muted)'}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs mb-2" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>categoria</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat.value}
                  onClick={() => setForm(prev => ({ ...prev, category: cat.value }))}
                  className="px-3 py-3 rounded-xl text-xs transition-all text-center"
                  style={{
                    background: form.category === cat.value ? 'rgba(74,222,128,0.1)' : 'var(--locked)',
                    border: form.category === cat.value ? '1px solid rgba(74,222,128,0.3)' : '1px solid var(--muted)',
                    color: form.category === cat.value ? 'var(--accent)' : 'var(--ghost)',
                    fontFamily: 'var(--font-body)',
                  }}>
                  <div className="text-lg mb-1">{cat.emoji}</div>
                  <div className="leading-tight" style={{ fontSize: '0.65rem' }}>{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs mb-2" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>nota (opcional)</label>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              placeholder="ex: Renda do apartamento, 1º andar"
              rows={2}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.4)'}
              onBlur={e => e.target.style.borderColor = 'var(--muted)'}
            />
          </div>

          {/* Preview */}
          {isValid && (
            <div className="p-4 rounded-xl animate-fade-in"
              style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}>resumo</p>
              {form.amount_type === 'fixed' && (
                <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                  <span style={{ color: 'var(--accent)' }}>{formatCurrency(amountNum)}</span>
                  {' '}bloqueados até{' '}
                  <span style={{ color: '#E8E8F0' }}>
                    {new Date(form.unlock_date + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </p>
              )}
              {form.amount_type === 'percent' && (
                <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                  <span style={{ color: 'var(--accent)' }}>{amountNum}% do salário</span>
                  {' '}bloqueado até{' '}
                  <span style={{ color: '#E8E8F0' }}>
                    {new Date(form.unlock_date + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </p>
              )}
              {form.amount_type === 'auto' && (
                <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                  <span style={{ color: 'var(--accent)' }}>⚡ automático</span>
                  {' — '}entrada ≥ {formatCurrency(thresholdNum)} → {triggerPercentNum}%
                  {triggerMaxNum > 0 && <span style={{ color: 'var(--ghost)' }}> (max {formatCurrency(triggerMaxNum)})</span>}
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={!isValid || saving}
            className="w-full py-4 rounded-xl text-sm font-600 transition-all flex items-center justify-center gap-2"
            style={{
              background: isValid ? 'var(--accent)' : 'var(--muted)',
              color: isValid ? 'var(--ink)' : 'var(--ghost)',
              fontFamily: 'var(--font-body)', fontWeight: 600,
              cursor: isValid ? 'pointer' : 'not-allowed',
              opacity: saving ? 0.7 : 1,
            }}>
            <Lock size={16} />
            {saving ? 'a bloquear...' : 'bloquear agora'}
          </button>
        </div>
      </div>
    </main>
  )
}
