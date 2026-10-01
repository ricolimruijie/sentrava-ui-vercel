<script setup>
import { computed } from 'vue'
import { IconScan, IconListSearch, IconShieldCheck, IconServer, IconKey, IconTicket, IconUsers, IconBell, IconArrowUpRight } from '@tabler/icons-vue'
import { timeAgo } from '@/utils/helpers'

// One notification row: icon, title, message, relative time and an unread dot. Clicking the row
// marks it as read (`read`); the arrow button on the right opens the related page (`open`), the same
// "↗" button the tables use. There is deliberately no dismiss button (PRD 11.1: notifications are a
// persistent history log).
const props = defineProps({
  item: { type: Object, required: true },
})
defineEmits(['read', 'open'])

const ICONS = { 'N-SC': IconScan, 'N-AI': IconListSearch, 'N-RV': IconShieldCheck, 'N-IN': IconServer, 'N-CD': IconKey, 'N-TK': IconTicket, 'N-UM': IconUsers }
const icon = computed(() => ICONS[props.item.code.slice(0, 4)] ?? IconBell)
// Failures / offline states read as warnings; everything else is neutral.
const warn = computed(() => ['N-SC-02', 'N-AI-02', 'N-IN-01', 'N-IN-02', 'N-CD-02'].includes(props.item.code))
</script>

<template>
  <div
    class="n-item"
    :class="{ 'n-item--unread': !item.read }"
    role="button"
    tabindex="0"
    :aria-label="item.read ? item.title : `${item.title} (unread, press to mark as read)`"
    @click="$emit('read', item)"
    @keydown.enter.self="$emit('read', item)"
  >
    <span v-if="!item.read" class="n-item__dot" aria-label="Unread" />
    <span class="n-item__icon" :class="{ 'n-item__icon--warn': warn }"><component :is="icon" :size="18" /></span>
    <span class="n-item__body">
      <span class="n-item__title">{{ item.title }}</span>
      <span class="n-item__msg">{{ item.message }}</span>
      <span class="n-item__time">{{ timeAgo(item.createdAt) }}</span>
    </span>
    <span class="n-item__side">
      <button
        v-if="item.link"
        type="button"
        class="n-item__go"
        :aria-label="`Open: ${item.title}`"
        title="Open"
        @click.stop="$emit('open', item)"
      >
        <IconArrowUpRight :size="16" />
      </button>
    </span>
  </div>
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
  position: relative;
  box-sizing: border-box;
  &:focus-visible { outline: 2px solid var(--glacia-red); outline-offset: -2px; }

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
  &__side { flex: none; display: flex; align-items: center; align-self: stretch; }
  // Unread dot on the left edge of the row, level with the middle of the icon.
  &__dot { position: absolute; left: 5px; top: 25px; width: 8px; height: 8px; border-radius: 50%; background: var(--glacia-red); }
  // Same arrow button as the "view" action in the tables.
  &__go {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: var(--glacia-radius-sm);
    background: none;
    color: var(--glacia-ink-dim);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.13s, color 0.13s;
    &:hover { background: rgba(0, 0, 0, 0.05); color: var(--glacia-ink); }
  }
}
</style>
