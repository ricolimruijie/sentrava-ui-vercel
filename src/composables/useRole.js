import { computed } from 'vue'
import { useAuthStore } from '@/store/auth'
import { ROLES } from '@/utils/constants'

export function useRole() {
  const auth = useAuthStore()

  const isSuperAdmin = computed(() => auth.role === ROLES.SUPER_ADMIN)
  const isAdmin      = computed(() => auth.role === ROLES.ADMIN)
  const isAnalyst    = computed(() => auth.role === ROLES.ANALYST)
  const isMember     = computed(() => auth.role === ROLES.MEMBER)
  const isClientRole = computed(() => !isSuperAdmin.value && auth.isAuthenticated)

  // Analysts might span multiple companies
  const isMultiCompanyAnalyst = computed(() =>
    isAnalyst.value && (auth.companies?.length ?? 0) > 1
  )

  function can(action) {
    const role = auth.role
    const perms = {
      run_scan:       [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ANALYST],
      manage_users:   [ROLES.SUPER_ADMIN, ROLES.ADMIN],
      manage_billing: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
      view_reports:   [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ANALYST],
      view_dashboard: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ANALYST, ROLES.MEMBER],
      schedule_scans: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ANALYST],
    }
    return perms[action]?.includes(role) ?? false
  }

  return { isSuperAdmin, isAdmin, isAnalyst, isMember, isClientRole, isMultiCompanyAnalyst, can }
}
