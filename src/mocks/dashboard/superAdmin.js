export const superAdminDashboardMock = {
  greeting: { name: 'Root Admin', role: 'super_admin' },

  stats: [
    { id: 'total_assets',       label: 'Total Assets',       value: 4820, change: 214, changePct:  4.6 },
    { id: 'exposure_detection', label: 'Exposure Detection', value: 312,  change:  -8, changePct: -2.5 },
    { id: 'threat_inspection',  label: 'Threat Inspection',  value: 1048, change: 37,  changePct:  3.7 },
    { id: 'network_va',         label: 'Network VA',         value: 890,  change: 55,  changePct:  6.6 },
    { id: 'application_va',     label: 'Application VA',     value: 523,  change: -14, changePct: -2.6 },
    { id: 'source_code_va',     label: 'Source Code VA',     value: 641,  change: 88,  changePct:  15.9 },
  ],

  mostUsedService: [
    { type: 'domain',      label: 'Domain',      scans: 1340, icon: 'globe' },
    { type: 'network',     label: 'Network',     scans:  987, icon: 'network' },
    { type: 'webapp',      label: 'Web App',     scans:  652, icon: 'world-www' },
    { type: 'source_code', label: 'Source Code', scans:  389, icon: 'code' },
    { type: 'url_crawl',   label: 'URL Crawl',   scans:  214, icon: 'link' },
  ],

  scanDurationOverview: {
    labels: ['Domain', 'Network', 'Web App', 'Source Code', 'URL Crawl'],
    avgMinutes: [42, 24, 14, 9, 6],
    p95Minutes: [120, 68, 38, 22, 15],
  },

  topVulnerabilities: [
    { cve: 'CVE-2024-21412', name: 'Windows Defender Bypass',          severity: 'critical', occurrences: 87,  affectedCompanies: 14 },
    { cve: 'CVE-2024-23222', name: 'WebKit Remote Code Execution',     severity: 'critical', occurrences: 73,  affectedCompanies: 11 },
    { cve: 'CVE-2024-20697', name: 'WinRAR Remote Code Execution',     severity: 'high',     occurrences: 64,  affectedCompanies:  9 },
    { cve: 'CVE-2024-38021', name: 'Microsoft Outlook RCE',            severity: 'high',     occurrences: 58,  affectedCompanies: 12 },
    { cve: 'CVE-2024-29824', name: 'Ivanti EPM SQL Injection',         severity: 'critical', occurrences: 51,  affectedCompanies:  7 },
  ],

  creditsOverview: {
    total:     250_000,
    purchased: 210_000,
    used:       88_450,
    remaining: 121_550,
    monthlyUsage: [
      { month: 'Jul', used: 9400 },
      { month: 'Aug', used: 11200 },
      { month: 'Sep', used: 13800 },
      { month: 'Oct', used: 10600 },
      { month: 'Nov', used: 15400 },
      { month: 'Dec', used: 12300 },
      { month: 'Jan', used: 15750 },
    ],
  },

  topSpendingCompanies: [
    { id: 'c1',  name: 'Acme Corporation',  creditsUsed: 18_400, scans: 312 },
    { id: 'c2',  name: 'Nexus Technologies', creditsUsed: 14_700, scans: 248 },
    { id: 'c3',  name: 'Vertex Systems',    creditsUsed: 12_100, scans: 197 },
    { id: 'c4',  name: 'Orbit Digital',     creditsUsed:  9_800, scans: 164 },
    { id: 'c5',  name: 'Pinnacle Group',    creditsUsed:  8_250, scans: 141 },
  ],

  recentActivity: [
    { id: 'a1', category: 'scan_completed',      message: 'Acme Corp: full domain sweep completed — 47 findings',         user: 'System',         timestamp: '2026-09-16T11:00:00Z' },
    { id: 'a2', category: 'credit_added',        message: '50,000 credits topped up for Nexus Technologies',               user: 'Finance Admin',  timestamp: '2026-09-16T09:30:00Z' },
    { id: 'a3', category: 'vulnerability_found', message: 'Critical CVE-2024-21412 detected across 3 client tenants',     user: 'System',         timestamp: '2026-09-15T18:10:00Z' },
    { id: 'a4', category: 'user_invited',        message: 'New company Orbit Digital onboarded',                          user: 'Super Admin',    timestamp: '2026-09-15T14:00:00Z' },
    { id: 'a5', category: 'scan_failed',         message: 'Source code scan failed for Vertex Systems — quota exceeded',  user: 'System',         timestamp: '2026-09-14T22:45:00Z' },
  ],
}
