import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount)
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'critical': return 'from-red-500 to-red-600'
    case 'warning': return 'from-yellow-500 to-yellow-600'
    default: return 'from-green-500 to-green-600'
  }
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case 'critical': return '🚨'
    case 'warning': return '⚠️'
    default: return '✅'
  }
}