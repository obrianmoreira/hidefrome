import { differenceInDays, differenceInHours, differenceInMinutes, isPast, parseISO } from 'date-fns'
import { Vault } from './supabase'

export function getDaysUntilUnlock(unlockDate: string): number {
  return Math.max(0, differenceInDays(parseISO(unlockDate), new Date()))
}

export function getHoursUntilUnlock(unlockDate: string): number {
  return Math.max(0, differenceInHours(parseISO(unlockDate), new Date()))
}

export function isUnlockable(vault: Vault): boolean {
  return isPast(parseISO(vault.unlock_date)) && vault.status === 'locked'
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function getTotalLocked(vaults: Vault[]): number {
  return vaults
    .filter(v => v.status === 'locked')
    .reduce((sum, v) => sum + v.amount, 0)
}

export function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    rent: '🏠',
    tax: '📋',
    salary: '💼',
    emergency: '🚨',
    savings: '💰',
    other: '📦',
  }
  return map[category] || '📦'
}

export function getCountdownText(unlockDate: string): string {
  const days = getDaysUntilUnlock(unlockDate)
  if (days > 1) return `${days} dias`
  const hours = getHoursUntilUnlock(unlockDate)
  if (hours > 1) return `${hours} horas`
  const mins = Math.max(0, differenceInMinutes(parseISO(unlockDate), new Date()))
  if (mins > 0) return `${mins} minutos`
  return 'Pronto para liberar'
}
