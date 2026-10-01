import { ref } from 'vue'

// Light/dark theme. The choice is remembered in localStorage and applied as a
// `dark` class on <html> (PrimeVue's darkModeSelector and the html.dark token
// overrides in design-tokens.css both key off it). Defaults to light.
const KEY = 'sentra_theme'
export const isDark = ref(false)

function apply() {
  document.documentElement.classList.toggle('dark', isDark.value)
}

export function initTheme() {
  let saved = null
  try { saved = localStorage.getItem(KEY) } catch { /* storage blocked */ }
  isDark.value = saved === 'dark'
  apply()
}

export function useTheme() {
  function toggle() {
    isDark.value = !isDark.value
    apply()
    try { localStorage.setItem(KEY, isDark.value ? 'dark' : 'light') } catch { /* storage blocked */ }
  }
  return { isDark, toggle }
}
