<script setup>
import { get } from '@/utils/request'
import { useFetch } from '@/composables/useFetch'

import DashboardHeader      from './components/DashboardHeader.vue'
import StatCardRow          from './components/StatCardRow.vue'
import MostUsedService      from './components/MostUsedService.vue'
import ScanDurationOverview from './components/ScanDurationOverview.vue'
import TopVulnerability     from './components/TopVulnerability.vue'
import CreditsOverview      from './components/CreditsOverview.vue'
import TopSpendingCompany   from './components/TopSpendingCompany.vue'
import ActivityFeed         from './components/ActivityFeed.vue'

const { data, loading } = useFetch(() => get('/dashboard/super-admin'))
</script>

<template>
  <div class="sa-dashboard">
    <DashboardHeader />

    <StatCardRow :stats="data?.stats ?? []" :loading="loading" />

    <!-- Row 1: service + duration -->
    <div class="grid-2 mb-lg">
      <MostUsedService      :data="data?.mostUsedService ?? []"        :loading="loading" />
      <ScanDurationOverview :data="data?.scanDurationOverview ?? {}"   :loading="loading" />
    </div>

    <!-- Row 2: top vulns (wide) + credits -->
    <div class="grid-asymm mb-lg">
      <TopVulnerability   :items="data?.topVulnerabilities ?? []"    :loading="loading" />
      <CreditsOverview    :data="data?.creditsOverview ?? {}"         :loading="loading" />
    </div>

    <!-- Row 3: top spending + activity -->
    <div class="grid-2 mb-lg">
      <TopSpendingCompany :items="data?.topSpendingCompanies ?? []"  :loading="loading" />
      <ActivityFeed       :items="data?.recentActivity ?? []"         :loading="loading" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.sa-dashboard { min-width: 0; }
.mb-lg { margin-bottom: 24px; }

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @include below($bp-lg) {
    grid-template-columns: 1fr;
  }
}

.grid-asymm {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;

  @include below($bp-xl) {
    grid-template-columns: 1fr;
  }
}
</style>
