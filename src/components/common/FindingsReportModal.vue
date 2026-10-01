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

<style scoped lang="scss">
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 300; padding: 20px;
}
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

// ── Download Report filter modal (same as WebAppDetailView) ─────────────
.rep-modal {
  width: 100%;
  max-width: 640px;
  background: var(--surface);
  border-radius: 20px;
  box-shadow: 0 24px 48px -12px rgba(16, 24, 32, 0.35);
  padding: 28px 28px 0;
  overflow: hidden;
  animation: rep-modal-bounce 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes rep-modal-bounce {
  0%   { opacity: 0; transform: scale(0.92) translateY(10px); }
  60%  { opacity: 1; transform: scale(1.01) translateY(0); }
  100% { transform: scale(1); }
}

.rep-modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 20px;
}

.rep-modal__title {
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 28px;
  font-weight: 800;
  color: var(--glacia-ink);
  margin: 0;
}

.rep-modal__desc {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--glacia-ink-dim);
}

.rep-modal__close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(var(--tint), 0.06);
  color: var(--glacia-ink-dim);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    background: rgba(var(--tint), 0.1);
    color: var(--glacia-ink);
  }
}

.rep-modal__grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 24px;
  padding: 20px 0;
  border-top: 1px solid var(--hairline);
}

.rep-modal__divider {
  width: 1px;
  background: var(--surface-3);
}

.rep-modal__col-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.rep-modal__label {
  font-size: 15px;
  font-weight: 800;
  color: var(--glacia-ink);
  margin: 0;
}

.rep-modal__selectall {
  border: none;
  background: none;
  padding: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--glacia-red);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.rep-modal__opts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rep-check {
  display: grid;
  grid-template-columns: 22px minmax(64px, auto) 1fr 20px;
  align-items: center;
  gap: 10px;
  padding: 6px 4px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.13s;

  &:hover {
    background: rgba(var(--tint), 0.04);
  }

  &__input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  &__box {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 8px;
    border: 2px solid var(--hairline-strong);
    background: var(--surface);
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.13s, background 0.13s;
  }

  &__icon {
    color: #fff;
    opacity: 0;
    transition: opacity 0.13s;
  }

  &__input:checked + &__box {
    border-color: var(--glacia-red);
    background: var(--glacia-red);
  }

  &__input:checked + &__box &__icon {
    opacity: 1;
  }

  &__input:focus-visible + &__box {
    outline: 2px solid var(--glacia-red);
    outline-offset: 2px;
  }

  &__text {
    font-size: 14px;
    font-weight: 600;
    color: var(--glacia-ink);
  }

  &__bar {
    height: 6px;
    border-radius: 999px;
    background: var(--surface-3);
    overflow: hidden;
  }

  &__bar-fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: var(--hairline-strong);
    transition: background 0.13s;

    &--on {
      background: var(--glacia-red);
    }
  }

  &__count {
    font-size: 14px;
    font-weight: 700;
    color: var(--glacia-ink-dim);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
}

.rep-radio__tag {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 999px;
  white-space: nowrap;
  justify-self: start;
}

// ── Report modal endpoint picker (Domain list view only) ───────────────────
.rep-modal__endpoints {
  padding: 20px 0;
  border-top: 1px solid var(--hairline);
}

.rep-modal__end-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 188px;
  overflow-y: auto;
  margin-top: 4px;
  padding-right: 4px;
}

.rep-check--endpoint {
  grid-template-columns: 22px minmax(0, 1fr) auto;
}

.rep-check__vuln {
  font-size: 12px;
  font-weight: 500;
  color: var(--glacia-ink-dim);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.rep-check__end {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.rep-check__end-ip {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--glacia-ink);
  white-space: nowrap;
  flex-shrink: 0;
}

.rep-modal__end-count {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--glacia-ink-dim);

  b {
    color: var(--glacia-ink);
    font-weight: 800;
  }
}

.rep-modal__footer {
  margin: 0 -28px;
  padding: 18px 28px 24px;
  background: var(--surface-3);
  border-top: 1px solid var(--hairline);
}

.rep-modal__count {
  margin: 0 0 10px;
  font-size: 14px;
  color: var(--glacia-ink-dim);

  b {
    color: var(--glacia-ink);
    font-weight: 800;
  }
}

.rep-modal__progress {
  height: 6px;
  border-radius: 999px;
  background: var(--surface-3);
  overflow: hidden;
}

.rep-modal__progress-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--glacia-red);
  transition: width 0.2s ease;
}

.rep-modal__actions {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}

.rep-btn {
  flex: 1;
  height: 52px;
  border-radius: 999px;
  border: none;
  font-size: 15px;
  font-weight: 700;
  font-family: 'Manrope', 'Inter', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &--cancel {
    background: var(--surface);
    color: var(--glacia-ink);
    border: 1px solid var(--hairline);

    &:hover {
      background: rgba(var(--tint), 0.04);
    }
  }

  &--download {
    background: #ff2e3a;
    color: #fff;
    box-shadow: 0 8px 20px -6px rgba(255, 46, 58, 0.4);

    &:hover:not(:disabled) {
      background: #e6212c;
    }

    &:disabled {
      background: var(--surface-3);
      color: #9ca3af;
      box-shadow: none;
      cursor: default;
    }

    // Mid-download still reads as "red", not "disabled" — the :disabled
    // attribute here only blocks a second click while it's in flight.
    &.rep-btn--busy:disabled {
      background: #ff2e3a;
      color: #fff;
      box-shadow: 0 8px 20px -6px rgba(255, 46, 58, 0.4);
    }
  }

  &__spinner {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid rgba(var(--glass-rgb), 0.4);
    border-top-color: #fff;
    animation: rep-btn-spin 0.7s linear infinite;
  }
}

@keyframes rep-btn-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
</style>
