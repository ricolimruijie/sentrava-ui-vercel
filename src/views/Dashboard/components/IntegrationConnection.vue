<script setup>
import { ref, reactive } from 'vue'
import { IconServer2, IconRadar, IconNetwork, IconBrowser, IconCode, IconChevronDown } from '@tabler/icons-vue'

const props = defineProps({
  probeBox: { type: Object,  default: () => ({}) },
  tools:    { type: Array,   default: () => [] },
  loading:  { type: Boolean, default: false },
})

// "Check now" button state per row — idle -> loading (fill bar animates in)
// -> done (bar turns green briefly) -> back to idle.
const checkStates = reactive({})

function statusOf(key) {
  return checkStates[key] ?? 'idle'
}

function triggerCheck(key) {
  if (statusOf(key) !== 'idle') return
  checkStates[key] = 'loading'
  setTimeout(() => {
    checkStates[key] = 'done'
    setTimeout(() => { checkStates[key] = 'idle' }, 1400)
  }, 1300)
}

const toolIcons = {
  domain:  IconRadar,
  network: IconNetwork,
  webapp:  IconBrowser,
  source:  IconCode,
}

const expanded = ref(null)
function toggle(id) {
  expanded.value = expanded.value === id ? null : id
}

function isUp(status) {
  return status === 'connected' || status === 'active'
}

function toolLabel(name, id) {
  return name?.replace(/ Scanner$/, '') ?? id
}

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    + ' · '
    + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// Smooth accordion open/close: content height is variable, so measure it
// on enter/leave rather than animating to a hardcoded value.
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const DURATION = 300

function onEnter(el, done) {
  el.style.transition = 'none'
  el.style.height = '0px'
  el.style.opacity = '0'
  // Force a reflow so the browser commits the 0-height state before the
  // transition starts — otherwise both style changes can land in the same
  // paint and the element just snaps open with no visible animation.
  void el.offsetHeight

  const target = el.scrollHeight
  el.style.transition = `height ${DURATION}ms ${EASE}, opacity ${DURATION}ms ${EASE}`
  el.style.height = `${target}px`
  el.style.opacity = '1'

  el.addEventListener(
    'transitionend',
    (e) => { if (e.propertyName === 'height') done() },
    { once: true },
  )
}
function onAfterEnter(el) {
  el.style.transition = ''
  el.style.height = 'auto'
}
function onLeave(el, done) {
  el.style.height = `${el.scrollHeight}px`
  el.style.opacity = '1'
  void el.offsetHeight // force reflow so the collapse below actually animates

  el.style.transition = `height ${DURATION}ms ${EASE}, opacity ${DURATION}ms ${EASE}`
  el.style.height = '0px'
  el.style.opacity = '0'

  el.addEventListener(
    'transitionend',
    (e) => { if (e.propertyName === 'height') done() },
    { once: true },
  )
}
</script>

