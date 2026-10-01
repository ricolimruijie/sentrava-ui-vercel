import { SEVERITY_COLORS, STATUS_COLORS, ACTIVITY_CATEGORY_COLORS, ACTIVITY_CATEGORY_LABELS } from '@/constants'

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

// e.g. "March 5, 2026"
export function formatDateLong(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// e.g. "Thu, 5 Mar 2026, 14:30"
export function formatShortDateTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return formatShortDate(iso)
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${formatShortDate(d)}, ${time}`
}

// e.g. "5 March 2026, 14:30"
export function formatLongDateTime24(iso) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${date}, ${time}`
}

// e.g. "March 5, 2026 at 2:30 PM"
export function formatLongDateTime12(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

// e.g. "March 5 2026 2:30 PM", or "—" for an invalid date
export function formatLongDateTimeCompact(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const date = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).replace(',', '')
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} ${time}`
}

// e.g. "5 Mar 2026", or "—" when empty
export function formatDayMonthYear(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// e.g. "5 Mar · 2:30 PM", or "—" when empty
export function formatDayMonthTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    + ' · '
    + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
