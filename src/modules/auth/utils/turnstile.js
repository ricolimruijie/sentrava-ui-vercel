// Cloudflare Turnstile: loads Cloudflare's script once and renders its own widget.
// Without VITE_TURNSTILE_SITE_KEY we use Cloudflare's documented test key (always passes,
// shows the real widget); a real key and server-side token check are needed for production.
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
export const TEST_SITE_KEY = '1x00000000000000000000AA'
export const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || TEST_SITE_KEY

let loading = null
export function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = SCRIPT_SRC
      s.async = true
      s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile unavailable')))
      s.onerror = () => { loading = null; s.remove(); reject(new Error('Turnstile failed to load')) }
      document.head.appendChild(s)
    })
  }
  return loading
}
