import { watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCompanyStore } from '@/stores/company'
import { useAuthStore }    from '@/stores/auth'

export function useCompanyContext() {
  const route        = useRoute()
  const router       = useRouter()
  const companyStore = useCompanyStore()
  const authStore    = useAuthStore()

  // Sync URL → store on mount
  const qCompany = route.query.company
  if (qCompany) companyStore.setActiveCompany(qCompany)

  const activeCompany = computed(() => companyStore.activeCompany)
  const companies     = computed(() => authStore.companies)

  function switchCompany(id) {
    companyStore.setActiveCompany(id)
    router.replace({ query: { ...route.query, company: id } })
  }

  // Keep URL in sync with store changes
  watch(
    () => companyStore.activeCompanyId,
    (id) => {
      if (id && route.query.company !== id) {
        router.replace({ query: { ...route.query, company: id } })
      }
    }
  )

  return { activeCompany, companies, switchCompany }
}
