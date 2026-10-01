<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconChecks, IconBellOff } from '@tabler/icons-vue'
import NotificationItem from '@/modules/notifications/components/NotificationItem.vue'
import PillTabs from '@/components/common/PillTabs.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import { useNotificationStore } from '@/modules/notifications/store/notifications'
import { usePagination } from '@/composables/usePagination'
import { TABS, RETENTION_DAYS } from '@/modules/notifications/utils/catalogue'

// "View all": the full history inside the 90 day retention window (the panel only shows the 50 most
// recent). Tabs, transitions and URL sync work like the Company page: the active tab lives in ?tab=
// (see router meta.tabQuery) so the breadcrumb shows it, and the content slides in the direction you moved.
const store = useNotificationStore()
const route = useRoute()
const router = useRouter()
const pagination = usePagination({ pageSize: 20 })

const tabs = computed(() => TABS.map((t) => ({ ...t, badge: store.unreadByTab[t.key] })))
const keys = TABS.map((t) => t.key)
const tab = ref(keys.includes(route.query.tab) ? route.query.tab : 'all')
const tabTransition = ref('tab-forward')

function selectTab(key) {
  if (key === tab.value) return
  tabTransition.value = keys.indexOf(key) >= keys.indexOf(tab.value) ? 'tab-forward' : 'tab-backward'
  tab.value = key
  router.replace({ query: { ...route.query, tab: key } })
}

// Keep the tab in step with the URL both ways (back/forward, and always write it so the breadcrumb has it).
watch(() => route.query.tab, (val) => {
  const next = keys.includes(val) ? val : 'all'
  if (next !== tab.value) {
    tabTransition.value = keys.indexOf(next) >= keys.indexOf(tab.value) ? 'tab-forward' : 'tab-backward'
    tab.value = next
  }
  if (route.query.tab !== next) router.replace({ query: { ...route.query, tab: next } })
}, { immediate: true })

const filtered = computed(() => store.forTab(tab.value))
const pageItems = computed(() => filtered.value.slice(pagination.offset.value, pagination.offset.value + pagination.pageSize.value))
watch(filtered, (list) => pagination.setTotal(list.length), { immediate: true })
watch(tab, () => pagination.reset())

onMounted(() => store.fetch())

function markRead(n) { store.markRead(n.id) }
function openItem(n) {
  store.markRead(n.id)
  if (n.link) router.push(n.link)
}
</script>

<template>
  <div class="notifs">
    <header class="notifs__head">
      <div>
        <h1 class="notifs__title">Notifications</h1>
        <p class="notifs__sub">Everything from the last {{ RETENTION_DAYS }} days. Notifications are a history log and can't be dismissed.</p>
      </div>
      <button type="button" class="notifs__markall" :disabled="!store.unreadCount" @click="store.markAllRead()">
        <IconChecks :size="16" /> Mark all as read
      </button>
    </header>

    <div class="notifs__panel card">
      <PillTabs :model-value="tab" :tabs="tabs" equal @update:model-value="selectTab" />

      <Transition :name="tabTransition" mode="out-in">
        <div :key="tab" class="notifs__content">
          <div class="notifs__list">
            <NotificationItem v-for="n in pageItems" :key="n.id" :item="n" @read="markRead" @open="openItem" />
            <div v-if="!filtered.length" class="notifs__empty">
              <span class="notifs__empty-icon"><IconBellOff :size="30" stroke-width="1.5" /></span>
              <p>No notifications here yet</p>
            </div>
          </div>
          <TablePagination v-if="pagination.totalPages.value > 1" :pagination="pagination" class="notifs__pager" />
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
.notifs {
  display: flex;
  flex-direction: column;
  gap: 20px;
  // Fills the whole content area: full width, and as tall as the screen so the header and tabs stay
  // put while the list scrolls inside the card.
  width: 100%;
  height: 100%;
  min-height: 420px;

  &__head { flex-shrink: 0; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  &__title { margin: 0; font-family: 'Manrope', 'Inter', sans-serif; font-size: 24px; font-weight: 800; color: var(--glacia-ink); }
  &__sub { margin: 4px 0 0; font-size: 13px; color: var(--glacia-ink-dim); }
  &__markall {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 14px;
    border: 1px solid var(--glacia-glass-border);
    border-radius: var(--glacia-radius-pill);
    background: var(--surface);
    color: var(--glacia-ink);
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    &:hover:not(:disabled) { background: var(--glacia-glass-fill-strong); }
    &:disabled { opacity: 0.5; cursor: default; }
  }

  // Same surface as the Company page's panel: tabs on top, the active tab's content below.
  &__panel {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  &__content { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
  &__list {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    border: 1px solid var(--glacia-glass-border);
    border-radius: 12px;
  }
  &__pager { flex-shrink: 0; margin-top: 0; }
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 56px 16px;
    color: var(--glacia-ink-dim);
    font-size: 14px;
    p { margin: 0; }
  }
  &__empty-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 1.5px dashed var(--glacia-glass-border);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}

// Slide between tabs, in the direction you moved (same as the Company page).
.tab-forward-enter-active,
.tab-forward-leave-active,
.tab-backward-enter-active,
.tab-backward-leave-active {
  transition: opacity 0.2s ease, transform 0.22s cubic-bezier(0.34, 0.8, 0.6, 1);
}
.tab-forward-enter-from  { opacity: 0; transform: translateX(18px); }
.tab-forward-leave-to    { opacity: 0; transform: translateX(-18px); }
.tab-backward-enter-from { opacity: 0; transform: translateX(-18px); }
.tab-backward-leave-to   { opacity: 0; transform: translateX(18px); }
</style>
