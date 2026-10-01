import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedState from 'pinia-plugin-persistedstate'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'

import router from './router'
import App from './App.vue'
import { initTheme } from '@/composables/useTheme'
import '@/styles/design-tokens.css'
import '@/styles/main.scss'
import 'primeicons/primeicons.css'

// ── Custom brand preset ──────────────────────────────────────────────────────
const SentraPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#fff1f1',
      100: '#ffe0e0',
      200: '#ffc7c7',
      300: '#ffa0a0',
      400: '#ff6b6d',
      500: '#FF2529',
      600: '#f01316',
      700: '#cc0d10',
      800: '#a70f11',
      900: '#8a1315',
      950: '#4c0506',
    },
  },
})

initTheme()

// ── Pinia ─────────────────────────────────────────────────────────────────────
const pinia = createPinia()
pinia.use(piniaPersistedState)

// ── App ───────────────────────────────────────────────────────────────────────
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: SentraPreset,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark',
      cssLayer: false,
    },
  },
})
app.use(ToastService)
app.directive('tooltip', Tooltip)

// ── Boot ──────────────────────────────────────────────────────────────────────
;(async () => {
  if (import.meta.env.VITE_IS_STATIC === 'true') {
    await import('./mocks/index.js')
  }

  // Restore auth state from localStorage before the router's first navigation
  const { useAuthStore } = await import('@/stores/auth')
  useAuthStore().hydrateFromStorage()

  app.mount('#app')
})()
