import { registerMock } from '@/utils/request'
import { clientDashboardMock }     from './dashboard/client'
import { superAdminDashboardMock } from './dashboard/superAdmin'
import { apiKeysMock }             from './settings/apiKeys'
import { cicdRunsMock }            from './scans/cicd'
import { vulnerabilitiesMock }     from './scans/vulnerabilities'
import { companyInfoMock, companyMembersMock } from './company/members'
import { companyListMock } from './company/companyList'
import { auditLogMock } from './company/auditLog'
import { probeBoxMock } from './company/probeBox'

// ── Dashboard ────────────────────────────────────────────────────────────────
registerMock(/\/dashboard\/client/,      () => clientDashboardMock)
registerMock(/\/dashboard\/super-admin/, () => superAdminDashboardMock)

// ── Settings ─────────────────────────────────────────────────────────────────
registerMock(/\/settings\/api-keys/, () => apiKeysMock)

// ── Company ──────────────────────────────────────────────────────────────────
registerMock(/\/company\/info/,       () => companyInfoMock)
registerMock(/\/company\/members/,    () => companyMembersMock)
registerMock(/\/company\/list/,       () => companyListMock)
registerMock(/\/company\/audit-log/,  () => auditLogMock)
registerMock(/\/company\/probes/,     () => probeBoxMock)

// ── Scans ────────────────────────────────────────────────────────────────────
// More specific pattern registered first — /scans/history/:id/vulnerabilities
// would otherwise also match the plain /scans/history list below.
registerMock(/\/scans\/history\/[^/]+\/vulnerabilities/, () => vulnerabilitiesMock)
registerMock(/\/scans\/history/, () => cicdRunsMock)

// ── Auth ─────────────────────────────────────────────────────────────────────
registerMock(/\/auth\/login/, (_, cfg) => {
  const { email } = cfg.data ?? {}
  const roleMappings = {
    'superadmin@sentra.io': { id: 'u0', name: 'Root Admin',   role: 'super_admin', email: 'superadmin@sentra.io', companies: [] },
    'admin@acme.com':       { id: 'u1', name: 'Alex Johnson', role: 'admin',       email: 'admin@acme.com',       companies: [{ id: 'c1', name: 'Acme Corporation' }] },
    'analyst@acme.com':     { id: 'u2', name: 'Sarah Kim',    role: 'analyst',     email: 'analyst@acme.com',     companies: [{ id: 'c1', name: 'Acme Corporation' }, { id: 'c2', name: 'Beta Ventures' }] },
    'member@acme.com':      { id: 'u3', name: 'James Park',   role: 'member',      email: 'member@acme.com',      companies: [{ id: 'c1', name: 'Acme Corporation' }] },
  }
  const user = roleMappings[email]
  if (!user) return Promise.reject({ message: 'Invalid credentials' })
  return { token: 'mock-jwt-token', user }
})
