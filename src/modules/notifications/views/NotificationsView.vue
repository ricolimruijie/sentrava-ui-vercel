<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IconChecks, IconBellOff } from '@tabler/icons-vue'
import NotificationItem from '@/modules/notifications/components/NotificationItem.vue'
import NotificationTabs from '@/modules/notifications/components/NotificationTabs.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import { useNotificationStore } from '@/modules/notifications/store/notifications'
import { usePagination } from '@/composables/usePagination'
import { RETENTION_DAYS } from '@/modules/notifications/utils/catalogue'

// "View all": the full history inside the 90 day retention window (the panel only shows the 50 most recent).
const store = useNotificationStore()
const router = useRouter()
const tab = ref('all')
const pagination = usePagination({ pageSize: 20 })

const filtered = computed(() => store.forTab(tab.value))
const pageItems = computed(() => filtered.value.slice(pagination.offset.value, pagination.offset.value + pagination.pageSize.value))
watch(filtered, (list) => pagination.setTotal(list.length), { immediate: true })
watch(tab, () => pagination.reset())

onMounted(() => store.fetch())

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

    <NotificationTabs v-model="tab" :unread="store.unreadByTab" />

    <section class="notifs__card">
      <NotificationItem v-for="n in pageItems" :key="n.id" :item="n" @open="openItem" />
      <div v-if="!filtered.length" class="notifs__empty">
        <span class="notifs__empty-icon"><IconBellOff :size="30" stroke-width="1.5" /></span>
        <p>No notifications here yet</p>
      </div>
    </section>

    <TablePagination v-if="pagination.totalPages.value > 1" :pagination="pagination" />
  </div>
</template>

<style scoped lang="scss">
.notifs {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 880px;

  &__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
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
  &__card {
    background: var(--surface);
    border: 1px solid var(--glacia-glass-border);
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    overflow: hidden;
  }
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
</style>
