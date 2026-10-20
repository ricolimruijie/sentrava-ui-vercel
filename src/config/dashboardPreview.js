// The real dashboard, for the home page's preview. App-level config may import any module (modules must not
// import each other), the same way scanModules.js hands the dashboard the asset views' scan modals.
import DashboardHeader from '@/modules/dashboard/components/DashboardHeader.vue'
import AssetRegisteredTracker from '@/modules/dashboard/components/AssetRegisteredTracker.vue'
import AccountOverview from '@/modules/dashboard/components/AccountOverview.vue'
import IntegrationConnection from '@/modules/dashboard/components/IntegrationConnection.vue'
import TopVulnerabilities from '@/modules/dashboard/components/TopVulnerabilities.vue'
import ScanningInProgress from '@/modules/dashboard/components/ScanningInProgress.vue'
import TicketFeed from '@/modules/dashboard/components/TicketFeed.vue'
import VulnerabilityCycleTracker from '@/modules/dashboard/components/VulnerabilityCycleTracker.vue'
import OverallSeverityTrend from '@/modules/dashboard/components/OverallSeverityTrend.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import { clientDashboardMock } from '@/mocks/dashboard/client'

export const dashboardPreview = {
  Sidebar,
  DashboardHeader,
  AssetRegisteredTracker,
  AccountOverview,
  IntegrationConnection,
  TopVulnerabilities,
  ScanningInProgress,
  TicketFeed,
  VulnerabilityCycleTracker,
  OverallSeverityTrend,
  // The same sample data the app shows in demo mode.
  data: clientDashboardMock,
}
