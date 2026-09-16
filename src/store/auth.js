import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { post } from '@/utils/request'
import { ROLES } from '@/utils/constants'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(null)
  const token = ref(null)

  const isAuthenticated = computed(() => !!token.value)
  const role            = computed(() => user.value?.role ?? null)
  const isSuperAdmin    = computed(() => role.value === ROLES.SUPER_ADMIN)
  const companies       = computed(() => user.value?.companies ?? [])

  async function login(email, password) {
    const res = await post('/auth/login', { email, password })
    token.value = res.token
    user.value  = res.user
    localStorage.setItem('sentra_token', res.token)
  }

  function logout() {
    user.value  = null
    token.value = null
    localStorage.removeItem('sentra_token')
    localStorage.removeItem('auth')
    localStorage.removeItem('company')
  }

  function hydrateFromStorage() {
    // Primary: read from pinia-plugin-persistedstate's key
    try {
      const persisted = JSON.parse(localStorage.getItem('auth') ?? 'null')
      if (persisted?.token) token.value = persisted.token
      if (persisted?.user)  user.value  = persisted.user
    } catch {}
    // Fallback: bare token written by login()
    if (!token.value) {
      const bare = localStorage.getItem('sentra_token')
      if (bare) token.value = bare
    }
  }

  return { user, token, isAuthenticated, role, isSuperAdmin, companies, login, logout, hydrateFromStorage }
}, {
  persist: {
    pick: ['user', 'token'],
  },
})
