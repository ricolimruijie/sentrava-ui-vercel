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
  { id: 1, lastScanned: '14 July 2026', name: 'Website Protergo Cyber Security', target: 'https://protergo.id', owner: 'Protergo Cyber Security HQ', scanType: 'manual', status: 'Scanning', extras: [0, 4], auth: 'Inactive' },
  { id: 2, lastScanned: '16 July 2026', name: 'Customer Portal', target: 'https://portal.protergo.id', owner: 'Protergo Cyber Security Jakarta', scanType: 'scheduled', status: 'Completed', extras: [1, 5], auth: 'Active' },
  { id: 3, lastScanned: '12 July 2026', name: 'Billing Dashboard', target: 'https://billing.protergo.id', owner: 'Protergo Fintech Solutions', scanType: 'continuous', status: 'Scanning', extras: [0, 8], recurrence: 'weekly', auth: 'Inactive' },
]

export function getWebApps() {
  return structuredClone(ROWS.map((r) => ({
    id: r.id,
    name: r.name,
    target: r.target,
    owner: r.owner,
    scanType: r.scanType,
    lastScanned: r.lastScanned ?? null,
    status: r.status,
    recurrence: r.recurrence ?? null,
    auth: r.auth ?? 'Inactive',
    tags: [],
  })))
}

// Scan timeline entries per app — same shape as the source-code timelines for
// each scan type: manual keeps a completed history with one failed run,
// scheduled queues upcoming runs, continuous shows an active scan.
export function getWebAppScans(appId) {
  if (appId === 2) {
    // scheduled — mirrors tcg-royal
    return [
      { id: 't1', date: '14 Jul 2026 12:59', status: 'Failed', duration: '2m 03s' },
      { id: 't2', date: '15 Jul 2026 08:00', status: 'Completed', duration: '4m 15s' },
      { id: 't3', date: '16 Jul 2026 08:00', status: 'Scanning', duration: null },
      { id: 't4', date: '17 Jul 2026 08:00', status: 'Waiting', duration: null },
      { id: 't5', date: '18 Jul 2026 08:00', status: 'Waiting', duration: null },
      { id: 't6', date: '19 Jul 2026 08:00', status: 'Waiting', duration: null },
      { id: 't7', date: '20 Jul 2026 08:00', status: 'Waiting', duration: null },
      { id: 't8', date: '21 Jul 2026 08:00', status: 'Waiting', duration: null },
    ]
  }
  if (appId === 3) {
    // continuous — mirrors aoc-glasshour
    return [
      { id: 'c3', date: '09 Jul 2026 14:25', status: 'Completed', duration: '4m 52s' },
      { id: 'c1', date: '14 Jul 2026 12:59', status: 'Scanning', duration: null },
      { id: 'c2', date: '20 Jul 2026 08:00', status: 'Waiting', duration: null },
    ]
  }
  // manual (id 1) — mirrors the default source-code timeline
  return [
    { id: 's1', date: '14 Jul 2026 12:59', status: 'Scanning', duration: null },
    { id: 's2', date: '09 Jul 2026 14:25', status: 'Completed', duration: '5m 10s' },
    { id: 's3', date: '03 Jul 2026 14:24', status: 'Failed', duration: '2m 03s' },
    { id: 's4', date: '01 Jul 2026 14:33', status: 'Completed', duration: '4m 05s' },
    { id: 's5', date: '28 Jun 2026 11:45', status: 'Completed', duration: '6m 02s' },
    { id: 's6', date: '25 Jun 2026 08:30', status: 'Completed', duration: '1m 44s' },
    { id: 's7', date: '20 Jun 2026 16:00', status: 'Completed', duration: '3m 59s' },
    { id: 's8', date: '18 Jun 2026 08:30', status: 'Completed', duration: '5m 24s' },
  ]
}

// Findings for the selected web app scan.
export function getWebAppVulns() {
  return BASE_WEB_VULNS.map((v) => ({ ...v, codeLine: v.line, ...WEB_VULN_DETAILS[v.id] }))
}

