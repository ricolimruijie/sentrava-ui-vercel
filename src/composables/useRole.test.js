import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useRole } from './useRole'

function as(role) {
  const auth = useAuthStore()
  auth.user = { id: 'u', name: 'Test', role, companies: [] }
  auth.token = 't'
  return useRole()
}

// PRD section 9.2 permission matrix: [permission, super_admin, admin, member]
const matrix = [
  ['delete_asset',    true,  true,  false],
  ['delete_scan',     true,  true,  false],
  ['manage_api_keys', true,  true,  false],
  ['create_ticket',   false, true,  true],
  ['close_ticket',    true,  false, false],
  ['manage_company',  true,  false, false],
]

describe('useRole().can()', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it.each(matrix)('%s -> super_admin %s, admin %s, member %s', (perm, sa, admin, member) => {
    expect(as('super_admin').can(perm)).toBe(sa)
    expect(as('admin').can(perm)).toBe(admin)
    expect(as('member').can(perm)).toBe(member)
  })

  it('denies unknown permissions for every role', () => {
    for (const r of ['super_admin', 'admin', 'member']) expect(as(r).can('does_not_exist')).toBe(false)
  })

  it('exposes the role flags', () => {
    const r = as('admin')
    expect(r.isAdmin.value).toBe(true)
    expect(r.isSuperAdmin.value).toBe(false)
    expect(r.isClientRole.value).toBe(true)
  })
})
