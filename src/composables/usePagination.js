import { ref, computed } from 'vue'

export function usePagination(options = {}) {
  const page     = ref(options.page ?? 1)
  const pageSize = ref(options.pageSize ?? 20)
  const total    = ref(0)

  const totalPages   = computed(() => Math.ceil(total.value / pageSize.value))
  const hasMore      = computed(() => page.value < totalPages.value)
  const offset       = computed(() => (page.value - 1) * pageSize.value)
  const queryParams  = computed(() => ({ page: page.value, limit: pageSize.value }))

  function nextPage()  { if (hasMore.value)          page.value++ }
  function prevPage()  { if (page.value > 1)          page.value-- }
  function goTo(n)     { page.value = Math.max(1, Math.min(n, totalPages.value || 1)) }
  function reset()     { page.value = 1 }
  function setTotal(n) { total.value = n }

  return { page, pageSize, total, totalPages, hasMore, offset, queryParams, nextPage, prevPage, goTo, reset, setTotal }
}
