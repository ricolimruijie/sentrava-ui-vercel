const TOP_VULNERABILITIES = [
    { id: 1, name: 'CVE-2025-29847 · OpenSSL heap overflow',  affectedAsset: 'api-prod-O3',  services: 'Domain Inspection', severity: 'critical', cycle: 'Active' },
    { id: 2, name: 'SQL injection in /api/users',             affectedAsset: 'orders-svc',    services: 'Domain Inspection', severity: 'critical', cycle: 'Active' },
    { id: 3, name: 'Outdated jQuery 1.12.4',                  affectedAsset: 'web-console',   services: 'Source Code',       severity: 'critical', cycle: 'Active' },
    { id: 4, name: 'TLS 1.0 still enabled',                   affectedAsset: 'vpn-edge',      services: 'Network',           severity: 'high',     cycle: 'Active' },
    { id: 5, name: 'Weak SSH ciphers detected',               affectedAsset: 'bastion-01',    services: 'Web Application',   severity: 'high',     cycle: 'Active' },
    { id: 6, name: 'Exposed .git directory',                  affectedAsset: 'static-cdn',    services: 'Source Code',       severity: 'high',     cycle: 'Active' },
    { id: 7, name: 'Cross-site scripting in /search',         affectedAsset: 'web-app-02',    services: 'Web Application',   severity: 'high',     cycle: 'Active' },
    { id: 8, name: 'Privilege escalation via SUID binary',    affectedAsset: 'app-srv-03',     services: 'Source Code',       severity: 'critical', cycle: 'Active' },
]

