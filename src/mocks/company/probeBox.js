const probeNames = [
  'probe-jakarta-01', 'probe-jakarta-02', 'probe-surabaya-01', 'probe-bandung-01',
  'probe-dc-primary', 'probe-dc-backup', 'probe-remote-vpn',
]
const statuses = ['online', 'online', 'online', 'offline', 'online', 'offline', 'online']

export const probeBoxMock = probeNames.map((name, i) => ({
  id: `probe-${i + 1}`,
  name,
  ip: `10.20.${i + 1}.${10 + i}`,
  status: statuses[i % statuses.length],
  lastSeen: `2026-0${(i % 9) + 1}-${String((i * 3) % 27 + 1).padStart(2, '0')}T${String((i % 12) + 1).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00Z`,
}))
