<script setup>
import { IconX, IconBuilding, IconWorld, IconNetwork, IconBrowser, IconCode, IconPlus, IconCalendarEvent } from '@tabler/icons-vue'
import { formatDate } from '@/utils/helpers'

defineProps({
  modelValue: { type: Boolean, default: false },
  companyName: { type: String, default: '' },
  // [{ key: 'domain' | 'network' | 'webapp' | 'source', label, count, used, remaining, additional, validity }]
  rows: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}

const icons = { domain: IconWorld, network: IconNetwork, webapp: IconBrowser, source: IconCode }

function pct(row) {
  return row.count ? Math.min(100, Math.round((row.used / row.count) * 100)) : 0
}

// "Jan 31, 2026"
function validUntil(iso) {
  return formatDate(iso)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-backdrop" @mousedown.self="close">
        <div class="quota-modal" role="dialog" aria-modal="true" aria-labelledby="quota-title">
          <header class="quota-modal__head">
            <div>
              <h2 id="quota-title" class="quota-modal__title">Monthly Quota Information</h2>
              <p class="quota-modal__company"><IconBuilding :size="18" /> {{ companyName || '—' }}</p>
            </div>
            <button type="button" class="quota-modal__close" aria-label="Close" @click="close">
              <IconX :size="20" />
            </button>
          </header>

          <div class="quota-modal__body">
            <div class="quota-grid quota-grid--head">
              <span>Service</span>
              <span>Monthly quota</span>
              <span>Additional quota</span>
            </div>

            <div v-for="row in rows" :key="row.key" class="quota-grid quota-row">
              <div class="quota-row__service">
                <span class="quota-row__icon"><component :is="icons[row.key]" :size="20" /></span>
                <span class="quota-row__name">{{ row.label }}</span>
              </div>

              <div class="quota-row__quota">
                <div class="quota-row__line">
                  <span>
                    <b class="quota-row__remaining">{{ row.remaining }}</b>
                    <span class="quota-row__unit">remaining</span>
                  </span>
                  <span class="quota-row__used">{{ row.used }} / {{ row.count }} used</span>
                </div>
                <div class="quota-row__bar"><i :style="{ width: pct(row) + '%' }" /></div>
              </div>

              <div class="quota-row__extra">
                <template v-if="row.additional">
                  <span class="quota-row__pill"><IconPlus :size="14" /> {{ row.additional }} <b>per month</b></span>
                  <span v-if="row.validity" class="quota-row__valid">
                    <IconCalendarEvent :size="17" /> Valid until {{ validUntil(row.validity) }}
                  </span>
                </template>
                <span v-else class="quota-row__none">No additional quota</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
}

.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }

.quota-modal {
  width: 100%;
  max-width: 880px;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-radius: 24px;
  box-shadow: 0 24px 48px -12px rgba(16, 24, 32, 0.35);
  overflow: hidden;
  animation: quota-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 24px 32px 20px;
    border-bottom: 1px solid rgba(var(--tint), 0.1);
    flex-shrink: 0;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__company {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 6px 0 0;
    font-size: 15px;
    font-weight: 500;
    color: var(--glacia-ink-dim);
  }

  &__close {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 1px solid rgba(var(--tint), 0.12);
    background: var(--surface);
    color: var(--glacia-ink);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.13s;

    &:hover { background: rgba(var(--tint), 0.05); }
  }

  &__body {
    overflow-y: auto;
    padding: 20px 32px 32px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

@keyframes quota-bounce {
  0%   { opacity: 0; transform: scale(0.92) translateY(10px); }
  60%  { opacity: 1; transform: scale(1.01) translateY(0); }
  100% { transform: scale(1); }
}

.quota-grid {
  display: grid;
  grid-template-columns: 1.05fr 1.35fr 1.1fr;
  align-items: center;
  gap: 24px;

  &--head {
    padding: 0 20px 2px;
    font-size: 14px;
    font-weight: 700;
    color: var(--glacia-ink-dim);
  }
}

.quota-row {
  padding: 18px 20px;
  background: var(--surface-3);
  border-radius: 22px;

  &__service {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  &__icon {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: var(--surface);
    border: 1px solid rgba(var(--tint), 0.08);
    color: #2b5a99;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__name {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 17px;
    font-weight: 800;
    color: var(--glacia-ink);
  }

  &__line {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }

  &__remaining {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 26px;
    font-weight: 800;
    color: var(--glacia-ink);
  }

  &__unit {
    margin-left: 6px;
    font-size: 15px;
    color: var(--glacia-ink-dim);
  }

  &__used {
    font-family: ui-monospace, 'SF Mono', Menlo, monospace;
    font-size: 14px;
    font-weight: 600;
    color: var(--glacia-ink-dim);
    white-space: nowrap;
  }

  &__bar {
    height: 8px;
    margin-top: 8px;
    border-radius: 999px;
    background: var(--hairline-strong);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--glacia-red);
    }
  }

  &__extra {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  &__pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    border-radius: 999px;
    background: var(--blue-soft);
    color: #1f4a7d;
    font-size: 15px;
    font-weight: 700;

    b { font-weight: 800; }
  }

  &__valid {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    color: var(--glacia-ink-dim);
  }

  &__none {
    font-size: 15px;
    color: var(--glacia-ink-dim);
  }
}

@media (max-width: 760px) {
  .quota-grid { grid-template-columns: 1fr; gap: 12px; }
  .quota-grid--head { display: none; }
}
</style>
