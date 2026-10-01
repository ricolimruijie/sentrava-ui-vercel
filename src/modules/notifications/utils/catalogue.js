import { ROLES } from '@/constants'

// Notification rules from PRD section 11: the catalogue (id, wording, who gets it), the
// five tabs and who may see a notification. Pure functions, no I/O.

export const RETENTION_DAYS = 90
export const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000
export const PANEL_LIMIT = 50
export const POLL_MS = 30_000 // PRD: a notification must appear within 30 seconds
// Window event the mock backend fires when it adds a notification, so the panel refreshes at once.
export const NOTIFICATIONS_EVENT = 'sentra:notifications'

export const TABS = [
  { key: 'all', label: 'All' },
  { key: 'scans', label: 'Scans' },
  { key: 'infrastructure', label: 'Infrastructure' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'system', label: 'System' },
]

// Tab mapping (PRD 11.1). N-RV-* (re-validation) is not assigned to a tab in the PRD,
// so those only show under "All".
const TAB_BY_PREFIX = {
  'N-SC': 'scans', 'N-AI': 'scans',
  'N-IN': 'infrastructure',
  'N-TK': 'tickets',
  'N-CD': 'system', 'N-UM': 'system',
}
export const tabOf = (code) => TAB_BY_PREFIX[String(code).slice(0, 4)] ?? null
export const inTab = (n, tab) => tab === 'all' || tabOf(n.code) === tab

const { SUPER_ADMIN: SA, ADMIN: AD, MEMBER: ME } = ROLES
// Recipient role keys from the PRD: ALL, INFRA, CICD (company-scoped), plus single-role audiences.
// Ticket / user notifications are addressed to specific users (ticket creator, thread parties,
// the affected user) instead of a role, so their `roles` is empty here.
const ALL = [SA, AD, ME]
const INFRA = [SA, AD]
const CICD = [SA, AD]

export const CATALOGUE = {
  'N-SC-01': { title: 'Scan completed',        roles: ALL,   message: (v) => `${v.asset} scan completed. Results are ready to view.` },
  'N-SC-02': { title: 'Scan failed',           roles: ALL,   message: (v) => `${v.asset} scan failed. You can restart the scan from the Assessment Timeline at no extra charge.` },
  'N-SC-03': { title: 'Scheduled scan started', roles: [AD], message: (v) => `${v.triggerType} scan started for ${v.asset}.` },
  'N-AI-01': { title: 'Mapping scan complete', roles: ALL,   message: (v) => `Mapping scan for ${v.asset} is complete. You can now configure and start a security scan.` },
  'N-AI-02': { title: 'Mapping scan failed',   roles: ALL,   message: (v) => `Mapping scan for ${v.asset} failed. Please check the asset configuration and try again.` },
  'N-RV-01': { title: 'Re-validation requested', roles: ALL, message: (v) => `Re-validation requested for ${v.asset}. Scanning in progress.` },
  'N-RV-02': { title: 'Re-validation complete', roles: ALL,  message: () => 'Re-validation is completed, kindly check the result.' },
  'N-IN-01': { title: 'Scanner offline',       roles: INFRA, message: (v) => `The scanner assigned to ${v.company} is currently offline. All scans are paused until it reconnects.` },
  'N-IN-02': { title: 'Scanner still offline', roles: INFRA, message: (v) => `Reminder: The scanner for ${v.company} is still offline. Please investigate.` },
  'N-IN-03': { title: 'Scanner back online',   roles: INFRA, message: (v) => `The scanner for ${v.company} is back online. Scans can now be triggered normally.` },
  'N-CD-01': { title: 'API key expiring soon', roles: CICD,  message: (v) => `API key ${v.key} expires in 7 days. Rotate it before expiry to avoid pipeline disruption.` },
  'N-CD-02': { title: 'API key expired',       roles: CICD,  message: (v) => `API key ${v.key} has expired. Any pipelines using this key are now broken.` },
  'N-CD-03': { title: 'API key deleted',       roles: CICD,  message: (v) => `API key ${v.key} has been deleted. Pipelines using this key will no longer work.` },
  'N-TK-01': { title: 'New support ticket',    roles: [SA],  message: (v) => `New support ticket ${v.ticket} submitted by ${v.company}: ${v.category}.` },
  'N-TK-02': { title: 'Ticket status updated', roles: [],    message: (v) => `Your ticket ${v.ticket} status has been updated to ${v.status}.` },
  'N-TK-03': { title: 'New ticket message',    roles: [],    message: (v) => `New message on ticket ${v.ticket}. Tap to view.` },
  'N-TK-04': { title: 'Ticket closed',         roles: [],    message: (v) => `Ticket ${v.ticket} has been closed. Please rate your support experience.` },
  'N-UM-01': { title: 'User invited',          roles: [AD],  message: (v) => `${v.user} has been invited to ${v.company} as ${v.role}.` },
  'N-UM-02': { title: 'Your role changed',     roles: [],    message: (v) => `Your role in ${v.company} has been updated to ${v.role}.` },
}

// Fill in title and message copy for a catalogue entry.
export function buildNotification(code, vars = {}) {
  const def = CATALOGUE[code]
  if (!def) throw new Error(`Unknown notification code: ${code}`)
  return { code, title: def.title, message: def.message(vars), roles: [...def.roles] }
}

// A notification is visible to a user when it is inside the retention window, addressed to them
// (by user id) or to their role, and - for role-addressed ones - belongs to a company they are
// assigned to. Super Admin is assigned to every company.
export function isVisibleTo(n, user, now = Date.now()) {
  if (!user) return false
  if (now - Date.parse(n.createdAt) > RETENTION_MS) return false
  if (n.userIds?.includes(user.id)) return true
  if (!n.roles?.includes(user.role)) return false
  if (user.role === SA) return true
  return (user.companies ?? []).some((c) => c.id === n.companyId)
}

// Newest first.
export const byNewest = (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
