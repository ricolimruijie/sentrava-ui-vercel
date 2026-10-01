import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Keeps the signed-in session honest (PRD 2.2): any user activity restarts the 15 minute
// idle timer, and a periodic check signs the user out once the idle or 8 hour absolute
// limit has passed. Mount it once in the authenticated layout.
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'wheel']
const CHECK_EVERY_MS = 15_000
const TOUCH_THROTTLE_MS = 5_000

export function useSessionGuard() {
  const auth = useAuthStore()
  const router = useRouter()
  let lastTouch = 0
  let timer = null

  function onActivity() {
    const now = Date.now()
    if (now - lastTouch < TOUCH_THROTTLE_MS) return
    lastTouch = now
    auth.touch()
  }

  function check() {
    const reason = auth.checkSession()
    if (reason) router.replace({ name: 'login', query: { reason } })
  }

  onMounted(() => {
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))
    timer = setInterval(check, CHECK_EVERY_MS)
    check()
  })
  onBeforeUnmount(() => {
    ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity))
    clearInterval(timer)
  })
}
