import { createRouter, createWebHistory } from 'vue-router'
import { h } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppLayout    from '@/components/layout/AppLayout.vue'
import authRoutes   from './auth'
import dashboardRoutes from './dashboard'
import { dashboardOrigin } from '@/utils/navOrigin'
import { getDomains } from '@/modules/domain-inspection/services/domainService'

// Stub placeholder for future pages (render function — the bundler uses the
// runtime-only Vue build, so a `template:` string would never compile).
const Placeholder = {
  render() {
    return h(
      'div',
      {
        style:
          'display:flex;align-items:center;justify-content:center;height:60vh;color:var(--glacia-ink-dim);font-size:14px;',
      },
      'work in progress',
    )
  },
}

const appRoutes = [
  ...dashboardRoutes,
  {
    path: '/assets',
    component: () => import('@/modules/asset-inventory/views/AssetInventoryView.vue'),
    meta: { requiresAuth: true, title: 'Asset Inventory', crumbs: [{ label: 'Manage' }] },
  },
  // Services — each shows a blank Work in Progress page
  { path: '/assets/domains',     component: () => import('@/modules/domain-inspection/views/DomainView.vue'), meta: { requiresAuth: true, title: 'Domain Inspection', crumbs: [{ label: 'Services' }] } },
  {
    path: '/assets/domains/:id',
    component: () => import('@/modules/domain-inspection/views/DomainDetailView.vue'),
    // No domains (e.g. the no-data demo) means there is nothing to show on a detail page.
    beforeEnter: () => (getDomains().length ? true : '/assets/domains'),
    meta: {
      requiresAuth: true,
      title: 'Domain Detail',
      crumbs: [{ label: 'Services' }, { label: 'Domain Inspection', to: '/assets/domains' }],
      tabQuery: 'view',
      tabLabels: { findings: 'Endpoint Findings', reputation: 'Domain Reputation' },
    },
  },
  { path: '/assets/networks',    component: () => import('@/modules/network/views/NetworkView.vue'), meta: { requiresAuth: true, title: 'Network', crumbs: [{ label: 'Services' }] } },
  {
    path: '/assets/networks/:id',
    component: () => import('@/modules/network/views/NetworkDetailView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Network Detail',
      crumbs: [{ label: 'Services' }, { label: 'Network', to: '/assets/networks' }],
      tabQuery: 'view',
      tabLabels: { findings: 'Endpoint Findings' },
    },
  },
  { path: '/assets/webapps',     component: () => import('@/modules/web-application/views/WebAppView.vue'), meta: { requiresAuth: true, title: 'Web Application', crumbs: [{ label: 'Services' }] } },
  {
    path: '/assets/webapps/:id',
    component: () => import('@/modules/web-application/views/WebAppDetailView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Web Application Detail',
      crumbs: [{ label: 'Services' }, { label: 'Web Application', to: '/assets/webapps' }],
    },
  },
  {
    path: '/assets/source-code',
    component: () => import('@/modules/source-code/views/SourceCodeView.vue'),
    meta: { requiresAuth: true, title: 'Source Code', crumbs: [{ label: 'Services' }] },
  },
  {
    path: '/assets/source-code/:id',
    component: () => import('@/modules/source-code/views/SourceCodeDetailView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Source Code Detail',
      crumbs: [{ label: 'Services' }, { label: 'Source Code', to: '/assets/source-code' }],
    },
  },
  {
    path: '/scans/history',
    component: () => import('@/modules/scans/views/CiCdView.vue'),
    meta: { requiresAuth: true, title: 'Report Log', crumbs: [{ label: 'CI/CD' }] },
  },
  {
    path: '/scans/history/:runId/vulnerabilities',
    component: () => import('@/modules/scans/views/VulnerabilityOverviewView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Vulnerability Overview',
      crumbs: [{ label: 'CI/CD' }, { label: 'Report Log', to: '/scans/history' }],
    },
  },
  { path: '/scans/:section?',     component: Placeholder, meta: { requiresAuth: true } },
  { path: '/vulnerabilities',     component: Placeholder, meta: { requiresAuth: true } },
  { path: '/reports',             component: Placeholder, meta: { requiresAuth: true } },
  {
    path: '/settings',
    component: () => import('@/modules/settings/views/SettingsView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Settings',
      crumbs: [],
      // The active section lives in ?section= so the breadcrumb shows it.
      tabQuery: 'section',
      tabLabels: { profile: 'Profile', 'two-factor': 'Two-factor authentication' },
    },
  },
  {
    path: '/settings/api-keys',
    component: () => import('@/modules/settings/views/ApiKeysView.vue'),
    meta: { requiresAuth: true, title: 'API Keys', crumbs: [{ label: 'CI/CD' }] },
  },
  {
    path: '/companies',
    component: () => import('@/modules/company/views/CompanyView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Company',
      crumbs: [{ label: 'Manage' }],
      // The Company page's tabs live client-side as a `tab` query param —
      // this lets the breadcrumb reflect the active tab as a trailing
      // crumb instead of always showing the static page title.
      tabQuery: 'tab',
      tabLabels: { overview: 'Overview', list: 'Sub company', audit: 'Audit log', probe: 'Integration' },
    },
  },
  {
    path: '/companies/:id',
    component: () => import('@/modules/company/views/CompanyMembersView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Company Members',
      // Mirrors the Company page's own trail for the Sub company tab
      // (Manage › Company › Sub company), then this page as the current crumb.
      crumbs: [
        { label: 'Manage' },
        { label: 'Company', to: '/companies' },
        { label: 'Sub company', to: '/companies?tab=list' },
      ],
    },
  },
  { path: '/credits',             component: Placeholder, meta: { requiresAuth: true } },
  {
    path: '/tickets',
    component: () => import('@/modules/tickets/views/TicketListView.vue'),
    meta: { requiresAuth: true, title: 'Ticket', crumbs: [{ label: 'Manage' }] },
  },
  {
    path: '/tickets/:id',
    component: () => import('@/modules/tickets/views/TicketDetailView.vue'),
    meta: { requiresAuth: true, title: 'Ticket Detail', crumbs: [{ label: 'Manage' }, { label: 'Ticket', to: '/tickets' }] },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes,
    {
      path: '/',
      component: AppLayout,
      children: appRoutes,
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

router.beforeEach((to) => {
  if (dashboardOrigin.value && to.path !== dashboardOrigin.value) dashboardOrigin.value = null
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/' || to.path === '') {
    return { path: '/dashboard' }
  }
})

export default router