// Deep-dive content for VulnerabilityDetailModal, aligned to each finding.
const WEB_VULN_DETAILS = {
  v1: {
    cves: [],
    findingType: 'Technology Detection',
    cvss: null,
    cwe: 'CWE-287: Improper Authentication',
    owasp: 'A07:2021 - Identification and Authentication Failures',
    likelihood: 'medium', impact: 'low', confidence: 'high',
    summary: 'The SSH service advertises multiple authentication methods, giving attackers a broad surface to probe for the weakest accepted mechanism.',
    extractedResult: 'Banner and method enumeration against the target at etc/ssh/sshd_config:22 confirmed keyboard-interactive, publickey, and password methods are all enabled.',
    impactText: 'A wide method list lets attackers focus on the least secure option (typically password auth) and increases brute-force success odds.',
    mitigationText: 'Disable unused auth methods in sshd_config so only publickey remains, and restart the daemon during a maintenance window.',
    insightText: 'Default OpenSSH installs enable every compiled-in method; production hardening guides consistently recommend trimming this list first.',
    codeSnippet: '# etc/ssh/sshd_config:22\nPasswordAuthentication yes\nChallengeResponseAuthentication yes\nPubkeyAuthentication yes',
    references: [
      { label: 'CWE-287', url: 'https://cwe.mitre.org/data/definitions/287.html' },
      { label: 'OpenSSH sshd_config manual', url: 'https://man.openbsd.org/sshd_config' },
    ],
  },
  v2: {
    cves: ['CVE-2024-6387', 'CVE-2024-6388', 'CVE-2024-6389'],
    findingType: 'Vulnerability',
    cvss: null,
    cwe: 'CWE-307: Improper Restriction of Excessive Authentication Attempts',
    owasp: 'A07:2021 - Identification and Authentication Failures',
    likelihood: 'high', impact: 'high', confidence: 'high',
    summary: 'Password-based SSH authentication is enabled on an internet-reachable host, exposing it to credential stuffing and brute-force campaigns.',
    extractedResult: 'Handshake analysis at etc/ssh/sshd_config:57 shows password auth accepted with no fail2ban or rate-limit gate in front of port 22.',
    impactText: 'Automated botnets routinely compromise hosts in this configuration and use them for cryptomining, spam relay, or lateral movement.',
    mitigationText: 'Switch to key-only authentication, enforce fail2ban with aggressive bans, and restrict port 22 to known jump-host ranges.',
    insightText: 'Password SSH on a public IP is among the most exploited misconfigurations in the wild — compromise often follows within days of exposure.',
    codeSnippet: '# etc/ssh/sshd_config:57\nPasswordAuthentication yes   # <- disable\nPermitRootLogin prohibit-password',
    references: [
      { label: 'CWE-307', url: 'https://cwe.mitre.org/data/definitions/307.html' },
      { label: 'OWASP Authentication Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html' },
    ],
  },
  v3: {
    cves: [],
    findingType: 'Vulnerability',
    cvss: null,
    cwe: 'CWE-327: Use of a Broken or Risky Cryptographic Primitive',
    owasp: 'A02:2021 - Cryptographic Failures',
    likelihood: 'medium', impact: 'medium', confidence: 'high',
    summary: 'The SSH daemon negotiates HMAC-SHA1 message authentication codes, whose 160-bit tags offer a shrinking security margin against collision attacks.',
    extractedResult: 'Algorithm negotiation at etc/ssh/ssh_config:34 lists hmac-sha1 in the accepted MACs for session integrity.',
    impactText: 'Weakened integrity primitives allow theoretical forgery of session traffic and fail compliance checks that mandate SHA-2 or better.',
    mitigationText: 'Set MACs to hmac-sha2-256,hmac-sha2-512 only and verify with ssh -Q mac before rolling the change fleet-wide.',
    insightText: 'SHA-1 deprecation has been rolling across protocols for years; SSH clients lag because configs are copied forward unchanged.',
    codeSnippet: '# etc/ssh/ssh_config:34\nMACs hmac-sha1,hmac-sha2-256   # <- drop hmac-sha1',
    references: [
      { label: 'CWE-327', url: 'https://cwe.mitre.org/data/definitions/327.html' },
      { label: 'OpenSSH legacy options', url: 'https://www.openssh.com/legacy.html' },
    ],
  },
  v4: {
    cves: ['CVE-2018-15473', 'CVE-2018-15474', 'CVE-2018-15475'],
    findingType: 'Technology Detection',
    cvss: null,
    cwe: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor',
    owasp: 'A01:2021 - Broken Access Control',
    likelihood: 'high', impact: 'low', confidence: 'high',
    summary: 'The OpenSSH banner discloses the exact server version, handing attackers a fingerprint they can match against known exploit lists.',
    extractedResult: 'TCP banner grab on usr/sbin/sshd:19 returned the full "SSH-2.0-OpenSSH_8.2" version string.',
    impactText: 'Version disclosure alone rarely enables compromise but it sharply narrows exploit targeting and speeds up automated attacks.',
    mitigationText: 'Set "DebianBanner no" or strip the version comment, and keep the daemon patched so the fingerprint maps to a fixed build.',
    insightText: 'Banner minimization is low-effort defense in depth — scanners like Shodan index version strings within hours of exposure.',
    codeSnippet: '# usr/sbin/sshd:19 (banner)\nSSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5',
    references: [
      { label: 'CWE-200', url: 'https://cwe.mitre.org/data/definitions/200.html' },
    ],
  },
  v5: {
    cves: [],
    findingType: 'DNS',
    cvss: null,
    cwe: 'CWE-16: Configuration',
    owasp: 'A05:2021 - Security Misconfiguration',
    likelihood: 'low', impact: 'low', confidence: 'medium',
    summary: 'No Certification Authority Authorization (CAA) record exists for the zone, so any public CA can issue certificates for the domain.',
    extractedResult: 'DNS lookup against dns/zone/protergo.id:41 returned no CAA record set for the apex or monitored subdomains.',
    impactText: 'Without CAA scoping, a compromised or negligent CA could issue a rogue certificate enabling phishing or interception.',
    mitigationText: 'Publish a restrictive CAA record naming only the CAs in use, e.g. 0 issue "letsencrypt.org", plus an iodef contact.',
    insightText: 'CAA is a one-line DNS change with outsized effect, yet adoption remains low outside regulated industries.',
    codeSnippet: '; dns/zone/protergo.id:41 — missing\n@  IN  CAA  0 issue "letsencrypt.org"\n@  IN  CAA  0 iodef "mailto:security@protergo.id"',
    references: [
      { label: 'RFC 8659 — CAA', url: 'https://datatracker.ietf.org/doc/html/rfc8659' },
    ],
  },
  v6: {
    cves: [],
    findingType: 'Technology Detection',
    cvss: null,
    cwe: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor',
    owasp: 'A01:2021 - Broken Access Control',
    likelihood: 'medium', impact: 'low', confidence: 'high',
    summary: 'The SSH server version string is enumerable through routine handshake logging, confirming the build for anyone watching auth logs or banners.',
    extractedResult: 'Log review at var/log/auth.log:208 shows repeated version-string probes answered in full by the daemon.',
    impactText: 'Confirmed build details feed targeted exploit selection; combined with unpatched services this shortens attacker dwell time.',
    mitigationText: 'Suppress version output, ship logs to the SIEM with alerting on enumeration patterns, and patch on a fixed cadence.',
    insightText: 'Enumeration findings cluster together — where version strings leak, patch hygiene usually needs attention too.',
    codeSnippet: '# var/log/auth.log:208\nsshd[2081]: Connection from 203.0.113.7\nsshd[2081]: SSH-2.0-OpenSSH_8.2 advertised',
    references: [
      { label: 'CWE-200', url: 'https://cwe.mitre.org/data/definitions/200.html' },
    ],
  },
}

