<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { greeting } from '@/utils/helpers'
import { IconChevronDown } from '@tabler/icons-vue'
import { scanModules } from '@/config/scanModules'

const props = defineProps({
  companies: { type: Array, default: () => [] },
})
const emit = defineEmits(['run-scan'])

const auth = useAuthStore()

const modules = scanModules

const scanModule = ref(null)
const scanView = computed(() => modules.find((m) => m.key === scanModule.value)?.view ?? null)

const showScanMenu = ref(false)
const scanMenuRef = ref(null)

function handleClickOutside(e) {
  if (scanMenuRef.value && !scanMenuRef.value.contains(e.target)) {
    showScanMenu.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

function runScan(moduleKey) {
  showScanMenu.value = false
  scanModule.value = moduleKey
}

const name = computed(() => {
  const n = auth.user?.name ?? auth.user?.username ?? ''
  return n.split(' ')[0]
})
const hi = computed(() => greeting())
</script>

<template>
  <div class="dash-header">
    <div class="dash-header__left">
      <h1 class="dash-header__greeting">Hello {{ name }}, {{ hi }}!</h1>
      <p class="dash-header__sub">Here's what's happening across your assets today.</p>
    </div>
    <div class="dash-header__right">
      <div ref="scanMenuRef" class="scan-menu">
        <button
          class="btn-scan"
          :class="{ 'btn-scan--open': showScanMenu }"
          @click="showScanMenu = !showScanMenu"
        >
          Start Scan
          <IconChevronDown
            :size="14"
            class="btn-scan__chevron"
            :class="{ 'btn-scan__chevron--up': showScanMenu }"
          />
        </button>

        <transition name="scan-dropdown">
          <div v-if="showScanMenu" class="scan-panel">
            <button
              v-for="m in modules"
              :key="m.key"
              type="button"
              class="scan-panel__item"
              @click="runScan(m.key)"
            >
              <component :is="m.icon" :size="16" color="#FF2529" />
              <span>{{ m.label }}</span>
            </button>
          </div>
        </transition>
      </div>
    </div>

    <Suspense v-if="scanView">
      <component :is="scanView" :key="scanModule" modal-only @close-scan="scanModule = null" />
    </Suspense>
  </div>
</template>

<style scoped lang="scss">
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;

  &__left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__greeting {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--glacia-ink);
    line-height: 1.2;
  }

  &__sub {
    font-size: 13px;
    color: var(--glacia-ink-dim);
    font-weight: 400;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  @include below($bp-lg) {
    flex-direction: column;
    align-items: flex-start;

    &__right {
      width: 100%;
    }
  }
}

.scan-menu {
  position: relative;
}

.btn-scan {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 18px;
  background: var(--glacia-red);
  color: #fff;
  border: none;
  border-radius: var(--glacia-radius-pill);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 6px 20px rgba(255,37,41,0.40);
  transition: background .15s, box-shadow .15s;

  &:hover, &--open {
    background: #e01e22;
    box-shadow: 0 8px 24px rgba(255,37,41,0.50);
  }

  &__chevron {
    margin-left: 2px;
    transition: transform 0.18s ease;

    &--up { transform: rotate(180deg); }
  }
}

.scan-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 200px;
  background: var(--surface);
  border-radius: 14px;
  box-shadow: 0 12px 28px -6px rgba(16, 24, 32, 0.2);
  overflow: hidden;
  padding: 6px;
  z-index: 100;
  transform-origin: top right;

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 10px;
    border-radius: 9px;
    border: none;
    background: transparent;
    color: var(--glacia-ink);
    font-size: 13px;
    font-weight: 500;
    font-family: 'Manrope', 'Inter', sans-serif;
    cursor: pointer;
    text-align: left;
    transition: background 0.13s;

    &:hover {
      background: rgba(255, 37, 41, 0.08);
    }
  }
}

.scan-dropdown-enter-active {
  animation: scan-panel-bounce 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.scan-dropdown-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.scan-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@keyframes scan-panel-bounce {
  0%   { opacity: 0; transform: scale(0.85) translateY(-8px); }
  60%  { opacity: 1; transform: scale(1.03) translateY(0); }
  100% { transform: scale(1); }
}
</style>
