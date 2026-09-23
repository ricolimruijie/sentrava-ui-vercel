// Web Application Assessment seed data. Tags always include the shared
// Database / Server / Cloud base plus two extras from the same pool, so the
// table and the Manage Tags popover vocab stay consistent.
const BASE_TAGS = [
  { label: 'Database', colorId: 2 },
  { label: 'Server', colorId: 6 },
  { label: 'Cloud', colorId: 0 },
]
const EXTRA_TAGS = [
  { label: 'Production', colorId: 4 },
  { label: 'Staging', colorId: 1 },
  { label: 'Internal', colorId: 9 },
  { label: 'VPN', colorId: 7 },
  { label: 'CDN', colorId: 5 },
  { label: 'Dev', colorId: 3 },
  { label: 'Mail', colorId: 8 },
  { label: 'Backup', colorId: 10 },
  { label: 'Load balancer', colorId: 6 },
]

const ROWS = [
  { id: 1, name: 'Website Protergo Cyber Security', target: 'https://protergo.id', owner: 'Protergo Cyber Security HQ', scanType: 'manual', status: 'Scanning', extras: [0, 4] },
  { id: 2, name: 'Customer Portal', target: 'https://portal.protergo.id', owner: 'Protergo Cyber Security Jakarta', scanType: 'scheduled', status: 'Queue', extras: [1, 5] },
  { id: 3, name: 'Billing Dashboard', target: 'https://billing.protergo.id', owner: 'Protergo Fintech Solutions', scanType: 'continuous', status: 'Completed', extras: [0, 8] },
  { id: 4, name: 'Partner API Gateway', target: 'https://api.protergo.id/v2', owner: 'Protergo Labs', scanType: 'manual', status: 'Failed', extras: [2, 6] },
  { id: 5, name: 'Staging Storefront', target: 'https://staging.shop.protergo.id', owner: 'Protergo Cyber Security Surabaya', scanType: 'scheduled', status: 'Waiting', extras: [1, 3] },
  { id: 6, name: 'VPN Admin Console', target: 'https://vpn.protergo.id/admin', owner: 'Protergo Cyber Security Bandung', scanType: 'continuous', status: 'Scanning', extras: [3, 2] },
  { id: 7, name: 'Docs Portal', target: 'https://docs.protergo.id', owner: 'Beta Ventures Security', scanType: 'manual', status: 'Completed', extras: [4, 7] },
  { id: 8, name: 'Mobile API Backend', target: 'https://m.protergo.id/api', owner: 'Protergo Cyber Security Rempoa', scanType: 'scheduled', status: 'Queue', extras: [5, 0] },
  { id: 9, name: 'Legacy CRM', target: 'https://crm.protergo.id', owner: 'Protergo Cyber Security Ciputat', scanType: 'continuous', status: 'NotStarted', extras: [7, 1] },
  { id: 10, name: 'Status Page', target: 'https://status.protergo.id', owner: 'Protergo Cyber Security HQ', scanType: 'manual', status: 'Completed', extras: [6, 8] },
]

export function getWebApps() {
  return structuredClone(ROWS.map((r) => ({
    id: r.id,
    name: r.name,
    target: r.target,
    owner: r.owner,
    scanType: r.scanType,
    status: r.status,
    tags: [...BASE_TAGS, EXTRA_TAGS[r.extras[0]], EXTRA_TAGS[r.extras[1]]],
  })))
}

// Scan timeline entries for the web app detail page, newest first.
export function getWebAppScans() {
  return [
    { id: 's1', date: '14 Jul 2026 12:59', status: 'Completed' },
    { id: 's2', date: '09 Jul 2026 14:25', status: 'Completed' },
    { id: 's3', date: '03 Jul 2026 14:24', status: 'Completed' },
    { id: 's4', date: '01 Jul 2026 14:33', status: 'Completed' },
  ]
}

// Findings for the selected web app scan.
export function getWebAppVulns() {
  return [
    { id: 'v1', name: 'SSH Auth Methods - Detection', component: 'etc/ssh/sshd_config', line: 22, severity: 'info', lastModified: '14 Jul 2026 13:26', modifiedBy: 'Finished scan by system', modifiedEmail: '', cycle: 'Active' },
    { id: 'v2', name: 'SSH Password-based Authentication', component: 'etc/ssh/sshd_config', line: 57, severity: 'info', lastModified: '14 Jul 2026 13:26', modifiedBy: 'Finished scan by system', modifiedEmail: '', cycle: 'Active' },
    { id: 'v3', name: 'SSH SHA-1 HMAC Algorithms Enabled', component: 'etc/ssh/ssh_config', line: 34, severity: 'info', lastModified: '14 Jul 2026 13:26', modifiedBy: 'Finished scan by system', modifiedEmail: '', cycle: 'Active' },
    { id: 'v4', name: 'OpenSSH Service - Detect', component: 'usr/sbin/sshd', line: 19, severity: 'info', lastModified: '14 Jul 2026 13:26', modifiedBy: 'Finished scan by system', modifiedEmail: '', cycle: 'Active' },
    { id: 'v5', name: 'CAA Record', component: 'dns/zone/protergo.id', line: 41, severity: 'info', lastModified: '14 Jul 2026 13:26', modifiedBy: 'Finished scan by system', modifiedEmail: '', cycle: 'Active' },
    { id: 'v6', name: 'SSH Server Software Enumeration', component: 'var/log/auth.log', line: 208, severity: 'info', lastModified: '14 Jul 2026 13:26', modifiedBy: 'Finished scan by system', modifiedEmail: '', cycle: 'Active' },
  ]
}
