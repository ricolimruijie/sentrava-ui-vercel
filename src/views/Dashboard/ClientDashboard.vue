<script setup>
import { get } from '@/utils/request'
import { useFetch } from '@/composables/useFetch'

import DashboardHeader        from './components/DashboardHeader.vue'
import AssetRegisteredTracker from './components/AssetRegisteredTracker.vue'
import AccountOverview        from './components/AccountOverview.vue'
import ProbeBoxHealthChecker  from './components/ProbeBoxHealthChecker.vue'
import TopVulnerabilities     from './components/TopVulnerabilities.vue'
import ScanningInProgress     from './components/ScanningInProgress.vue'
import TicketFeed             from './components/TicketFeed.vue'
import ScannerStatusCard      from './components/ScannerStatusCard.vue'

const { data, loading } = useFetch(() => get('/dashboard/client'))
</script>

<template>
  <div class="dashboard">
    <DashboardHeader
      :companies="data?.companies ?? []"
      @run-scan="() => {}"
    />

    <!-- Row 1: Asset Tracker (wide) | Account | Probe Box -->
    <div class="row row--top">
      <AssetRegisteredTracker :data="data?.assetTracker ?? {}"    :loading="loading" />
      <AccountOverview        :data="data?.accountOverview ?? {}" :loading="loading" />
      <ProbeBoxHealthChecker  :data="data?.probeBoxHealth ?? {}"  :loading="loading" />
    </div>

    <!-- Row 2: Top Vulnerabilities | Scanning in Progress -->
    <div class="row row--mid">
      <TopVulnerabilities :items="data?.topVulnerabilities ?? []" :loading="loading" />
      <ScanningInProgress :items="data?.scanningInProgress ?? []" :loading="loading" />
    </div>

    <!-- Row 3: Ticket Feed + 3 Scanner Status Cards -->
    <div class="row row--bot">
      <TicketFeed :items="data?.ticketFeed ?? []" :loading="loading" />
      <ScannerStatusCard
        v-for="s in (data?.scannerStatus ?? [])"
        :key="s.id"
        :data="s"
        :loading="loading"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.row {
  display: grid;
  gap: 14px;
  align-items: stretch;
}

.row--top {
  grid-template-columns: 1fr 280px 280px;

  @include below($bp-xl) {
    grid-template-columns: 1fr 240px 240px;
  }

  @include below($bp-lg) {
    grid-template-columns: 1fr;
  }
}

.row--mid {
  grid-template-columns: 3fr 2fr;

  @include below($bp-lg) {
    grid-template-columns: 1fr;
  }
}

.row--bot {
  grid-template-columns: repeat(4, 1fr);

  @include below($bp-xl) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}
</style>
