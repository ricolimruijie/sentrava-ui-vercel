const baseNames = [
  'Production Key', 'CI/CD Pipeline', 'Staging Environment', 'Analytics Dashboard',
  'Mobile App', 'Partner Integration', 'Reporting Service', 'Backup Sync',
  'Webhook Listener', 'Internal Tooling', 'QA Automation', 'Billing Service',
  'Support Portal', 'Monitoring Agent', 'Data Export', 'Slack Bot',
  'Legacy System', 'Customer Portal', 'Vendor Access', 'Sandbox Testing',
]

// Deterministic pseudo-random hex (seeded by index) so mock data stays
// stable across reloads instead of reshuffling on every hot-reload.
function seededHex(seed, len) {
  let out = ''
  let x = seed || 1
  for (let i = 0; i < len; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff
    out += (x % 16).toString(16)
  }
  return out
}

function trackingId(seed) {
  return `${seededHex(seed, 8)}-${seededHex(seed + 1, 4)}-${seededHex(seed + 2, 4)}-${seededHex(seed + 3, 4)}-${seededHex(seed + 4, 12)}`
}

function maskedKey(seed) {
  return `sk-${seededHex(seed + 5, 6)}*****${seededHex(seed + 6, 12)}`
}

// 100 keys (the account limit) — newest first.
export const apiKeysMock = Array.from({ length: 100 }, (_, i) => {
  const seed = i * 97 + 13
  const cycle = Math.floor(i / baseNames.length) + 1
  const name = cycle > 1 ? `${baseNames[i % baseNames.length]} ${cycle}` : baseNames[i % baseNames.length]
  return {
    id: `key-${i + 1}`,
    name,
    trackingId: trackingId(seed),
    key: maskedKey(seed),
    created: `2026-0${(i % 9) + 1}-0${(i % 8) + 1}`,
    lastUsed: `2026-0${((i + 2) % 9) + 1}-1${i % 9}`,
    requests: (i * 37 + 5) % 500,
  }
})
