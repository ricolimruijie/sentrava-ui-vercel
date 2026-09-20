const repos = ['protergo-cyber-security', 'sentra-dashboard', 'payments-service', 'auth-gateway']
const branches = ['main', 'develop', 'release/2.4', 'hotfix/scan-timeout']
const statuses = ['completed', 'completed', 'completed', 'failed', 'running']

// 100 pipeline runs, newest first.
export const cicdRunsMock = Array.from({ length: 100 }, (_, i) => {
  const day = (i % 27) + 1
  const month = (Math.floor(i / 27) % 9) + 1
  const hour = (i % 12) + 1
  const minute = (i * 7) % 60
  return {
    id: `run-${i + 1}`,
    dateTime: `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`,
    repository: repos[i % repos.length],
    branch: branches[i % branches.length],
    status: statuses[i % statuses.length],
  }
})
