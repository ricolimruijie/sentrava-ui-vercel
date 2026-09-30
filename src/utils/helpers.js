import { SEVERITY_COLORS, STATUS_COLORS, ACTIVITY_CATEGORY_COLORS, ACTIVITY_CATEGORY_LABELS } from './constants'

export function formatNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function formatDate(iso, opts = {}) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    ...opts
  }).format(new Date(iso))
}

export function formatRelativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return formatDate(iso)
}

export function formatShortDate(value) {
  if (value == null || value === '') return '—'
  const d = new Date(value)
  if (!Number.isNaN(d.getTime())) {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    }).format(d)
  }
  return String(value)
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function severityColor(sev) {
  return SEVERITY_COLORS[sev] ?? '#6B7280'
}

export function statusColor(status) {
  return STATUS_COLORS[status] ?? '#6B7280'
}

export function activityColor(category) {
  return ACTIVITY_CATEGORY_COLORS[category] ?? 'var(--color-text-muted)'
}

export function activityLabel(category) {
  return ACTIVITY_CATEGORY_LABELS[category] ?? category
}

export function trendClass(change) {
  if (change > 0) return 'trend--up'
  if (change < 0) return 'trend--down'
  return 'trend--neutral'
}

export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}
