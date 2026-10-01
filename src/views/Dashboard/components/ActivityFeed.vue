<script setup>
import { activityColor, formatRelativeTime } from '@/utils/helpers'

defineProps({
  items:   { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})

const CATEGORY_LABEL = {
  scan_completed:        'Scan Done',
  scan_started:          'Scan Started',
  vulnerability_found:   'Vuln Found',
  vulnerability_resolved:'Vuln Resolved',
  ticket_created:        'Ticket Created',
  asset_added:           'Asset Added',
}

function catLabel(c) { return CATEGORY_LABEL[c] ?? c }
</script>

<template>
  <div class="activity card">
    <div class="activity__header">
      <span class="card-title">Activity Feed</span>
      <span class="activity__count">{{ items.length }} events</span>
    </div>

    <div class="timeline">
      <div class="tl-track">
        <div
          v-for="(item, idx) in items"
          :key="item.id"
          class="tl-event"
        >
          <!-- connector line (before event, except first) -->
          <div v-if="idx > 0" class="tl-line" />

          <div class="tl-dot-wrap">
            <span class="tl-dot" :style="{ background: activityColor(item.category) }" />
          </div>

          <div class="tl-card">
            <span
              class="tl-card__badge"
              :style="{
                background: activityColor(item.category) + '18',
                color: activityColor(item.category)
              }"
            >{{ catLabel(item.category) }}</span>
            <p class="tl-card__msg">{{ item.message }}</p>
            <div class="tl-card__meta">
              <span class="tl-card__user">{{ item.user }}</span>
              <span class="tl-card__sep">·</span>
              <span class="tl-card__time">{{ formatRelativeTime(item.timestamp) }}</span>
            </div>
          </div>
        </div>

        <div v-if="!items.length && !loading" class="tl-empty">No recent activity.</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.activity {
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  &__count {
    font-size: 11px;
    color: #94A3B8;
    font-weight: 500;
  }
}

.timeline {
  overflow-x: auto;
  overflow-y: visible;
  padding-bottom: 4px;

  &::-webkit-scrollbar        { height: 4px; }
  &::-webkit-scrollbar-track  { background: transparent; }
  &::-webkit-scrollbar-thumb  { background: var(--surface-3); border-radius: 2px; }
}

.tl-track {
  display: flex;
  align-items: flex-start;
  min-width: max-content;
  padding: 8px 4px 4px;
  gap: 0;
}

.tl-event {
  display: flex;
  align-items: flex-start;
  flex-shrink: 0;
  gap: 0;
}

.tl-line {
  width: 36px;
  height: 1px;
  background: var(--surface-3);
  margin-top: 11px;
  flex-shrink: 0;
}

.tl-dot-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  padding-top: 5px;
}

.tl-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 0 3px #fff, 0 0 0 4px currentColor;
  flex-shrink: 0;
}

.tl-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 190px;
  background: var(--surface-2);
  border: 1px solid var(--hairline);
  border-radius: 10px;
  padding: 10px 12px;
  margin-left: 10px;
  transition: border-color .15s, box-shadow .15s;

  &:hover {
    border-color: var(--hairline-strong);
    box-shadow: 0 2px 8px rgba(0,0,0,.06);
  }

  &__badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 20px;
    align-self: flex-start;
    white-space: nowrap;
  }

  &__msg {
    font-size: 11px;
    font-weight: 600;
    color: var(--glacia-ink);
    line-height: 1.4;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
  }

  &__user, &__time, &__sep {
    font-size: 10px;
    color: #94A3B8;
  }

  &__user { font-weight: 500; }
}

.tl-empty {
  padding: 20px;
  text-align: center;
  font-size: 12px;
  color: #94A3B8;
}
</style>
