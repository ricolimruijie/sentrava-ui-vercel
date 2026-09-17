export const clientDashboardMock = {
  greeting: { name: 'ricolimruijie', company: 'Protergo Cyber Security Ampera' },

  // ── 0. Overall Severity Trend ────────────────────────────────────────────────
  severityTrend: {
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
  },

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
  topVulnerabilities: [
    { id: 1, name: 'CVE-2025-29847 · OpenSSL heap overflow',  affectedAsset: 'api-prod-O3',  services: 'Domain Inspection', severity: 'critical' },
    { id: 2, name: 'SQL injection in /api/users',             affectedAsset: 'orders-svc',    services: 'Domain Inspection', severity: 'critical' },
    { id: 3, name: 'Outdated jQuery 1.12.4',                  affectedAsset: 'web-console',   services: 'Source Code',       severity: 'critical' },
    { id: 4, name: 'TLS 1.0 still enabled',                   affectedAsset: 'vpn-edge',      services: 'Network',           severity: 'high' },
    { id: 5, name: 'Weak SSH ciphers detected',               affectedAsset: 'bastion-01',    services: 'Web Application',   severity: 'high' },
    { id: 6, name: 'Exposed .git directory',                  affectedAsset: 'static-cdn',    services: 'Source Code',       severity: 'high' },
    { id: 7, name: 'Missing Content-Security-Policy header',  affectedAsset: 'marketing-web', services: 'Web Application',   severity: 'medium' },
    { id: 8, name: 'Open redirect on /auth/callback',         affectedAsset: 'auth-svc',      services: 'Domain Inspection', severity: 'medium' },
  ],

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
    { id: 't1',  label: 'Application & System Failures', name: 'API gateway returning 502 on /checkout',        color: '#FF2529', status: 'open' },
    { id: 't2',  label: 'Application & System Failures', name: 'Memory leak in order-processing pod',           color: '#FF2529', status: 'open' },
    { id: 't3',  label: 'General Enquiry',               name: 'Request for DAST scope expansion',              color: '#2563EB', status: 'resolved' },
    { id: 't4',  label: 'Others',                        name: 'OpenSSL CVE-2025-29847 remediation',            color: '#64748B', status: 'open' },
    { id: 't5',  label: 'Others',                        name: 'Analyst onboarding — new team member',          color: '#64748B', status: 'resolved' },
    { id: 't6',  label: 'Application & System Failures', name: 'Database connection pool exhausted',            color: '#FF2529', status: 'resolved' },
    { id: 't7',  label: 'Others',                        name: 'Outdated jQuery 1.12.4 flagged on web-console', color: '#64748B', status: 'open' },
    { id: 't8',  label: 'General Enquiry',               name: 'Question about credit usage this month',        color: '#2563EB', status: 'resolved' },
    { id: 't9',  label: 'Others',                        name: 'Revoke access for former contractor',           color: '#64748B', status: 'resolved' },
    { id: 't10', label: 'Application & System Failures', name: 'Scheduled scan failed to start on time',        color: '#FF2529', status: 'open' },
    { id: 't11', label: 'Others',                        name: 'Exposed .git directory on static-cdn',          color: '#64748B', status: 'resolved' },
    { id: 't12', label: 'General Enquiry',               name: 'Clarify scope for upcoming pen test',           color: '#2563EB', status: 'open' },
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
