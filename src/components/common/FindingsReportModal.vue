<script setup>
import { ref, computed, watch } from 'vue'
import { IconX, IconCheck } from '@tabler/icons-vue'

// Shared "Download Report" filter modal for the four asset detail pages: pick
// severities and validation-cycle statuses (and, on the Domain / Network
// endpoint-list views, which endpoints), see the counts, then Download. The
// parent builds the actual file from the `download` event.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  findings: { type: Array, default: () => [] },
  // Validation-cycle statuses to offer, e.g. ['Active', 'Fixing', ...].
  cycles: { type: Array, default: () => [] },
  // A failed scan produced no findings, so nothing can be exported.
  noFindings: { type: Boolean, default: false },
  // Domain / Network endpoint-list view: let the user pick endpoints from `endpoints`.
  pickEndpoints: { type: Boolean, default: false },
  endpoints: { type: Array, default: () => [] },
  // Otherwise the export covers just this one endpoint/host.
  singleEndpoint: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'download'])

const severityOptions = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'info', label: 'Info' },
]
const severityPill = {
  critical: { label: 'Critical', bg: '#F9D0D0', color: '#9B1C1C' },
  high: { label: 'High', bg: '#FDE8E8', color: '#C81E1E' },
  medium: { label: 'Medium', bg: '#FEF3C7', color: '#B45309' },
  low: { label: 'Low', bg: '#E3F5E8', color: '#2F9E52' },
  info: { label: 'Info', bg: '#DFF3FC', color: '#1197C2' },
}
const severityRank = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

const selectedSev = ref([])
const selectedCycles = ref([])
const selectedEndpointIds = ref([])
const state = ref('idle') // 'idle' | 'loading'

watch(() => props.modelValue, (open) => {
  if (!open) return
  selectedSev.value = []
  selectedCycles.value = []
  selectedEndpointIds.value = []
  state.value = 'idle'
})

function close() { emit('update:modelValue', false) }

const toggle = (list, v) => (list.value = list.value.includes(v) ? list.value.filter((x) => x !== v) : [...list.value, v])
const toggleSev = (v) => toggle(selectedSev, v)
const toggleCycle = (v) => toggle(selectedCycles, v)
const toggleEndpoint = (id) => toggle(selectedEndpointIds, id)
const selectAllSev = () => { selectedSev.value = severityOptions.map((o) => o.value) }
const selectAllCycle = () => { selectedCycles.value = [...props.cycles] }
const selectAllEndpoints = () => { selectedEndpointIds.value = props.endpoints.map((e) => e.id) }

// Each option's own count (across all findings, not the current filter) and a
// mini bar sized relative to the busiest option in its own column.
const sevCounts = computed(() =>
  Object.fromEntries(severityOptions.map((o) => [o.value, props.findings.filter((v) => v.severity === o.value).length])),
)
const cycleCounts = computed(() =>
  Object.fromEntries(props.cycles.map((t) => [t, props.findings.filter((v) => v.cycle === t).length])),
)
const sevMax = computed(() => Math.max(1, ...Object.values(sevCounts.value)))
const cycleMax = computed(() => Math.max(1, ...Object.values(cycleCounts.value)))

const rows = computed(() => {
  if (props.noFindings) return []
  return props.findings
    .filter((v) => selectedSev.value.includes(v.severity) && selectedCycles.value.includes(v.cycle))
    .sort((a, b) => (severityRank[a.severity] ?? 99) - (severityRank[b.severity] ?? 99))
})

// Endpoints covered by the export: the picked ones, otherwise the single
// endpoint/host currently on screen.
const endpointList = computed(() => {
  if (props.pickEndpoints) {
    const sel = new Set(selectedEndpointIds.value)
    return props.endpoints.filter((e) => sel.has(e.id))
  }
  return [{ id: 'single', endpoint: props.singleEndpoint }]
})

function submit() {
  if (!rows.value.length || !endpointList.value.length || state.value !== 'idle') return
  state.value = 'loading'
  setTimeout(() => {
    emit('download', { rows: rows.value, endpoints: endpointList.value })
    state.value = 'idle'
    close()
  }, 600)
}
</script>

