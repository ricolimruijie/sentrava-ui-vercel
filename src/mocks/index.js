import { registerMock } from '@/utils/request'
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
registerMock(/\/auth\/login/, (_, cfg) => {
  const { email } = cfg.data ?? {}
  const roleMappings = {
    'superadmin@sentra.io': { id: 'u0', name: 'Root Admin',   role: 'super_admin', email: 'superadmin@sentra.io', companies: [] },
    'admin@acme.com':       { id: 'u1', name: 'Alex Johnson', role: 'admin',       email: 'admin@acme.com',       companies: [{ id: 'c1', name: 'Acme Corporation' }] },
    // Not a role: a super admin whose every page is shown without data (see utils/dataMode.js).
    'empty@sentra.io':      { id: 'u9', name: 'Empty State',  role: 'super_admin', email: 'empty@sentra.io',      companies: [], dataMode: 'empty' },
    'member@acme.com':      { id: 'u3', name: 'James Park',   role: 'member',      email: 'member@acme.com',      companies: [{ id: 'c1', name: 'Acme Corporation' }] },
  }
  const user = roleMappings[email]
  if (!user) return Promise.reject({ message: 'Invalid credentials' })
  return { token: 'mock-jwt-token', user }
})
