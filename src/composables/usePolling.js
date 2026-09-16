import { ref, onUnmounted, onMounted } from 'vue'

export function usePolling(fetchFn, intervalMs = 30_000) {
  const data        = ref(null)
  const loading     = ref(false)
  const error       = ref(null)
  const lastUpdated = ref(null)
  let   timer       = null

  async function execute() {
    loading.value = true
    error.value   = null
    try {
      data.value        = await fetchFn()
      lastUpdated.value = new Date()
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  function start() {
    execute()
    timer = setInterval(execute, intervalMs)
  }

  function stop() {
    clearInterval(timer)
    timer = null
  }

  onMounted(start)
  onUnmounted(stop)

  return { data, loading, error, lastUpdated, execute, start, stop }
}