<template>
<Teleport to="body">
  <Transition name="modal-fade">
    <div v-if="modelValue" class="modal-backdrop" @mousedown.self="close()">
      <div class="rep-modal">
        <div class="rep-modal__head">
          <div>
            <h2 class="rep-modal__title">Download Report</h2>
            <p class="rep-modal__desc">Choose which findings to include in the PDF export.</p>
          </div>
          <button type="button" class="rep-modal__close" aria-label="Close" @click="close()">
            <IconX :size="18" />
          </button>
        </div>

        <div v-if="pickEndpoints" class="rep-modal__endpoints">
          <div class="rep-modal__col-head">
            <p class="rep-modal__label">Endpoints</p>
            <button type="button" class="rep-modal__selectall" @click="selectAllEndpoints">Select all</button>
          </div>
          <div class="rep-modal__end-list">
            <label v-for="e in endpoints" :key="e.id" class="rep-check rep-check--endpoint">
              <input
                type="checkbox"
                class="rep-check__input"
                :checked="selectedEndpointIds.includes(e.id)"
                @change="toggleEndpoint(e.id)"
              />
              <span class="rep-check__box" aria-hidden="true"><IconCheck :size="12" class="rep-check__icon" /></span>
              <span class="rep-check__end">
                <span class="rep-check__end-ip">{{ e.endpoint }}</span>
              </span>
              <span class="rep-check__vuln">Vulnerability: {{ findings.length }}</span>
            </label>
          </div>
          <p class="rep-modal__end-count"><b>{{ selectedEndpointIds.length }}</b> of {{ endpoints.length }} endpoints selected</p>
        </div>

        <div class="rep-modal__grid">
          <div class="rep-modal__col">
            <div class="rep-modal__col-head">
              <p class="rep-modal__label">Severity</p>
              <button type="button" class="rep-modal__selectall" @click="selectAllSev">Select all</button>
            </div>
            <div class="rep-modal__opts">
              <label v-for="o in severityOptions" :key="o.value" class="rep-check">
                <input
                  type="checkbox"
                  class="rep-check__input"
                  :checked="selectedSev.includes(o.value)"
                  @change="toggleSev(o.value)"
                />
                <span class="rep-check__box" aria-hidden="true"><IconCheck :size="12" class="rep-check__icon" /></span>
                <span
                  class="rep-radio__tag"
                  :style="{ background: severityPill[o.value].bg, color: severityPill[o.value].color }"
                >{{ o.label }}</span>
                <span class="rep-check__bar">
                  <span
                    class="rep-check__bar-fill"
                    :class="{ 'rep-check__bar-fill--on': selectedSev.includes(o.value) }"
                    :style="{ width: (sevCounts[o.value] / sevMax * 100) + '%' }"
                  />
                </span>
                <span class="rep-check__count">{{ sevCounts[o.value] }}</span>
              </label>
            </div>
          </div>

          <div class="rep-modal__divider" aria-hidden="true" />

          <div class="rep-modal__col">
            <div class="rep-modal__col-head">
              <p class="rep-modal__label">Vulnerability status</p>
              <button type="button" class="rep-modal__selectall" @click="selectAllCycle">Select all</button>
            </div>
            <div class="rep-modal__opts">
              <label v-for="tab in cycles" :key="tab" class="rep-check">
                <input
                  type="checkbox"
                  class="rep-check__input"
                  :checked="selectedCycles.includes(tab)"
                  @change="toggleCycle(tab)"
                />
                <span class="rep-check__box" aria-hidden="true"><IconCheck :size="12" class="rep-check__icon" /></span>
                <span class="rep-check__text">{{ tab }}</span>
                <span class="rep-check__bar">
                  <span
                    class="rep-check__bar-fill"
                    :class="{ 'rep-check__bar-fill--on': selectedCycles.includes(tab) }"
                    :style="{ width: (cycleCounts[tab] / cycleMax * 100) + '%' }"
                  />
                </span>
                <span class="rep-check__count">{{ cycleCounts[tab] }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="rep-modal__footer">
          <p class="rep-modal__count"><b>{{ rows.length }}</b> of {{ findings.length }} vulnerabilities selected</p>
          <div class="rep-modal__progress">
            <span
              class="rep-modal__progress-fill"
              :style="{ width: (findings.length ? rows.length / findings.length * 100 : 0) + '%' }"
            />
          </div>

          <div class="rep-modal__actions">
            <button type="button" class="rep-btn rep-btn--cancel" @click="close()">Cancel</button>
            <button
              type="button"
              class="rep-btn rep-btn--download"
              :class="{ 'rep-btn--busy': state === 'loading' }"
              :disabled="!rows.length || (pickEndpoints && !selectedEndpointIds.length) || state !== 'idle'"
              @click="submit"
            >
              <span v-if="state === 'loading'" class="rep-btn__spinner" />
              <span v-else>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>
</template>

<style scoped lang="scss" src="./FindingsReportModal.scss"></style>
