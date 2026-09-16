import { ref, onMounted } from 'vue'

export function useFetch(fetchFn, options = {}) {
  const { immediate = true, onSuccess, onError } = options

  const data    = ref(null)
  const loading = ref(false)
  const error   = ref(null)

  async function execute(...args) {
    loading.value = true
    error.value   = null
    try {
      data.value = await fetchFn(...args)
      onSuccess?.(data.value)
    } catch (e) {
      error.value = e
      onError?.(e)
    } finally {
      loading.value = false
    }
  }

  if (immediate) onMounted(execute)

  return { data, loading, error, execute, refresh: execute }
}
