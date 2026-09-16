<script setup>
import { IconChevronRight, IconArrowRight } from '@tabler/icons-vue'

defineProps({
  items:   { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <div class="tickets card">
    <div class="tickets__head">
      <span class="card-title">Ticket Feed</span>
      <a class="tickets__all" href="#" @click.prevent>
        All tickets <IconArrowRight :size="11" />
      </a>
    </div>

    <div class="tickets__list">
      <div v-if="loading" class="tickets__empty">Loading…</div>
      <div v-else-if="!items.length" class="tickets__empty">No tickets.</div>

      <div
        v-for="item in items"
        :key="item.id"
        class="trow"
        :style="{ '--tc': item.color ?? '#FF2529' }"
      >
        <div class="trow__accent" />
        <div class="trow__body">
          <div class="trow__top">
            <span class="trow__cat">{{ item.label }}</span>
          </div>
          <span class="trow__name">{{ item.name }}</span>
        </div>
        <button class="arrow-btn"><IconChevronRight :size="11" /></button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tickets {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__all {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    font-weight: 600;
    color: var(--glacia-red);
    text-decoration: none;
    transition: opacity 0.13s;

    &:hover { opacity: 0.75; }
  }

  &__list {
    border: 1px solid rgba(0,0,0,0.07);
    border-radius: var(--glacia-radius-sm);
    overflow: hidden;
    flex: 1;
    background: rgba(255,255,255,0.40);
  }

  &__empty {
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: var(--glacia-ink-dim);
  }
}

.trow {
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  transition: background 0.13s;

  &:last-child { border-bottom: none; }
  &:hover { background: rgba(0,0,0,0.02); }

  &__accent {
    width: 3px;
    align-self: stretch;
    background: var(--tc);
    flex-shrink: 0;
    border-radius: 2px 0 0 2px;
  }

  &__body {
    flex: 1;
    min-width: 0;
    padding: 10px 12px;
  }

  &__top {
    margin-bottom: 3px;
  }

  &__cat {
    font-size: 10px;
    font-weight: 700;
    color: var(--tc);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__name {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--glacia-ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.arrow-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--glacia-red);
  color: #fff;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 12px;
  box-shadow: 0 2px 8px rgba(255,37,41,0.35);
  transition: background 0.15s;

  &:hover { background: #e01e22; }
}
</style>
