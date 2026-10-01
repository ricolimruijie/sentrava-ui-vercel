import { registerMock } from '@/services/api/client'
import { clientDashboardMock, emptyClientDashboard } from './dashboard/client'
import { emptyData } from '@/utils/dataMode'
import { superAdminDashboardMock } from './dashboard/superAdmin'
import { apiKeysMock }             from './settings/apiKeys'
import { cicdRunsMock }            from './scans/cicd'
import { vulnerabilitiesMock }     from './scans/vulnerabilities'
import { companyInfoMock, companyMembersMock } from './company/members'
import { companyListMock } from './company/companyList'
import { auditLogMock } from './company/auditLog'
import { probeBoxMock } from './company/probeBox'

// ── Dashboard ────────────────────────────────────────────────────────────────
registerMock(/\/dashboard\/client/,      () => (emptyData.value ? emptyClientDashboard() : clientDashboardMock))
registerMock(/\/dashboard\/super-admin/, () => superAdminDashboardMock)

// ── Settings ─────────────────────────────────────────────────────────────────
registerMock(/\/settings\/api-keys/, () => (emptyData.value ? [] : apiKeysMock))

// ── Company ──────────────────────────────────────────────────────────────────
registerMock(/\/company\/info/,       () => companyInfoMock)
registerMock(/\/company\/members/,    () => (emptyData.value ? [] : companyMembersMock))
registerMock(/\/company\/list/,       () => (emptyData.value ? [] : companyListMock))
registerMock(/\/company\/audit-log/,  () => (emptyData.value ? [] : auditLogMock))
registerMock(/\/company\/probes/,     () => (emptyData.value ? [] : probeBoxMock))

// ── Scans ────────────────────────────────────────────────────────────────────
// More specific pattern registered first — /scans/history/:id/vulnerabilities
// would otherwise also match the plain /scans/history list below.
registerMock(/\/scans\/history\/[^/]+\/vulnerabilities/, () => (emptyData.value ? [] : vulnerabilitiesMock))
registerMock(/\/scans\/history/, () => (emptyData.value ? [] : cicdRunsMock))

// ── Auth ─────────────────────────────────────────────────────────────────────
// Always succeeds — the real endpoint must not reveal whether the email has an account.
registerMock(/\/auth\/forgot-password/, () => ({ ok: true }))
registerMock(/\/auth\/login/, (_, cfg) => {
  const { email, dataMode } = cfg.data ?? {}
  const roleMappings = {
    'superadmin@sentra.io': { id: 'u0', name: 'Root Admin',   role: 'super_admin', email: 'superadmin@sentra.io', companies: [], twoFAEnabled: true },
    'admin@acme.com':       { id: 'u1', name: 'Alex Johnson', role: 'admin',       email: 'admin@acme.com',       companies: [{ id: 'c1', name: 'Acme Corporation' }], twoFAEnabled: true },
    'member@acme.com':      { id: 'u3', name: 'James Park',   role: 'member',      email: 'member@acme.com',      companies: [{ id: 'c1', name: 'Acme Corporation' }], twoFAEnabled: true },
  }
  const user = roleMappings[email]
  if (!user) return Promise.reject({ message: 'Invalid credentials' })
  // Any role can be signed in "with no data" (see utils/dataMode.js) to review empty states.
  return { token: 'mock-jwt-token', user: dataMode === 'empty' ? { ...user, dataMode: 'empty' } : user }
})
