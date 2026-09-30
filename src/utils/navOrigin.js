import { ref } from 'vue'

// Path of a page the user reached from the Dashboard. While set, the navbar
// breadcrumb starts at "Dashboard" instead of the page's own section. The
// router guard clears it as soon as the user navigates to any other path.
export const dashboardOrigin = ref(null)

export function pushFromDashboard(router, to) {
  dashboardOrigin.value = router.resolve(to).path
  return router.push(to)
}
