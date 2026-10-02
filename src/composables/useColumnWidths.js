import { ref, computed, watch, onBeforeUnmount, unref } from 'vue'
import { allocateColumns } from '@/components/common/tableLayout'

// Watches the element that holds a table and turns its width into a px width for every column
// (see components/common/tableLayout.js). `specs` is a ref/getter of [{ kind, base, max? }].
// `widths` is null until the element has been measured, `minWidth` is the sum of the base widths.
// The element may appear later (e.g. a table that is only rendered once its data has loaded), so the
// observer follows the ref instead of attaching once on mount.
export function useColumnWidths(elRef, specs) {
  const available = ref(0)
  let observer = null

  function measure() {
    const el = unref(elRef)
    if (el) available.value = el.clientWidth
  }
  watch(() => unref(elRef), (el) => {
    observer?.disconnect()
    observer = null
    if (!el) return
    measure()
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure)
      observer.observe(el)
    }
  }, { flush: 'post', immediate: true })
  onBeforeUnmount(() => observer?.disconnect())

  const list = computed(() => (typeof specs === 'function' ? specs() : unref(specs)))
  const result = computed(() => (available.value > 0 ? allocateColumns(available.value, list.value) : null))
  const widths = computed(() => result.value?.widths ?? null)
  const minWidth = computed(() => list.value.reduce((a, s) => a + s.base, 0))
  return { widths, minWidth }
}
