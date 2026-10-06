import { onMounted, onBeforeUnmount } from 'vue'

// Escape closes the topmost open modal. Most modals are teleported to <body> and each has a close button
// labelled "Close", so one handler covers them all: it clicks the last visible one in the DOM (the one
// opened most recently). Anything that already handled Escape itself (dropdowns, pickers) is left alone.
function topmostCloseButton() {
  const visible = [...document.querySelectorAll('button[aria-label="Close"]')].filter((b) => {
    if (!b.isConnected || b.disabled) return false
    const r = b.getBoundingClientRect()
    if (!r.width || !r.height || getComputedStyle(b).visibility === 'hidden') return false
    // Only buttons that sit inside an overlay: a fixed-position ancestor.
    for (let el = b.parentElement; el; el = el.parentElement) {
      if (getComputedStyle(el).position === 'fixed') return true
    }
    return false
  })
  return visible.at(-1) ?? null
}

export function useEscapeToClose() {
  function onKeydown(e) {
    if (e.key !== 'Escape' || e.defaultPrevented) return
    const btn = topmostCloseButton()
    if (!btn) return
    e.preventDefault()
    btn.click()
  }
  onMounted(() => document.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
}
