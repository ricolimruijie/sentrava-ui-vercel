import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

export const useCompanyStore = defineStore('company', () => {
  const activeCompanyId = ref(null)

  const activeCompany = computed(() => {
    const auth = useAuthStore()
    if (!activeCompanyId.value) return auth.companies[0] ?? null
    return auth.companies.find(c => c.id === activeCompanyId.value) ?? auth.companies[0] ?? null
  })

  function setActiveCompany(id) {
    activeCompanyId.value = id
  }

  return { activeCompanyId, activeCompany, setActiveCompany }
}, {
  persist: { pick: ['activeCompanyId'] },
})
