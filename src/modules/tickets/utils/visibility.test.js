import { describe, it, expect } from 'vitest'
import { canViewTicket, sampleTicketOwners } from './visibility'

const ticket = { company: 'Acme Corporation', submitter: 'James Park' }
const sa = { role: 'super_admin' }
const admin = { role: 'admin', name: 'Alex Johnson', companies: [{ id: 'c1', name: 'Acme Corporation' }] }
const otherAdmin = { role: 'admin', name: 'Dana Lee', companies: [{ id: 'c2', name: 'Globex Industries' }] }
const member = { role: 'member', name: 'James Park', companies: [{ id: 'c1', name: 'Acme Corporation' }] }
const otherMember = { role: 'member', name: 'Someone Else', companies: [{ id: 'c1', name: 'Acme Corporation' }] }

describe('canViewTicket (PRD 6.4)', () => {
  it('super admin sees every ticket', () => expect(canViewTicket(ticket, sa)).toBe(true))
  it('admin sees their own company only', () => {
    expect(canViewTicket(ticket, admin)).toBe(true)
    expect(canViewTicket(ticket, otherAdmin)).toBe(false)
  })
  it('member sees only tickets they raised', () => {
    expect(canViewTicket(ticket, member)).toBe(true)
    expect(canViewTicket(ticket, otherMember)).toBe(false)
  })
  it('hides a missing ticket from everyone', () => expect(canViewTicket(null, sa)).toBe(false))
  it('has an owner for every sample ticket', () => {
    for (const o of Object.values(sampleTicketOwners)) expect(o.company && o.submitter).toBeTruthy()
  })
})