<template>
  <div class="integration card">
    <h2 class="integration__title">Integration Connection</h2>
    <p class="integration__caption">Connection status checks automatically every minute.</p>

    <div class="integration__list">
      <div class="row-item" :class="{ 'row-item--open': expanded === 'probeBox' }">
        <button type="button" class="row-item__header" @click="toggle('probeBox')">
          <span class="row-item__icon">
            <IconServer2 :size="18" color="#FF2529" />
          </span>
          <span class="row-item__label">Probe Box</span>
          <span class="row-item__status">
            <span class="status-dot" :class="isUp(probeBox.status) ? 'on' : 'off'" />
            {{ isUp(probeBox.status) ? 'Online' : 'Offline' }}
          </span>
          <IconChevronDown :size="16" class="row-item__chevron" />
        </button>

        <Transition name="accordion" :css="false" @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave">
          <div v-if="expanded === 'probeBox'" class="row-item__body">
            <div class="overtime">
              <span
                v-for="(on, i) in (probeBox.overtime ?? [])"
                :key="i"
                class="overtime__sq"
                :class="on ? 'on' : 'off'"
              />
            </div>
            <div class="row-item__footer">
              <p class="row-item__meta">Last check: {{ fmtDate(probeBox.lastCheck) }}</p>
              <button
                type="button"
                class="check-btn"
                :disabled="statusOf('probeBox') !== 'idle'"
                @click.stop="triggerCheck('probeBox')"
              >
                <span class="check-btn__fill" :style="{ width: statusOf('probeBox') === 'idle' ? '0%' : '100%' }" />
                <span v-if="statusOf('probeBox') === 'done'" class="check-btn__done" />
                <span class="check-btn__label" :class="{ 'check-btn__label--active': statusOf('probeBox') !== 'idle' }">
                  <template v-if="statusOf('probeBox') === 'loading'">Checking…</template>
                  <template v-else-if="statusOf('probeBox') === 'done'">Checked</template>
                  <template v-else>Check now</template>
                </span>
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <div
        v-for="t in tools"
        :key="t.id"
        class="row-item"
        :class="{ 'row-item--open': expanded === t.id }"
      >
        <button type="button" class="row-item__header" @click="toggle(t.id)">
          <span class="row-item__icon">
            <component :is="toolIcons[t.id] ?? IconCode" :size="18" color="#FF2529" />
          </span>
          <span class="row-item__label">{{ toolLabel(t.name, t.id) }}</span>
          <span class="row-item__status">
            <span class="status-dot" :class="isUp(t.status) ? 'on' : 'off'" />
            {{ isUp(t.status) ? 'Online' : 'Offline' }}
          </span>
          <IconChevronDown :size="16" class="row-item__chevron" />
        </button>

        <Transition name="accordion" :css="false" @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave">
          <div v-if="expanded === t.id" class="row-item__body">
            <div class="overtime">
              <span
                v-for="(on, i) in (t.overtime ?? [])"
                :key="i"
                class="overtime__sq"
                :class="on ? 'on' : 'off'"
              />
            </div>
            <div class="row-item__footer">
              <p class="row-item__meta">Last check: {{ fmtDate(t.lastCheck) }}</p>
              <button
                type="button"
                class="check-btn"
                :disabled="statusOf(t.id) !== 'idle'"
                @click.stop="triggerCheck(t.id)"
              >
                <span class="check-btn__fill" :style="{ width: statusOf(t.id) === 'idle' ? '0%' : '100%' }" />
                <span v-if="statusOf(t.id) === 'done'" class="check-btn__done" />
                <span class="check-btn__label" :class="{ 'check-btn__label--active': statusOf(t.id) !== 'idle' }">
                  <template v-if="statusOf(t.id) === 'loading'">Checking…</template>
                  <template v-else-if="statusOf(t.id) === 'done'">Checked</template>
                  <template v-else>Check now</template>
                </span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.integration {
  display: flex;
  flex-direction: column;
  gap: 14px;
  // Fixed to match Asset Inventory / Account Overview's height. Rows expand
  // and collapse *inside* this budget (the list scrolls) instead of growing
  // the card — otherwise opening a row would push down everything below it
  // on the page, not just move content within this card.
  height: 405px;
  min-height: 0;
  overflow: hidden;

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 17px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
    flex-shrink: 0;
  }

  &__caption {
    margin: 0;
    font-size: 13px;
    color: var(--glacia-ink-dim);
    flex-shrink: 0;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-right: 6px;
    margin-right: -6px;
    scrollbar-width: thin;

    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(var(--tint), 0.15);
      border-radius: var(--glacia-radius-pill);
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }
}

.row-item {
  border: 1px solid var(--glacia-glass-border);
  border-radius: 14px;
  background: var(--glacia-glass-fill-strong);
  flex-shrink: 0;
  overflow: hidden;

  &__header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    font: inherit;
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: rgba(255, 37, 41, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__label {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--glacia-ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--glacia-ink-dim);
    flex-shrink: 0;
    white-space: nowrap;
  }

  &__chevron {
    color: var(--glacia-ink);
    flex-shrink: 0;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &--open &__chevron {
    transform: rotate(180deg);
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 14px 14px;
    overflow: hidden;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  &__meta {
    margin: 0;
    flex: 1;
    min-width: 0;
    font-size: 11px;
    color: var(--glacia-ink-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.check-btn {
  position: relative;
  overflow: hidden;
  border: none;
  border-radius: var(--glacia-radius-sm);
  padding: 7px 16px;
  background: rgba(var(--tint), 0.06);
  color: var(--glacia-ink);
  font-family: 'Manrope', 'Inter', sans-serif;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  min-width: 92px;
  white-space: nowrap;
  flex-shrink: 0;

  &:disabled {
    cursor: default;
  }

  &__fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0%;
    background: var(--glacia-red);
    transition: width 1.3s linear;
    z-index: 0;
  }

  &__done {
    position: absolute;
    inset: 0;
    background: #16a34a;
    z-index: 0;
  }

  &__label {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--glacia-ink);

    &--active {
      color: #fff;
    }
  }
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;

  &.on  { background: #22c55e; }
  &.off { background: var(--glacia-sev-critical); }
}

.overtime {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;

  &__sq {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    flex-shrink: 0;

    &.on  { background: #22c55e; }
    &.off { background: #f87171; }
  }
}
</style>
