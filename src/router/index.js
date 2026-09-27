import { createRouter, createWebHistory } from 'vue-router'
import { h } from 'vue'
import { useAuthStore } from '@/store/auth'
import AppLayout    from '@/components/layout/AppLayout.vue'
import authRoutes   from './auth'
import dashboardRoutes from './dashboard'

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
    component: () => import('@/views/Assets/AssetInventoryView.vue'),
    meta: { requiresAuth: true, title: 'Asset Inventory', crumbs: [{ label: 'Manage' }] },
  },
  // Services — each shows a blank Work in Progress page
  { path: '/assets/domains',     component: Placeholder, meta: { requiresAuth: true, title: 'Domain Inspection' } },
  { path: '/assets/networks',    component: () => import('@/views/Assets/NetworkView.vue'), meta: { requiresAuth: true, title: 'Network', crumbs: [{ label: 'Services' }] } },
  {
    path: '/assets/networks/:id',
    component: () => import('@/views/Assets/NetworkDetailView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Network Detail',
      crumbs: [{ label: 'Services' }, { label: 'Network', to: '/assets/networks' }],
      tabQuery: 'view',
      tabLabels: { findings: 'Endpoint Findings' },
    },
  },
  { path: '/assets/webapps',     component: () => import('@/views/Assets/WebAppView.vue'), meta: { requiresAuth: true, title: 'Web Application', crumbs: [{ label: 'Services' }] } },
  {
    path: '/assets/webapps/:id',
    component: () => import('@/views/Assets/WebAppDetailView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Web Application Detail',
      crumbs: [{ label: 'Services' }, { label: 'Web Application', to: '/assets/webapps' }],
    },
  },
  {
    path: '/assets/source-code',
    component: () => import('@/views/Assets/SourceCodeView.vue'),
    meta: { requiresAuth: true, title: 'Source Code', crumbs: [{ label: 'Services' }] },
  },
  {
    path: '/assets/source-code/:id',
    component: () => import('@/views/Assets/SourceCodeDetailView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Source Code Detail',
      crumbs: [{ label: 'Services' }, { label: 'Source Code', to: '/assets/source-code' }],
    },
  },
  {
    path: '/scans/history',
    component: () => import('@/views/Scans/CiCdView.vue'),
    meta: { requiresAuth: true, title: 'Report Log', crumbs: [{ label: 'CI/CD' }] },
  },
  {
    path: '/scans/history/:runId/vulnerabilities',
    component: () => import('@/views/Scans/VulnerabilityOverviewView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Vulnerability Overview',
      crumbs: [{ label: 'CI/CD' }, { label: 'Report Log', to: '/scans/history' }],
    },
  },
  { path: '/scans/:section?',     component: Placeholder, meta: { requiresAuth: true } },
  { path: '/vulnerabilities',     component: Placeholder, meta: { requiresAuth: true } },
  { path: '/reports',             component: Placeholder, meta: { requiresAuth: true } },
  { path: '/settings',            component: Placeholder, meta: { requiresAuth: true } },
  {
    path: '/settings/api-keys',
    component: () => import('@/views/Settings/ApiKeysView.vue'),
    meta: { requiresAuth: true, title: 'API Keys', crumbs: [{ label: 'CI/CD' }] },
  },
  {
    path: '/companies',
    component: () => import('@/views/Company/CompanyView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Company',
      crumbs: [{ label: 'Manage' }],
      // The Company page's tabs live client-side as a `tab` query param —
      // this lets the breadcrumb reflect the active tab as a trailing
      // crumb instead of always showing the static page title.
      tabQuery: 'tab',
      tabLabels: { overview: 'Overview', list: 'Company list', audit: 'Audit log', probe: 'Probe box' },
    },
  },
  { path: '/credits',             component: Placeholder, meta: { requiresAuth: true } },
  {
    path: '/tickets',
    component: () => import('@/views/Tickets/TicketListView.vue'),
    meta: { requiresAuth: true, title: 'Ticket', crumbs: [{ label: 'Manage' }] },
  },
  {
    path: '/tickets/:id',
    component: () => import('@/views/Tickets/TicketDetailView.vue'),
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
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/' || to.path === '') {
    return { path: '/dashboard' }
  }
})

export default router
