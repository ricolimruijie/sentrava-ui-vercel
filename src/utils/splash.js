// Splash screen (markup and styles live in index.html). Stays up for at least MIN_MS after the page
// started loading so it never just flashes, then fades out and is removed.
const MIN_MS = 1400

export function hideSplash() {
  const el = document.getElementById('splash')
  if (!el) return
  const wait = Math.max(0, MIN_MS - performance.now())
  setTimeout(() => {
    el.classList.add('splash--out')
    setTimeout(() => el.remove(), 600)
  }, wait)
}
