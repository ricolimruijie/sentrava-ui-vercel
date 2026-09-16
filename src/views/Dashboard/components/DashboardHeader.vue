<script setup>
import { computed } from 'vue'
import Select from 'primevue/select'
import { useAuthStore } from '@/store/auth'
import { greeting } from '@/utils/helpers'
import { useCompanyContext } from '@/composables/useCompanyContext'
import { IconRadar } from '@tabler/icons-vue'

const props = defineProps({
  companies: { type: Array, default: () => [] },
})
const emit = defineEmits(['run-scan'])

const auth = useAuthStore()
const { activeCompany, switchCompany } = useCompanyContext()

const name = computed(() => {
  const n = auth.user?.name ?? auth.user?.username ?? ''
  return n.split(' ')[0]
})
const hi = computed(() => greeting())

const companyOptions = computed(() =>
  props.companies.length ? props.companies : (auth.companies ?? [])
)
const selectedCompanyId = computed({
  get:  () => activeCompany.value?.id,
  set: (id) => switchCompany(id),
})
</script>

<template>
  <div class="dash-header">
    <div class="dash-header__left">
      <h1 class="dash-header__greeting">Hello {{ name }}, {{ hi }}!</h1>
      <p class="dash-header__sub">Here's what's happening across your assets today.</p>
    </div>
    <div class="dash-header__right">
      <Select
        v-model="selectedCompanyId"
        :options="companyOptions"
        option-label="name"
        option-value="id"
        placeholder="Company List"
        class="dash-header__select"
      />
      <button class="btn-scan" @click="emit('run-scan')">
        <IconRadar :size="15" />
        Run Scan
      </button>
    </div>
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

  &__select {
    min-width: 200px;
    height: 36px;
    font-size: 13px;
  }

  @include below($bp-lg) {
    flex-direction: column;
    align-items: flex-start;

    &__right {
      width: 100%;
    }
  }
}

.btn-scan {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 20px;
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

  &:hover {
    background: #e01e22;
    box-shadow: 0 8px 24px rgba(255,37,41,0.50);
  }
}
</style>