// Base rows for the findings table — merged with WEB_VULN_DETAILS above.
const BASE_WEB_VULNS = [
    { id: 'v1', name: 'SSH Auth Methods - Detection', component: 'etc/ssh/sshd_config', line: 22, severity: 'high', lastModified: '14 Jul 2026 13:26', modifiedBy: 'Finished scan by system', modifiedEmail: '', cycle: 'Active', validation: 'Check result' },
    { id: 'v2', name: 'SSH Password-based Authentication', component: 'etc/ssh/sshd_config', line: 57, severity: 'critical', lastModified: '14 Jul 2026 13:26', modifiedBy: 'Finished scan by system', modifiedEmail: '', cycle: 'Active', validation: 'Check result' },
    { id: 'v3', name: 'SSH SHA-1 HMAC Algorithms Enabled', component: 'etc/ssh/ssh_config', line: 34, severity: 'medium', lastModified: '14 Jul 2026 13:26', modifiedBy: 'Finished scan by system', modifiedEmail: '', cycle: 'Active', validation: 'Unresolved' },
    { id: 'v4', name: 'OpenSSH Service - Detect', component: 'usr/sbin/sshd', line: 19, severity: 'low', lastModified: '14 Jul 2026 13:26', modifiedBy: 'Finished scan by system', modifiedEmail: '', cycle: 'Active', validation: 'Unresolved' },
    { id: 'v5', name: 'CAA Record', component: 'dns/zone/protergo.id', line: 41, severity: 'medium', lastModified: '14 Jul 2026 13:26', modifiedBy: 'Finished scan by system', modifiedEmail: '', cycle: 'Active', validation: 'Unresolved' },
    { id: 'v6', name: 'SSH Server Software Enumeration', component: 'var/log/auth.log', line: 208, severity: 'info', lastModified: '14 Jul 2026 13:26', modifiedBy: 'Finished scan by system', modifiedEmail: '', cycle: 'Active', validation: 'Unresolved' },
  ]
