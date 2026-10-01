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

<style scoped lang="scss" src="./QuotaInfoModal.scss"></style>
