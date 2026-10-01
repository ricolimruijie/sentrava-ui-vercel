import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { login as loginRequest } from '@/modules/auth/services/authService'
import { ROLES } from '@/constants'
import { emptyData } from '@/utils/dataMode'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(null)
  const token = ref(null)

  const isAuthenticated = computed(() => !!token.value)
  const role            = computed(() => user.value?.role ?? null)
  const isSuperAdmin    = computed(() => role.value === ROLES.SUPER_ADMIN)
  const companies       = computed(() => user.value?.companies ?? [])
  const twoFAEnabled    = computed(() => !!user.value?.twoFAEnabled)

  // Demo accounts flagged `dataMode: 'empty'` see every page without data.
  watch(user, (u) => { emptyData.value = u?.dataMode === 'empty' }, { immediate: true })

  // `dataMode: 'empty'` (demo only) signs in with every page shown without data, for any role.
  async function login(email, password, { dataMode } = {}) {
    const res = await loginRequest(email, password, dataMode)
    token.value = res.token
    user.value  = res.user
    localStorage.setItem('sentra_token', res.token)
  }

  // Settings page actions (mock mode keeps them on the persisted user only).
  function updateProfile(patch) {
    user.value = { ...user.value, ...patch }
  }
  function setTwoFactor(enabled) {
    user.value = { ...user.value, twoFAEnabled: enabled }
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
    } catch { /* ignore: not available / not critical */ }
    // Fallback: bare token written by login()
    if (!token.value) {
      const bare = localStorage.getItem('sentra_token')
      if (bare) token.value = bare
    }
  }

  return { user, token, isAuthenticated, role, isSuperAdmin, companies, twoFAEnabled, login, updateProfile, setTwoFactor, logout, hydrateFromStorage }
}, {
  persist: {
    pick: ['user', 'token'],
  },
})
