<script setup>
import { IconChevronRight } from '@tabler/icons-vue'

defineProps({
  items:   { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <div class="tickets card">
    <div class="tickets__halo">
      <h2 class="tickets__title">Ticket Feed</h2>
    </div>

    <div class="tickets__body">
      <p class="tickets__caption">Latest support and security tickets raised by your team, grouped by category.</p>

      <div class="tickets__wrap">
        <table class="ttable">
          <thead>
            <tr>
              <th>Category</th>
              <th>Ticket</th>
              <th class="ttable__status">Status</th>
              <th class="ttable__arrow"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="4" class="ttable__empty">Loading…</td></tr>
            <tr v-else-if="!items.length"><td colspan="4" class="ttable__empty">No tickets.</td></tr>
            <tr v-for="item in items" :key="item.id">
              <td class="ttable__cat" :style="{ color: item.color ?? '#FF2529' }">{{ item.label }}</td>
              <td class="ttable__name">{{ item.name }}</td>
              <td class="ttable__status">
                <span class="status-pill" :class="item.status === 'resolved' ? 'resolved' : 'open'">
                  {{ item.status === 'resolved' ? 'Resolved' : 'Open' }}
                </span>
              </td>
              <td class="ttable__arrow">
                <button type="button" class="arrow-btn"><IconChevronRight :size="11" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tickets {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;

  &__halo {
    padding: 20px 22px 16px;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__body {
    padding: 0 22px 22px;
  }

  &__caption {
    margin: 0 0 12px;
    font-size: 13px;
    color: var(--glacia-ink-dim);
  }

  &__wrap {
    max-height: 369px; // header + 6 rows before scrolling kicks in
    overflow-y: auto;
    scrollbar-width: thin;

    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(15, 23, 42, 0.15);
      border-radius: var(--glacia-radius-pill);
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }
}

.ttable {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  table-layout: fixed;

  th {
    padding: 12px 14px 12px 0;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--glacia-ink-dim);
    border-bottom: 1px solid rgba(15, 23, 42, 0.1);
    white-space: nowrap;
  }

  td {
    padding: 14px 14px 14px 0;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    vertical-align: middle;
  }

  tr:last-child td { border-bottom: none; }

  &__cat {
    // Hugs "Application & System Failures" — the longest category label —
    // so it never truncates, instead of an arbitrary percentage.
    width: 228px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__name {
    color: var(--glacia-ink);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__status {
    width: 120px;
    text-align: center;
  }

  td.ttable__status,
  th.ttable__status {
    padding-left: 14px;
    text-align: center;
  }

  &__arrow {
    width: 64px;
    padding-right: 0;
  }

  td.ttable__arrow {
    padding-left: 24px;
  }

  &__empty {
    text-align: center;
    padding: 24px !important;
    color: var(--glacia-ink-dim);
  }
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--glacia-radius-pill);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;

  &.open {
    background: rgba(234, 88, 12, 0.12);
    color: #ea580c;
  }

  &.resolved {
    background: rgba(22, 163, 74, 0.12);
    color: #16a34a;
  }
}

.arrow-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--glacia-red);
  color: #fff;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(255, 37, 41, 0.35);
  transition: background 0.15s;

  &:hover { background: #e01e22; }
}
</style>