const TOP_VULN_DETAILS = {
  1: {
    cwe: 'CWE-122: Heap-based Buffer Overflow', cves: ['CVE-2025-29847'], cvss: { score: 9.8 }, owasp: 'A06:2021 - Vulnerable and Outdated Components',
    likelihood: 'high', impact: 'high', confidence: 'high', findingType: 'Vulnerability', validation: 'Unresolved',
    lastModified: 'Tue, 14 Jul 2026', modifiedBy: 'Finished scan by system', modifiedEmail: '',
    summary: 'A heap overflow in the OpenSSL build used by this host can be triggered by a crafted TLS handshake.',
    extractedResult: 'Version banner on api-prod-O3 reports an OpenSSL release affected by CVE-2025-29847.',
    impactText: 'Remote attackers may crash the service or execute arbitrary code in the context of the TLS process.',
    mitigationText: 'Upgrade OpenSSL to the latest patched release and restart dependent services.',
    insightText: 'Memory-safety flaws in TLS libraries are frequently weaponised within days of disclosure.',
    references: [{ label: 'CVE-2025-29847', url: 'https://nvd.nist.gov/vuln/detail/CVE-2025-29847' }],
  },
  2: {
    cwe: 'CWE-89: SQL Injection', cves: [], cvss: { score: 9.1 }, owasp: 'A03:2021 - Injection',
    likelihood: 'high', impact: 'high', confidence: 'high', findingType: 'Vulnerability', validation: 'Unresolved',
    lastModified: 'Tue, 14 Jul 2026', modifiedBy: 'Finished scan by system', modifiedEmail: '',
    summary: 'User-supplied input in /api/users is concatenated into a SQL query without parameterisation.',
    extractedResult: 'Payload \' OR 1=1-- returned the full users table from orders-svc.',
    impactText: 'Attackers can read or modify database contents and potentially take over accounts.',
    mitigationText: 'Use parameterised queries or an ORM and validate input server-side.',
    insightText: 'Injection remains one of the most exploited classes of web application flaw.',
    references: [{ label: 'CWE-89', url: 'https://cwe.mitre.org/data/definitions/89.html' }],
  },
  3: {
    cwe: 'CWE-1104: Use of Unmaintained Third Party Components', cves: ['CVE-2020-11022','CVE-2020-11023'], cvss: { score: 6.1 }, owasp: 'A06:2021 - Vulnerable and Outdated Components',
    likelihood: 'medium', impact: 'medium', confidence: 'high', findingType: 'Vulnerability', validation: 'Unresolved',
    lastModified: 'Tue, 14 Jul 2026', modifiedBy: 'Finished scan by system', modifiedEmail: '',
    summary: 'The web console bundles jQuery 1.12.4, which has known cross-site scripting issues.',
    extractedResult: 'Dependency manifest for web-console pins jquery@1.12.4.',
    impactText: 'Crafted HTML passed to jQuery DOM manipulation methods can execute attacker script.',
    mitigationText: 'Upgrade jQuery to 3.5.0 or later and re-test affected components.',
    insightText: 'Old front-end libraries are often overlooked because they are not part of the server stack.',
    references: [{ label: 'CVE-2020-11022', url: 'https://nvd.nist.gov/vuln/detail/CVE-2020-11022' }],
  },
  4: {
    cwe: 'CWE-326: Inadequate Encryption Strength', cves: [], cvss: { score: 7.4 }, owasp: 'A02:2021 - Cryptographic Failures',
    likelihood: 'medium', impact: 'high', confidence: 'high', findingType: 'Vulnerability', validation: 'Unresolved',
    lastModified: 'Tue, 14 Jul 2026', modifiedBy: 'Finished scan by system', modifiedEmail: '',
    summary: 'The VPN edge still negotiates TLS 1.0, which is deprecated and vulnerable to downgrade attacks.',
    extractedResult: 'Handshake against vpn-edge:443 accepted TLSv1.0.',
    impactText: 'Traffic may be decrypted or tampered with by a network-positioned attacker.',
    mitigationText: 'Disable TLS 1.0 and 1.1 and require TLS 1.2 or higher.',
    insightText: 'Most modern clients support TLS 1.2+, so disabling legacy versions rarely breaks users.',
    references: [{ label: 'RFC 8996', url: 'https://www.rfc-editor.org/rfc/rfc8996' }],
  },
  5: {
    cwe: 'CWE-327: Use of a Broken or Risky Cryptographic Algorithm', cves: [], cvss: { score: 5.9 }, owasp: 'A02:2021 - Cryptographic Failures',
    likelihood: 'medium', impact: 'medium', confidence: 'high', findingType: 'Vulnerability', validation: 'Unresolved',
    lastModified: 'Tue, 14 Jul 2026', modifiedBy: 'Finished scan by system', modifiedEmail: '',
    summary: 'The SSH daemon on bastion-01 offers weak ciphers and MAC algorithms.',
    extractedResult: 'Cipher enumeration on bastion-01:22 lists aes128-cbc and hmac-sha1.',
    impactText: 'Weak ciphers reduce confidentiality guarantees for administrative sessions.',
    mitigationText: 'Restrict Ciphers and MACs in sshd_config to modern AEAD options.',
    insightText: 'Hardening guides recommend chacha20-poly1305 and aes-gcm only.',
    references: [{ label: 'OpenSSH sshd_config manual', url: 'https://man.openbsd.org/sshd_config' }],
  },
  6: {
    cwe: 'CWE-538: Insertion of Sensitive Information into Externally-Accessible File', cves: [], cvss: { score: 7.5 }, owasp: 'A05:2021 - Security Misconfiguration',
    likelihood: 'high', impact: 'high', confidence: 'high', findingType: 'Vulnerability', validation: 'Unresolved',
    lastModified: 'Tue, 14 Jul 2026', modifiedBy: 'Finished scan by system', modifiedEmail: '',
    summary: 'The .git directory is publicly readable on static-cdn, exposing repository history.',
    extractedResult: 'GET /.git/HEAD returned a valid ref on static-cdn.',
    impactText: 'Source code, credentials and internal paths may be reconstructed from the repository.',
    mitigationText: 'Block access to dotfiles at the web server and rotate any exposed secrets.',
    insightText: 'Automated scanners probe for /.git within minutes of a host going live.',
    references: [{ label: 'CWE-538', url: 'https://cwe.mitre.org/data/definitions/538.html' }],
  },
  7: {
    cwe: 'CWE-79: Cross-site Scripting', cves: [], cvss: { score: 6.1 }, owasp: 'A03:2021 - Injection',
    likelihood: 'high', impact: 'medium', confidence: 'high', findingType: 'Vulnerability', validation: 'Unresolved',
    lastModified: 'Tue, 14 Jul 2026', modifiedBy: 'Finished scan by system', modifiedEmail: '',
    summary: 'The search parameter on /search is reflected into the page without output encoding.',
    extractedResult: 'Payload <script>alert(1)</script> executed on web-app-02.',
    impactText: 'Attackers can run script in victims\' browsers, stealing sessions or performing actions on their behalf.',
    mitigationText: 'Encode output contextually and apply a strict Content-Security-Policy.',
    insightText: 'Reflected XSS is commonly delivered through phishing links.',
    references: [{ label: 'CWE-79', url: 'https://cwe.mitre.org/data/definitions/79.html' }],
  },
  8: {
    cwe: 'CWE-269: Improper Privilege Management', cves: [], cvss: { score: 7.8 }, owasp: 'A01:2021 - Broken Access Control',
    likelihood: 'medium', impact: 'high', confidence: 'medium', findingType: 'Vulnerability', validation: 'Unresolved',
    lastModified: 'Tue, 14 Jul 2026', modifiedBy: 'Finished scan by system', modifiedEmail: '',
    summary: 'A SUID binary on app-srv-03 can be abused to escalate to root.',
    extractedResult: 'find / -perm -4000 listed a writable-path-dependent binary owned by root.',
    impactText: 'A local attacker can gain full control of the host.',
    mitigationText: 'Remove the SUID bit or replace the binary with a hardened alternative.',
    insightText: 'SUID audits are a standard step in Linux post-exploitation.',
    references: [{ label: 'GTFOBins', url: 'https://gtfobins.github.io/' }],
  },
}

