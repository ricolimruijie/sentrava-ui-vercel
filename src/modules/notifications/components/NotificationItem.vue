<script setup>
import { computed } from 'vue'
import { IconScan, IconListSearch, IconShieldCheck, IconServer, IconKey, IconTicket, IconUsers, IconBell } from '@tabler/icons-vue'
import { timeAgo } from '@/utils/helpers'

// One notification row: icon, title, message, relative time and an unread dot. Clicking opens
// the related page. There is deliberately no dismiss button (PRD 11.1: notifications are a
// persistent history log).
const props = defineProps({
  item: { type: Object, required: true },
})
defineEmits(['open'])

const ICONS = { 'N-SC': IconScan, 'N-AI': IconListSearch, 'N-RV': IconShieldCheck, 'N-IN': IconServer, 'N-CD': IconKey, 'N-TK': IconTicket, 'N-UM': IconUsers }
const icon = computed(() => ICONS[props.item.code.slice(0, 4)] ?? IconBell)
// Failures / offline states read as warnings; everything else is neutral.
const warn = computed(() => ['N-SC-02', 'N-AI-02', 'N-IN-01', 'N-IN-02', 'N-CD-02'].includes(props.item.code))
</script>

<template>
  <button type="button" class="n-item" :class="{ 'n-item--unread': !item.read }" @click="$emit('open', item)">
    <span class="n-item__icon" :class="{ 'n-item__icon--warn': warn }"><component :is="icon" :size="18" /></span>
    <span class="n-item__body">
      <span class="n-item__title">{{ item.title }}</span>
      <span class="n-item__msg">{{ item.message }}</span>
      <span class="n-item__time">{{ timeAgo(item.createdAt) }}</span>
    </span>
    <span v-if="!item.read" class="n-item__dot" aria-label="Unread" />
  </button>
</template>

<style scoped lang="scss">
.n-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-bottom: 1px solid var(--glacia-glass-border);
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  color: var(--glacia-ink);
  transition: background 0.13s;

  &:hover { background: var(--glacia-glass-fill-strong); }
  &:last-child { border-bottom: none; }
  &--unread { background: rgba(var(--tint), 0.035); }

  &__icon {
    flex: none;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--tint), 0.07);
    color: var(--glacia-ink-dim);
    &--warn { background: rgba(255, 37, 41, 0.1); color: var(--glacia-red); }
  }
  &__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  &__title { font-size: 13px; font-weight: 600; line-height: 1.3; }
  &--unread &__title { font-weight: 700; }
  &__msg { font-size: 12.5px; line-height: 1.45; color: var(--glacia-ink-dim); overflow-wrap: anywhere; }
  &__time { font-size: 11.5px; color: var(--glacia-ink-dim); opacity: 0.8; }
  &__dot { flex: none; width: 8px; height: 8px; margin-top: 6px; border-radius: 50%; background: var(--glacia-red); }
}
</style>
