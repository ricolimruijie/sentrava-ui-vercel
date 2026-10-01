import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ROLES } from '@/constants'

export function useRole() {
  const auth = useAuthStore()

  const isSuperAdmin = computed(() => auth.role === ROLES.SUPER_ADMIN)
  const isAdmin      = computed(() => auth.role === ROLES.ADMIN)
  const isMember     = computed(() => auth.role === ROLES.MEMBER)
  const isClientRole = computed(() => !isSuperAdmin.value && auth.isAuthenticated)

  // Permission matrix from the PRD (section 9.2). Anything not listed here is
  // open to every role (view/register assets, start scans, findings, tags,
  // reports, activity log), so only the restricted actions need a key.
  const S = ROLES.SUPER_ADMIN, A = ROLES.ADMIN, M = ROLES.MEMBER
  const PERMISSIONS = {
    delete_asset:    [S, A],
    delete_scan:     [S, A],
    manage_api_keys: [S, A],      // create, rename, revoke
    create_ticket:   [A, M],
    close_ticket:    [S],
    // Company: create company/sub-company, edit/delete, invite, remove user,
    // change role, Company Configuration, Quota Information, activation.
    manage_company:  [S],
  }

  function can(action) {
    return PERMISSIONS[action]?.includes(auth.role) ?? false
  }

  return { isSuperAdmin, isAdmin, isMember, isClientRole, can }
}