// Splits a monthly severity total across the four services (DI = Domain
// Inspection, N = Network, WA = Web Application, SC = Source Code) using
// largest-remainder rounding so the parts always add up to the total.
const SERVICE_SHARE = {
  critical: [0.5, 0.25, 0.15, 0.1],
  high:     [0.4, 0.3, 0.2, 0.1],
  medium:   [0.35, 0.25, 0.25, 0.15],
  low:      [0.3, 0.3, 0.2, 0.2],
  info:     [0.25, 0.25, 0.25, 0.25],
}
function splitByService(total, share) {
  if (total == null) return null
  const raw = share.map((r) => total * r)
  const parts = raw.map(Math.floor)
  let left = total - parts.reduce((a, b) => a + b, 0)
  raw.map((v, i) => [v - parts[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => {
    if (left > 0) { parts[i] += 1; left -= 1 }
  })
  const [di, n, wa, sc] = parts
  return { di, n, wa, sc }
}
function withServiceBreakdown(trend) {
  for (const year of Object.values(trend.byYear)) {
    year.services = Object.fromEntries(
      Object.entries(SERVICE_SHARE).map(([sev, share]) => [sev, year[sev].map((t) => splitByService(t, share))]),
    )
  }
  return trend
}

export const clientDashboardMock = {
  greeting: { name: 'ricolimruijie', company: 'Protergo Cyber Security Ampera' },

  // ── 0. Overall Severity Trend ────────────────────────────────────────────────
  severityTrend: withServiceBreakdown({
    years: [2026, 2025, 2024],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    byYear: {
      2026: {
        critical: [16, 26, 14, 17, 11, 8, 5, 17, 18, 22, 19, 3],
        high:     [41, 27, 22, 19, 12, 5, 4, 27, 34, 30, 29, 32],
        medium:   [30, 24, 20, 18, 8, 6, 9, 27, 46, 44, 36, 34],
        low:      [10, 12, 8, 12, 34, 40, 23, 21, 17, 6, 5, 27],
        info:     [8, 7, 27, 15, 9, 7, 4, 22, 24, 22, 15, 2],
      },
      2025: {
        critical: [22, 19, 25, 12, 9, 14, 10, 6, 15, 20, 24, 18],
        high:     [30, 33, 28, 20, 15, 11, 9, 14, 22, 27, 31, 29],
        medium:   [18, 22, 26, 24, 16, 10, 7, 12, 20, 28, 33, 30],
        low:      [14, 10, 16, 22, 28, 32, 26, 18, 12, 9, 11, 15],
        info:     [6, 9, 13, 10, 8, 5, 4, 11, 17, 19, 14, 8],
      },
      // Tracking only began in July 2024 — Jan–Jun have no data (null leaves
      // a gap in the line instead of drawing a false zero).
      2024: {
        critical: [null, null, null, null, null, null, 13, 10, 8, 11, 14, 16],
        high:     [null, null, null, null, null, null, 8, 12, 19, 25, 22, 20],
        medium:   [null, null, null, null, null, null, 6, 10, 16, 21, 25, 27],
        low:      [null, null, null, null, null, null, 18, 14, 10, 7, 9, 12],
        info:     [null, null, null, null, null, null, 5, 8, 10, 12, 9, 6],
      },
    },
  }),

  // ── 1. Asset Registered Tracker ─────────────────────────────────────────────
  assetTracker: {
    total:      248,
    domain:      62,
    network:     74,
    webapp:      80,
    sourceCode:  32,
  },

  // ── 2. Account Overview ──────────────────────────────────────────────────────
  accountOverview: {
    company:      'Protergo Cyber Security Ampera',
    fullName:     'Rico Lim Rui Jie',
    username:     'ricolimruijie',
    email:        'rico@protergo.id',
    role:         'Admin',
    twoFAEnabled: true,
  },

  // ── 3. Scanner Tools Checker ─────────────────────────────────────────────────
  scannerTools: [
    {
      id:        'domain',
      name:      'Domain Inspection Scanner',
      engine:    'Greenbone',
      status:    'active',
      lastCheck: '2026-02-13T08:30:00Z',
      overtime:  [true, true, true, true, true, true, true, true, false, true, true, true],
    },
    {
      id:        'network',
      name:      'Network Scanner',
      engine:    'Greenbone',
      status:    'active',
      lastCheck: '2026-02-13T08:30:00Z',
      overtime:  [true, true, true, true, true, true, true, true, true, true, true, true],
    },
    {
      id:        'webapp',
      name:      'Web Application Scanner',
      engine:    'Nuclei',
      status:    'offline',
      lastCheck: '2026-02-13T06:15:00Z',
      overtime:  [true, true, false, false, true, true, true, true, true, true, false, false],
    },
    {
      id:        'source',
      name:      'Source Code Scanner',
      engine:    'Semgrep',
      status:    'active',
      lastCheck: '2026-02-13T08:00:00Z',
      overtime:  [true, true, true, true, true, true, true, false, true, true, true, true],
    },
  ],

  // ── 4. Top Vulnerabilities ───────────────────────────────────────────────────
  topVulnerabilities: TOP_VULNERABILITIES.map((v) => ({ ...v, ...TOP_VULN_DETAILS[v.id] })),

  // ── 5. Scanning in Progress ──────────────────────────────────────────────────
  scanningInProgress: [
    { id: 'sp1', target: 'protergo.id',         type: 'Domain Inspection', date: '13 Apr 2026', executedAt: '8:30 AM', status: 'running' },
    { id: 'sp2', target: '10.101.209.28/24',    type: 'Network',           date: '13 Apr 2026', executedAt: '8:30 AM', status: 'running' },
    { id: 'sp3', target: '10.101.209.28',       type: 'Network',           date: '13 Apr 2026', executedAt: '8:30 AM', status: 'running' },
    { id: 'sp4', target: 'https://protergo.id', type: 'Web Application',   date: '13 Apr 2026', executedAt: '8:30 AM', status: 'queued' },
    { id: 'sp5', target: 'greenbone-main',      type: 'Source Code',       date: '13 Apr 2026', executedAt: '8:30 AM', status: 'running' },
    { id: 'sp6', target: 'payments-service',    type: 'Source Code',       date: '13 Apr 2026', executedAt: '9:00 AM', status: 'running' },
    { id: 'sp7', target: 'auth-service',        type: 'Source Code',       date: '13 Apr 2026', executedAt: '9:15 AM', status: 'queued' },
    { id: 'sp8', target: 'checkout-svc',        type: 'Web Application',   date: '13 Apr 2026', executedAt: '9:20 AM', status: 'running' },
    { id: 'sp9', target: 'billing-svc',         type: 'Source Code',       date: '13 Apr 2026', executedAt: '9:35 AM', status: 'running' },
    { id: 'sp10', target: 'notify-svc',         type: 'Web Application',   date: '13 Apr 2026', executedAt: '9:40 AM', status: 'running' },
    { id: 'sp11', target: 'vpn-edge',           type: 'Network',           date: '13 Apr 2026', executedAt: '9:45 AM', status: 'running' },
  ],

  // ── 6. Ticket Feed ───────────────────────────────────────────────────────────
  ticketFeed: [
    { id: 't1',  label: 'Application & System Failures', name: 'API gateway returning 502 on /checkout',        color: '#FF2529', status: 'open',     date: '05 Sep 2026', ticketId: 'ANO31456123458765' },
    { id: 't2',  label: 'Application & System Failures', name: 'Memory leak in order-processing pod',           color: '#FF2529', status: 'open',     date: '06 Sep 2026', ticketId: 'ANO31456123458766' },
    { id: 't3',  label: 'General Enquiry',               name: 'Request for DAST scope expansion',              color: '#2563EB', status: 'resolved', date: '08 Sep 2026', ticketId: 'ANO31456123458767' },
    { id: 't4',  label: 'Others',                        name: 'OpenSSL CVE-2025-29847 remediation',            color: '#64748B', status: 'open',     date: '09 Sep 2026', ticketId: 'ANO31456123458768' },
    { id: 't5',  label: 'Others',                        name: 'Analyst onboarding new team member',            color: '#64748B', status: 'resolved', date: '10 Sep 2026', ticketId: 'ANO31456123458769' },
    { id: 't6',  label: 'Application & System Failures', name: 'Database connection pool exhausted',            color: '#FF2529', status: 'resolved', date: '11 Sep 2026', ticketId: 'ANO31456123458770' },
    { id: 't7',  label: 'Others',                        name: 'Outdated jQuery 1.12.4 flagged on web-console', color: '#64748B', status: 'open',     date: '12 Sep 2026', ticketId: 'ANO31456123458771' },
    { id: 't8',  label: 'General Enquiry',               name: 'Question about credit usage this month',        color: '#2563EB', status: 'resolved', date: '13 Sep 2026', ticketId: 'ANO31456123458772' },
    { id: 't9',  label: 'Others',                        name: 'Revoke access for former contractor',           color: '#64748B', status: 'resolved', date: '14 Sep 2026', ticketId: 'ANO31456123458773' },
    { id: 't10', label: 'Application & System Failures', name: 'Scheduled scan failed to start on time',        color: '#FF2529', status: 'open',     date: '15 Sep 2026', ticketId: 'ANO31456123458774' },
    { id: 't11', label: 'Others',                        name: 'Exposed .git directory on static-cdn',          color: '#64748B', status: 'resolved', date: '15 Sep 2026', ticketId: 'ANO31456123458765' },
    { id: 't12', label: 'General Enquiry',               name: 'Clarify scope for upcoming pen test',           color: '#2563EB', status: 'open',     date: '16 Sep 2026', ticketId: 'ANO31456123458766' },
  ],

  // ── 6b. Vulnerability Cycle Tracker ──────────────────────────────────────────
  vulnerabilityCycle: {
    active: 40,
    fixing: 25,
    mitigated: 15,
    tolerated: 12,
    falsePositive: 8,
  },

  // ── 7. Activity Feed ─────────────────────────────────────────────────────────
  recentActivity: [
    { id: 'a1', category: 'scan_completed',      message: 'Domain scan completed on protergo.id',         user: 'ricolimruijie', timestamp: '2026-09-16T08:45:00Z' },
    { id: 'a2', category: 'vulnerability_found', message: 'Critical: OpenSSL heap overflow on api-prod',  user: 'System',        timestamp: '2026-09-16T08:43:00Z' },
    { id: 'a3', category: 'scan_started',        message: 'Network scan started for 10.101.209.28/24',    user: 'ricolimruijie', timestamp: '2026-09-16T08:30:00Z' },
    { id: 'a4', category: 'ticket_created',      message: 'Ticket raised for OpenSSL CVE-2025-29847',     user: 'ricolimruijie', timestamp: '2026-09-16T08:10:00Z' },
    { id: 'a5', category: 'asset_added',         message: 'New asset added: payments-service (Source)',   user: 'admin@protergo', timestamp: '2026-09-16T07:55:00Z' },
    { id: 'a6', category: 'vulnerability_resolved', message: 'Resolved: Weak SSH ciphers on bastion-01', user: 'ricolimruijie', timestamp: '2026-09-15T17:30:00Z' },
    { id: 'a7', category: 'scan_completed',      message: 'Source code scan done — greenbone-main',       user: 'System',        timestamp: '2026-09-15T16:00:00Z' },
  ],

  companies: [
    { id: 'c1', name: 'Protergo Cyber Security Ampera' },
    { id: 'c2', name: 'Beta Ventures' },
  ],

  // ── 8. Probe Box Health ───────────────────────────────────────────────────────
  probeBoxHealth: {
    status:   'connected',
    lastCheck: '2026-02-13T08:30:00Z',
    overtime:  [true,true,true,true,true,true,true,true,false,true,true,true,true,true],
  },

  // ── 9. Scanner Status ─────────────────────────────────────────────────────────
  scannerStatus: [
    { id:'domain',  title:'Domain Inspection Scanner Status', status:'connected', lastCheck:'2026-02-13T08:30:00Z', overtime:[true,true,true,true,true,true,true,true,false,true,true,true,true,true] },
    { id:'webapp1', title:'Web Application Scanner Status',   status:'connected', lastCheck:'2026-02-13T08:30:00Z', overtime:[true,true,true,true,true,true,true,true,true,true,true,true,true,true] },
    { id:'webapp2', title:'Web Application Scanner Status',   status:'connected', lastCheck:'2026-02-13T08:30:00Z', overtime:[true,true,true,true,true,false,true,true,true,true,true,true,true,true] },
  ],
}

// ── "No data" demo mode (see utils/dataMode.js) ─────────────────────────────
// Same shape as the real dashboard payload with every figure at zero and every
// list empty, so each widget's no-data content can be reviewed.
const ZERO_SEVERITY = Array(12).fill(0)
export function emptyClientDashboard() {
  const base = clientDashboardMock
  const years = base.severityTrend.years
  return {
    ...base,
    severityTrend: withServiceBreakdown({
      years,
      months: base.severityTrend.months,
      byYear: Object.fromEntries(years.map((y) => [y, {
        critical: [...ZERO_SEVERITY], high: [...ZERO_SEVERITY], medium: [...ZERO_SEVERITY],
        low: [...ZERO_SEVERITY], info: [...ZERO_SEVERITY],
      }])),
    }),
    assetTracker: { total: 0, domain: 0, network: 0, webapp: 0, sourceCode: 0 },
    // Every VA scanner integration is listed (so the card isn't blank) but none
    // has connected yet: offline, never checked, no history.
    scannerTools: base.scannerTools.map((t) => ({ ...t, status: 'offline', lastCheck: null, overtime: [] })),
    topVulnerabilities: [],
    scanningInProgress: [],
    ticketFeed: [],
    vulnerabilityCycle: { active: 0, fixing: 0, mitigated: 0, tolerated: 0, falsePositive: 0 },
    recentActivity: [],
    probeBoxHealth: { status: 'disconnected', lastCheck: null, overtime: [] },
    scannerStatus: [],
  }
}
