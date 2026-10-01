<script setup>
import { getClientDashboard } from '@/modules/dashboard/services/dashboardService'
import { useFetch } from '@/composables/useFetch'
import { useAuthStore } from '@/stores/auth'

import DashboardHeader        from '@/modules/dashboard/components/DashboardHeader.vue'
import AssetRegisteredTracker from '@/modules/dashboard/components/AssetRegisteredTracker.vue'
import AccountOverview        from '@/modules/dashboard/components/AccountOverview.vue'
import IntegrationConnection  from '@/modules/dashboard/components/IntegrationConnection.vue'
import TopVulnerabilities     from '@/modules/dashboard/components/TopVulnerabilities.vue'
import ScanningInProgress     from '@/modules/dashboard/components/ScanningInProgress.vue'
import TicketFeed             from '@/modules/dashboard/components/TicketFeed.vue'
import VulnerabilityCycleTracker from '@/modules/dashboard/components/VulnerabilityCycleTracker.vue'
import OverallSeverityTrend      from '@/modules/dashboard/components/OverallSeverityTrend.vue'

const auth = useAuthStore()
const { data, loading } = useFetch(() => getClientDashboard())
</script>

<template>
  <div class="dashboard">
    <DashboardHeader
      :companies="data?.companies ?? []"
      @run-scan="() => {}"
    />

    <!-- Row 1: Account (left) | Integration Connection (center) | Asset Tracker (right, wide) -->
    <div class="row row--top">
      <AccountOverview        :data="{ ...(data?.accountOverview ?? {}), ...(auth.user ? { twoFAEnabled: auth.twoFAEnabled } : {}) }" :loading="loading" />
      <IntegrationConnection
        :probe-box="data?.probeBoxHealth ?? {}"
        :tools="data?.scannerTools ?? []"
        :loading="loading"
      />
      <AssetRegisteredTracker :data="data?.assetTracker ?? {}"    :loading="loading" />
    </div>

    <!-- Overall Severity trend (full width) -->
    <OverallSeverityTrend :data="data?.severityTrend ?? {}" :loading="loading" />

    <!-- Row 2: Top Vulnerabilities | Scanning in Progress -->
    <div class="row row--mid">
      <TopVulnerabilities :items="data?.topVulnerabilities ?? []" :loading="loading" />
      <ScanningInProgress :items="data?.scanningInProgress ?? []" :loading="loading" />
    </div>

    <!-- Row 3: Vulnerability Cycle Tracker | Ticket Feed (right-aligned, 60% width) -->
    <div class="row row--bot">
      <VulnerabilityCycleTracker v-if="data?.vulnerabilityCycle" :initial-values="data.vulnerabilityCycle" />
      <TicketFeed :items="data?.ticketFeed ?? []" :loading="loading" class="ticket-feed" />
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
  grid-template-columns: 3fr 3fr 4fr;
  // Integration Connection's height changes as its accordion rows open/close.
  // Don't stretch — otherwise Asset Inventory / Account Overview would resize
  // to match every time a row is toggled.
  align-items: start;

  @include below($bp-lg) {
    grid-template-columns: 1fr;
  }
}

.row--mid {
  grid-template-columns: 7fr 3fr;

  @include below($bp-lg) {
    grid-template-columns: 1fr;
  }
}

.row--bot {
  grid-template-columns: 2fr 3fr;

  @include below($bp-lg) {
    grid-template-columns: 1fr;
  }
}

.ticket-feed {
  grid-column: 2;

  @include below($bp-lg) {
    grid-column: 1;
  }
}
</style>
