import { registerMock } from '@/services/api/client'
import { clientDashboardMock, emptyClientDashboard } from './dashboard/client'
import { emptyData } from '@/utils/dataMode'
import { createLockoutTracker, lockedMessage } from '@/modules/auth/utils/lockout'
import * as notificationsMock from './notifications/notifications'
import { apiKeysMock }             from './settings/apiKeys'
import { cicdRunsMock }            from './scans/cicd'
import { vulnerabilitiesMock }     from './scans/vulnerabilities'
import { companyInfoMock, companyMembersMock } from './company/members'
import { companyListMock } from './company/companyList'
import { auditLogMock } from './company/auditLog'
import { probeBoxMock } from './company/probeBox'
import { getDomains, getDomainEndpoints, getDomainVulns, getDomainScans, getDomainReputation, getDomainReputationEngines } from './assets/domain'
import { getNetworks, getNetworkEndpoints, getNetworkVulns, getNetworkScans } from './assets/network'
import { getWebApps, getWebAppVulns, getWebAppScans } from './assets/webApp'
import { getSourceCodeRepos, getSourceCodeVulns, getSourceCodeScans } from './assets/sourceCode'

// ── Dashboard ────────────────────────────────────────────────────────────────
registerMock(/\/dashboard\/client/,      () => (emptyData.value ? emptyClientDashboard() : clientDashboardMock))

// ── Settings ─────────────────────────────────────────────────────────────────
registerMock(/\/settings\/api-keys/, () => (emptyData.value ? [] : apiKeysMock))

// ── Company ──────────────────────────────────────────────────────────────────
registerMock(/\/company\/info/,       () => companyInfoMock)
registerMock(/\/company\/members/,    () => (emptyData.value ? [] : companyMembersMock))
registerMock(/\/company\/list/,       () => (emptyData.value ? [] : companyListMock))
registerMock(/\/company\/audit-log/,  () => (emptyData.value ? [] : auditLogMock))
registerMock(/\/company\/probes/,     () => (emptyData.value ? [] : probeBoxMock))

// ── Assets ───────────────────────────────────────────────────────────────────
// The mock getters already return no data in the no-data demo (see mocks/assets/*).
const idOf = (url) => Number(url.match(/\/assets\/[^/]+\/(\d+)\//)?.[1])
registerMock(/^\/assets\/domains$/,                          () => getDomains())
registerMock(/^\/assets\/domains\/endpoints$/,               () => getDomainEndpoints())
registerMock(/^\/assets\/domains\/vulns$/,                   () => getDomainVulns())
registerMock(/^\/assets\/domains\/\d+\/scans$/,              (url) => getDomainScans(idOf(url)))
registerMock(/^\/assets\/domains\/\d+\/reputation$/,         (url) => getDomainReputation(idOf(url)))
registerMock(/^\/assets\/domains\/\d+\/reputation-engines$/, (url) => getDomainReputationEngines(idOf(url)))
registerMock(/^\/assets\/networks$/,                         () => getNetworks())
registerMock(/^\/assets\/networks\/endpoints$/,              () => getNetworkEndpoints())
registerMock(/^\/assets\/networks\/vulns$/,                  () => getNetworkVulns())
registerMock(/^\/assets\/networks\/\d+\/scans$/,             (url) => getNetworkScans(idOf(url)))
registerMock(/^\/assets\/webapps$/,                          () => getWebApps())
registerMock(/^\/assets\/webapps\/vulns$/,                   () => getWebAppVulns())
registerMock(/^\/assets\/webapps\/\d+\/scans$/,              (url) => getWebAppScans(idOf(url)))
registerMock(/^\/assets\/source-code$/,                      () => getSourceCodeRepos())
registerMock(/^\/assets\/source-code\/vulns$/,               () => getSourceCodeVulns())
registerMock(/^\/assets\/source-code\/\d+\/scans$/,          (url) => getSourceCodeScans(idOf(url)))

// ── Scans ────────────────────────────────────────────────────────────────────
// More specific pattern registered first — /scans/history/:id/vulnerabilities
// would otherwise also match the plain /scans/history list below.
registerMock(/\/scans\/history\/[^/]+\/vulnerabilities/, () => (emptyData.value ? [] : vulnerabilitiesMock))
registerMock(/\/scans\/history/, () => (emptyData.value ? [] : cicdRunsMock))

// ── Notifications ────────────────────────────────────────────────────────────
// Specific patterns first: /notifications/read-all and /notifications/:id/read would also match the list pattern.
registerMock(/^\/notifications\/read-all$/, () => { notificationsMock.markAllRead(); return { ok: true } })
registerMock(/^\/notifications\/[^/]+\/read$/, (url) => { notificationsMock.markRead(url.split('/')[2]); return { ok: true } })
registerMock(/^\/notifications$/, () => (emptyData.value ? [] : notificationsMock.listForCurrentUser()))

// ── Auth ─────────────────────────────────────────────────────────────────────
// Always succeeds — the real endpoint must not reveal whether the email has an account.
registerMock(/\/auth\/forgot-password/, () => ({ ok: true }))
const lockout = createLockoutTracker(window.localStorage)
const DEMO_PASSWORD = 'demo'
registerMock(/\/auth\/login/, (_, cfg) => {
  const { email, password, dataMode } = cfg.data ?? {}
  // PRD 2.2: 5 consecutive failures lock the account for 30 minutes; even the right password is refused meanwhile.
  const lock = lockout.status(email)
  if (lock.locked) return Promise.reject({ message: lockedMessage(lock.retryAfterMs), code: 'ACCOUNT_LOCKED' })
  const roleMappings = {
    'superadmin@sentra.io': { id: 'u0', name: 'Root Admin',   role: 'super_admin', email: 'superadmin@sentra.io', companies: [], twoFAEnabled: true },
    'admin@acme.com':       { id: 'u1', name: 'Alex Johnson', role: 'admin',       email: 'admin@acme.com',       companies: [{ id: 'c1', name: 'Acme Corporation' }], twoFAEnabled: true },
    'member@acme.com':      { id: 'u3', name: 'James Park',   role: 'member',      email: 'member@acme.com',      companies: [{ id: 'c1', name: 'Acme Corporation' }], twoFAEnabled: true },
  }
  const user = roleMappings[String(email ?? '').trim().toLowerCase()]
  if (!user || password !== DEMO_PASSWORD) {
    const after = lockout.recordFailure(email)
    const message = after.locked ? lockedMessage(after.retryAfterMs) : 'Invalid credentials'
    return Promise.reject({ message, code: after.locked ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS' })
  }
  lockout.recordSuccess(email)
  // Any role can be signed in "with no data" (see utils/dataMode.js) to review empty states.
  return { token: 'mock-jwt-token', user: dataMode === 'empty' ? { ...user, dataMode: 'empty' } : user }
})
