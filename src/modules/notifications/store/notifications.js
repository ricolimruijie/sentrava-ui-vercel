import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/modules/notifications/services/notificationsService'
import { TABS, inTab, PANEL_LIMIT, POLL_MS, NOTIFICATIONS_EVENT } from '@/modules/notifications/utils/catalogue'

// The signed-in user's notifications. The server already returns only what this user may see
// (role, company, retention), newest first, each with a per-user `read` flag. The store polls
// every 30 seconds so new ones show up within the PRD's 30 second delivery window.
export const useNotificationStore = defineStore('notifications', () => {
  const items = ref([])
  const loaded = ref(false)
  let timer = null
  let forUserId = null
  // Bumped on every read/unread change. A fetch that started before the latest change is stale
  // (it may still carry the old read flags), so its result is dropped and a fresh one is taken.
  let changeSeq = 0

  const unreadCount = computed(() => items.value.filter((n) => !n.read).length)
  // The panel shows the 50 most recent; "View all" shows everything inside the 90 day window.
  const recent = computed(() => items.value.slice(0, PANEL_LIMIT))
  const unreadByTab = computed(() =>
    Object.fromEntries(TABS.map((t) => [t.key, items.value.filter((n) => !n.read && inTab(n, t.key)).length])),
  )
  const forTab = (tab, list = items.value) => list.filter((n) => inTab(n, tab))

  async function fetch() {
    const seq = changeSeq
    try {
      const fresh = (await getNotifications()) ?? []
      if (seq !== changeSeq) return
      items.value = fresh
      loaded.value = true
    } catch { /* keep what we have; the next poll retries */ }
  }

  async function markRead(id) {
    const n = items.value.find((x) => x.id === id)
    if (!n || n.read) return
    changeSeq++
    n.read = true // optimistic
    try { await markNotificationRead(id) } catch { n.read = false }
    fetch()
  }

  async function markAllRead() {
    const unread = items.value.filter((n) => !n.read)
    if (!unread.length) return
    changeSeq++
    unread.forEach((n) => { n.read = true }) // optimistic
    try { await markAllNotificationsRead() } catch { unread.forEach((n) => { n.read = false }) }
    fetch()
  }

  function start() {
    stop()
    const uid = useAuthStore().user?.id ?? null
    if (uid !== forUserId) { items.value = []; loaded.value = false; forUserId = uid } // never show another user's items
    fetch()
    timer = setInterval(fetch, POLL_MS)
    window.addEventListener(NOTIFICATIONS_EVENT, fetch)
  }
  function stop() {
    clearInterval(timer); timer = null
    window.removeEventListener(NOTIFICATIONS_EVENT, fetch)
  }

  return { items, loaded, unreadCount, recent, unreadByTab, forTab, fetch, markRead, markAllRead, start, stop }
})
