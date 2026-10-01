import { describe, it, expect } from 'vitest'
import { CATALOGUE, TABS, tabOf, inTab, buildNotification, isVisibleTo, byNewest, RETENTION_MS } from './catalogue'

const NOW = Date.parse('2026-10-02T10:00:00Z')
const ago = (ms) => new Date(NOW - ms).toISOString()
const MIN = 60_000, DAY = 86_400_000

const sa = { id: 'u0', role: 'super_admin', companies: [] }
const admin = { id: 'u1', role: 'admin', companies: [{ id: 'c1', name: 'Acme Corporation' }] }
const member = { id: 'u3', role: 'member', companies: [{ id: 'c1', name: 'Acme Corporation' }] }
const otherAdmin = { id: 'u9', role: 'admin', companies: [{ id: 'c2', name: 'Globex' }] }

describe('tabs (PRD 11.1)', () => {
  it('has the five tabs in order', () => expect(TABS.map((t) => t.label)).toEqual(['All', 'Scans', 'Infrastructure', 'Tickets', 'System']))
  it('maps codes to tabs', () => {
    expect(tabOf('N-SC-01')).toBe('scans')
    expect(tabOf('N-AI-02')).toBe('scans')
    expect(tabOf('N-IN-03')).toBe('infrastructure')
    expect(tabOf('N-TK-04')).toBe('tickets')
    expect(tabOf('N-CD-01')).toBe('system')
    expect(tabOf('N-UM-02')).toBe('system')
  })
  it('re-validation notifications only show under All', () => {
    expect(tabOf('N-RV-01')).toBeNull()
    expect(inTab({ code: 'N-RV-01' }, 'all')).toBe(true)
    for (const t of ['scans', 'infrastructure', 'tickets', 'system']) expect(inTab({ code: 'N-RV-01' }, t)).toBe(false)
  })
})

describe('catalogue copy (PRD 11.2)', () => {
  const vars = { asset: 'protergo.id', triggerType: 'Continuous', company: 'Acme', key: 'ci-key', ticket: 'ANO-123', category: 'Others', status: 'Open', user: 'a@b.co', role: 'Admin' }
  it('has all 19 notifications', () => expect(Object.keys(CATALOGUE)).toHaveLength(19))
  it('fills in the message copy exactly', () => {
    expect(buildNotification('N-SC-01', vars).message).toBe('protergo.id scan completed. Results are ready to view.')
    expect(buildNotification('N-SC-03', vars).message).toBe('Continuous scan started for protergo.id.')
    expect(buildNotification('N-IN-02', vars).message).toBe('Reminder: The scanner for Acme is still offline. Please investigate.')
    expect(buildNotification('N-TK-01', vars).message).toBe('New support ticket ANO-123 submitted by Acme: Others.')
    expect(buildNotification('N-UM-01', vars).message).toBe('a@b.co has been invited to Acme as Admin.')
  })
  it('rejects unknown codes', () => expect(() => buildNotification('N-XX-99')).toThrow())
  it('every entry has a title and builds without throwing', () => {
    for (const code of Object.keys(CATALOGUE)) { const n = buildNotification(code, vars); expect(n.title && n.message).toBeTruthy() }
  })
})

describe('isVisibleTo', () => {
  const scan = { code: 'N-SC-01', roles: ['super_admin', 'admin', 'member'], companyId: 'c1', createdAt: ago(5 * MIN) }
  it('ALL reaches every role of the company', () => {
    expect(isVisibleTo(scan, sa, NOW)).toBe(true)
    expect(isVisibleTo(scan, admin, NOW)).toBe(true)
    expect(isVisibleTo(scan, member, NOW)).toBe(true)
  })
  it('is company scoped (Super Admin is assigned to all companies)', () => {
    expect(isVisibleTo(scan, otherAdmin, NOW)).toBe(false)
    expect(isVisibleTo({ ...scan, companyId: 'c2' }, sa, NOW)).toBe(true)
  })
  it('infrastructure and CI/CD notifications skip members', () => {
    const infra = { code: 'N-IN-01', roles: ['super_admin', 'admin'], companyId: 'c1', createdAt: ago(MIN) }
    expect(isVisibleTo(infra, admin, NOW)).toBe(true)
    expect(isVisibleTo(infra, member, NOW)).toBe(false)
  })
  it('addressed-to-user notifications reach only that user', () => {
    const t = { code: 'N-TK-02', roles: [], userIds: ['u3'], companyId: 'c1', createdAt: ago(MIN) }
    expect(isVisibleTo(t, member, NOW)).toBe(true)
    expect(isVisibleTo(t, admin, NOW)).toBe(false)
    expect(isVisibleTo(t, sa, NOW)).toBe(false)
  })
  it('purges after 90 days', () => {
    expect(isVisibleTo({ ...scan, createdAt: ago(RETENTION_MS - DAY) }, sa, NOW)).toBe(true)
    expect(isVisibleTo({ ...scan, createdAt: ago(RETENTION_MS + MIN) }, sa, NOW)).toBe(false)
  })
  it('hides everything from a signed-out user', () => expect(isVisibleTo(scan, null, NOW)).toBe(false))
  it('sorts newest first', () => {
    const list = [{ createdAt: ago(2 * DAY) }, { createdAt: ago(MIN) }, { createdAt: ago(DAY) }].sort(byNewest)
    expect(list.map((x) => x.createdAt)).toEqual([ago(MIN), ago(DAY), ago(2 * DAY)])
  })
})
