<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { IconBell, IconChecks, IconBellOff } from '@tabler/icons-vue'
import NotificationItem from '@/modules/notifications/components/NotificationItem.vue'
import NotificationTabs from '@/modules/notifications/components/NotificationTabs.vue'
import { useNotificationStore } from '@/modules/notifications/store/notifications'
import { PANEL_LIMIT } from '@/modules/notifications/utils/catalogue'

// The bell in the top navigation (on every page): unread badge, and a panel with the five tabs,
// the 50 most recent notifications, "Mark all as read" and a "View all" link (PRD section 11).
const store = useNotificationStore()
const router = useRouter()

const open = ref(false)
const tab = ref('all')
const root = ref(null)

const visible = computed(() => store.forTab(tab.value, store.recent))
const badge = computed(() => (store.unreadCount > 99 ? '99+' : String(store.unreadCount)))

function toggle() { open.value = !open.value }
function close() { open.value = false }

async function openItem(n) {
  store.markRead(n.id)
  close()
  if (n.link) router.push(n.link)
}
function viewAll() { close(); router.push('/notifications') }

function onOutside(e) { if (open.value && root.value && !root.value.contains(e.target)) close() }
function onKey(e) { if (e.key === 'Escape') close() }

onMounted(() => {
  store.start()
  document.addEventListener('mousedown', onOutside)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  store.stop()
  document.removeEventListener('mousedown', onOutside)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="root" class="notif">
    <button
      type="button"
      class="notif__btn"
      :class="{ 'notif__btn--open': open }"
      :aria-label="store.unreadCount ? `Notifications, ${store.unreadCount} unread` : 'Notifications'"
      aria-haspopup="dialog"
      :aria-expanded="open"
      @click="toggle"
    >
      <IconBell :size="18" />
      <span v-if="store.unreadCount" class="notif__badge">{{ badge }}</span>
    </button>

    <transition name="notif-pop">
      <div v-if="open" class="notif__panel" role="dialog" aria-label="Notifications">
        <div class="notif__head">
          <h2 class="notif__title">Notifications</h2>
          <button type="button" class="notif__markall" :disabled="!store.unreadCount" @click="store.markAllRead()">
            <IconChecks :size="15" /> Mark all as read
          </button>
        </div>

        <NotificationTabs v-model="tab" :unread="store.unreadByTab" class="notif__tabs" />

        <div class="notif__list">
          <NotificationItem v-for="n in visible" :key="n.id" :item="n" @read="store.markRead($event.id)" @open="openItem" />
          <div v-if="!visible.length" class="notif__empty">
            <span class="notif__empty-icon"><IconBellOff :size="26" stroke-width="1.5" /></span>
            <p>No notifications here yet</p>
          </div>
        </div>

        <div class="notif__foot">
          <button type="button" class="notif__viewall" @click="viewAll">
            View all<template v-if="store.items.length > PANEL_LIMIT"> ({{ store.items.length }})</template>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped lang="scss" src="./NotificationBell.scss"></style>
