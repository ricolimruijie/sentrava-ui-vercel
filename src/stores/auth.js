import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { login as loginRequest } from '@/modules/auth/services/authService'
import { ROLES } from '@/constants'
import { emptyData } from '@/utils/dataMode'
import { sessionStatus } from '@/modules/auth/utils/session'

// Read once by the login page to explain why the user was signed out.
export const LOGOUT_REASON_KEY = 'sentra_logout_reason'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(null)
  const token = ref(null)
  // Session clocks (PRD 2.2): when the user logged in and when they last did anything.
  const loginAt = ref(null)
  const lastActivityAt = ref(null)

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
    loginAt.value = lastActivityAt.value = Date.now()
    localStorage.setItem('sentra_token', res.token)
    localStorage.removeItem(LOGOUT_REASON_KEY)
  }

  // Record user activity (the idle timer restarts).
  function touch() {
    if (token.value) lastActivityAt.value = Date.now()
  }

  // Sign the user out if the idle (15 min) or absolute (8 h) limit has passed.
  // Returns the reason ('idle' | 'expired') when it did, otherwise null.
  function checkSession(now = Date.now()) {
    if (!token.value) return null
    // Another tab may have been active more recently than this one.
    let persistedActivity = 0
    try { persistedActivity = JSON.parse(localStorage.getItem('auth') ?? 'null')?.lastActivityAt ?? 0 } catch { /* ignore */ }
    const status = sessionStatus({ loginAt: loginAt.value, lastActivityAt: Math.max(lastActivityAt.value ?? 0, persistedActivity) || null }, now)
    if (status === 'ok') return null
    logout(status)
    return status
  }

  // Settings page actions (mock mode keeps them on the persisted user only).
  function updateProfile(patch) {
    user.value = { ...user.value, ...patch }
  }
  function setTwoFactor(enabled) {
    user.value = { ...user.value, twoFAEnabled: enabled }
  }

  // `reason` ('idle' | 'expired') is shown on the login page.
  function logout(reason = null) {
    user.value  = null
    token.value = null
    loginAt.value = null
    lastActivityAt.value = null
    localStorage.removeItem('sentra_token')
    localStorage.removeItem('auth')
    localStorage.removeItem('company')
    try {
      if (reason) localStorage.setItem(LOGOUT_REASON_KEY, reason)
      else localStorage.removeItem(LOGOUT_REASON_KEY)
    } catch { /* ignore */ }
  }

  function hydrateFromStorage() {
    // Primary: read from pinia-plugin-persistedstate's key
    try {
      const persisted = JSON.parse(localStorage.getItem('auth') ?? 'null')
      if (persisted?.token) token.value = persisted.token
      if (persisted?.user)  user.value  = persisted.user
      if (persisted?.loginAt) loginAt.value = persisted.loginAt
      if (persisted?.lastActivityAt) lastActivityAt.value = persisted.lastActivityAt
    } catch { /* ignore: not available / not critical */ }
    // Fallback: bare token written by login()
    if (!token.value) {
      const bare = localStorage.getItem('sentra_token')
      if (bare) token.value = bare
    }
    // A session restored from an older version has no clocks yet: start them now.
    if (token.value && !loginAt.value) loginAt.value = lastActivityAt.value = Date.now()
    // The browser may have been closed for longer than the limits allow.
    checkSession()
  }

  return { user, token, loginAt, lastActivityAt, isAuthenticated, role, isSuperAdmin, companies, twoFAEnabled, login, touch, checkSession, updateProfile, setTwoFactor, logout, hydrateFromStorage }
}, {
  persist: {
    pick: ['user', 'token', 'loginAt', 'lastActivityAt'],
  },
})
