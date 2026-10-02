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
// Demo only: every 6-digit code check (authenticator app or email) accepts this one code.
const DEMO_2FA_CODE = '123456'
const TWO_FA_KEY = 'sentra_mock_2fa' // { [email]: boolean } — what the user chose in Settings
const challenges = new Map() // challengeId -> { user, dataMode }

const readJson = (key) => { try { return JSON.parse(window.localStorage.getItem(key) ?? '{}') ?? {} } catch { return {} } }
const normEmail = (email) => String(email ?? '').trim().toLowerCase()

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
  const found = roleMappings[normEmail(email)]
  if (!found || password !== DEMO_PASSWORD) {
    const after = lockout.recordFailure(email)
    const message = after.locked ? lockedMessage(after.retryAfterMs) : 'Invalid credentials'
    return Promise.reject({ message, code: after.locked ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS' })
  }
  const chosen = readJson(TWO_FA_KEY)[found.email]
  const user = { ...found, twoFAEnabled: chosen ?? found.twoFAEnabled }
  // Any role can be signed in "with no data" (see utils/dataMode.js) to review empty states.
  const session = { token: 'mock-jwt-token', user: dataMode === 'empty' ? { ...user, dataMode: 'empty' } : user }
  if (user.twoFAEnabled) {
    // Password was right, but no session yet: the 6-digit code is still needed. The failure counter is
    // only reset once the code is accepted too.
    const challengeId = `ch_${Math.random().toString(36).slice(2, 10)}`
    challenges.set(challengeId, session)
    return { twoFactorRequired: true, challengeId, email: user.email }
  }
  lockout.recordSuccess(email)
  return session
})

// Second login step. Wrong codes count toward the same lockout as wrong passwords.
registerMock(/\/auth\/2fa\/verify/, (_, cfg) => {
  const { challengeId, code } = cfg.data ?? {}
  const session = challenges.get(challengeId)
  if (!session) return Promise.reject({ message: 'This sign-in has expired. Please log in again.', code: 'CHALLENGE_EXPIRED' })
  const email = session.user.email
  const lock = lockout.status(email)
  if (lock.locked) { challenges.delete(challengeId); return Promise.reject({ message: lockedMessage(lock.retryAfterMs), code: 'ACCOUNT_LOCKED' }) }
  if (code !== DEMO_2FA_CODE) {
    const after = lockout.recordFailure(email)
    if (after.locked) challenges.delete(challengeId)
    return Promise.reject({ message: after.locked ? lockedMessage(after.retryAfterMs) : 'Invalid verification code', code: after.locked ? 'ACCOUNT_LOCKED' : 'INVALID_CODE' })
  }
  challenges.delete(challengeId)
  lockout.recordSuccess(email)
  return session
})
registerMock(/\/auth\/2fa\/email-code/, (_, cfg) => (challenges.has(cfg.data?.challengeId)
  ? { ok: true }
  : Promise.reject({ message: 'This sign-in has expired. Please log in again.', code: 'CHALLENGE_EXPIRED' })))
registerMock(/\/auth\/2fa$/, (_, cfg) => {
  const { email, enabled } = cfg.data ?? {}
  window.localStorage.setItem(TWO_FA_KEY, JSON.stringify({ ...readJson(TWO_FA_KEY), [normEmail(email)]: !!enabled }))
  return { ok: true }
})
