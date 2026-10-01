import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ROLES } from '@/constants'

export function useRole() {
  const auth = useAuthStore()

  const isSuperAdmin = computed(() => auth.role === ROLES.SUPER_ADMIN)
  const isAdmin      = computed(() => auth.role === ROLES.ADMIN)
  const isMember     = computed(() => auth.role === ROLES.MEMBER)
  const isClientRole = computed(() => !isSuperAdmin.value && auth.isAuthenticated)

  function can(action) {
    const role = auth.role
    const perms = {
      run_scan:       [ROLES.SUPER_ADMIN, ROLES.ADMIN],
      manage_users:   [ROLES.SUPER_ADMIN, ROLES.ADMIN],
      manage_billing: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
      view_reports:   [ROLES.SUPER_ADMIN, ROLES.ADMIN],
      view_dashboard: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MEMBER],
      schedule_scans: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    }
    return perms[action]?.includes(role) ?? false
  }

  return { isSuperAdmin, isAdmin, isMember, isClientRole, can }
}
