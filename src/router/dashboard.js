export default [
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/modules/dashboard/views/DashboardView.vue'),
    meta: { requiresAuth: true, title: 'Dashboard', crumbs: [{ label: 'Menu' }] },
  },
]
