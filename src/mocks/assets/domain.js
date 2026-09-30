import { endpointSeverity } from './severity.js'

// Domain Inspection seed data.
export function getDomains() {
  return structuredClone([
    { id: 1, endpoint: 'protergo.id', targetType: 'Domain', scanType: 'manual_scan', lastScanned: '14 July 2026', registeredCount: 10, status: 'Scanning', tags: [], owner: 'Protergo Cyber Security Rempoa' },
    { id: 2, endpoint: 'acme-corp.com', targetType: 'Domain', scanType: 'scheduled_scan', lastScanned: '23 June 2026', registeredCount: 10, status: 'Completed', tags: [], owner: 'Protergo Cyber Security Ampera' },
    { id: 3, endpoint: 'beta-ventures.io', targetType: 'Domain', scanType: 'continuous_scan', lastScanned: '25 June 2026', registeredCount: 10, status: 'Scanning', tags: [], owner: 'Protergo Cyber Security Surabaya', recurrence: 'weekly' },
  ])
}

// Scan timeline entries for the network detail page, newest first. Shaped
// per target so the timeline reads correctly for its scan type: manual/
// singular targets only ever show discrete user-triggered runs (no queued or
// waiting placeholders); scheduled/specified targets show a fixed cadence
// (past runs, the next queued slot, a future waiting slot); continuous
// targets show an in-progress run backed by a run history.
const DOMAIN_SCANS = {
  // manual — CIDR (10.10.19.2/24)
  1: [
    { id: 's1', date: '14 Jul 2026 12:59', status: 'Scanning' },
    { id: 's2', date: '9 Jul 2026 14:25', status: 'Completed' },
    { id: 's3', date: '3 Jul 2026 14:24', status: 'Failed' },
    { id: 's4', date: '1 Jul 2026 14:33', status: 'Completed' },
    { id: 's5', date: '28 Jun 2026 11:45', status: 'Completed' },
    { id: 's6', date: '25 Jun 2026 09:12', status: 'Completed' },
    { id: 's7', date: '20 Jun 2026 16:05', status: 'Completed' },
    { id: 's8', date: '15 Jun 2026 10:30', status: 'Completed' },
  ],
  // manual — IP Single (10.10.19.52), same run history as the CIDR above
  2: [
    { id: 's1', date: '14 Jul 2026 12:59', status: 'Scanning' },
    { id: 's2', date: '9 Jul 2026 14:25', status: 'Completed' },
    { id: 's3', date: '3 Jul 2026 14:24', status: 'Failed' },
    { id: 's4', date: '1 Jul 2026 14:33', status: 'Completed' },
    { id: 's5', date: '28 Jun 2026 11:45', status: 'Completed' },
    { id: 's6', date: '25 Jun 2026 09:12', status: 'Completed' },
    { id: 's7', date: '20 Jun 2026 16:05', status: 'Completed' },
    { id: 's8', date: '15 Jun 2026 10:30', status: 'Completed' },
  ],
  // scheduled — CIDR (10.10.20.0/24), mirrors Web Application's Customer Portal
  3: [
    { id: 's1', date: '14 Jul 2026 12:59', status: 'Failed' },
    { id: 's2', date: '15 Jul 2026 08:00', status: 'Completed' },
    { id: 's3', date: '16 Jul 2026 08:00', status: 'Scanning' },
    { id: 's4', date: '17 Jul 2026 08:00', status: 'Waiting' },
    { id: 's5', date: '18 Jul 2026 08:00', status: 'Waiting' },
    { id: 's6', date: '19 Jul 2026 08:00', status: 'Waiting' },
    { id: 's7', date: '20 Jul 2026 08:00', status: 'Waiting' },
    { id: 's8', date: '21 Jul 2026 08:00', status: 'Waiting' },
  ],
  // continuous — CIDR (10.10.21.0/24)
  4: [
    { id: 's1', date: '11 Feb 2025 8:30 AM', status: 'Scanning' },
    { id: 's2', date: '4 Feb 2025 8:30 AM', status: 'Completed' },
    { id: 's3', date: '28 Jan 2025 8:30 AM', status: 'Completed' },
    { id: 's4', date: '21 Jan 2025 8:30 AM', status: 'Completed' },
  ],
  // specified — IP Single (10.10.19.88), mirrors Web Application's Customer Portal
  6: [
    { id: 's1', date: '14 Jul 2026 12:59', status: 'Failed' },
    { id: 's2', date: '15 Jul 2026 08:00', status: 'Completed' },
    { id: 's3', date: '16 Jul 2026 08:00', status: 'Scanning' },
    { id: 's4', date: '17 Jul 2026 08:00', status: 'Waiting' },
    { id: 's5', date: '18 Jul 2026 08:00', status: 'Waiting' },
    { id: 's6', date: '19 Jul 2026 08:00', status: 'Waiting' },
    { id: 's7', date: '20 Jul 2026 08:00', status: 'Waiting' },
    { id: 's8', date: '21 Jul 2026 08:00', status: 'Waiting' },
  ],
  // continuous — IP Single (10.10.19.91)
  7: [
    { id: 's1', date: '11 Feb 2025 8:30 AM', status: 'Scanning' },
    { id: 's2', date: '4 Feb 2025 8:30 AM', status: 'Completed' },
    { id: 's3', date: '28 Jan 2025 8:30 AM', status: 'Completed' },
  ],
}

// Finished runs carry a duration so the detail header can show "Total scan time
// taken"; a running scan shows its elapsed time, queued/waiting ones have none.
const SCAN_DURATIONS = ['4m 15s', '2m 03s', '6m 41s', '3m 27s', '5m 08s', '4m 52s', '7m 19s', '3m 44s']
export function getDomainScans(id) {
  return structuredClone(DOMAIN_SCANS[id] ?? DOMAIN_SCANS[1]).map((sc, i) => ({
    ...sc,
    duration: sc.status === 'Waiting' || sc.status === 'Queue'
      ? null
      : sc.status === 'Scanning' ? '2m 34s' : SCAN_DURATIONS[i % SCAN_DURATIONS.length],
  }))
}

// Discovered endpoints for the selected network scan (10 rows).
const ENDPOINT_OWNERS = [
  'Protergo Cyber Security HQ', 'Protergo Cyber Security HQ', 'Protergo Cyber Security HQ',
  'Protergo Cyber Security HQ', 'Protergo Cyber Security Rempoa', 'Protergo Cyber Security Rempoa',
  'Protergo Cyber Security Rempoa', 'Protergo Cyber Security Ciputat', 'Protergo Cyber Security Ciputat',
  'Protergo Cyber Security Ciputat',
]
const ENDPOINT_TAGS = [
  [{ label: 'Database', colorId: 2 }, { label: 'Server', colorId: 6 }, { label: 'Cloud', colorId: 0 }, { label: 'Production', colorId: 4 }, { label: 'CDN', colorId: 5 }],
  [{ label: 'Database', colorId: 2 }, { label: 'Server', colorId: 6 }, { label: 'Cloud', colorId: 0 }, { label: 'Staging', colorId: 1 }, { label: 'Dev', colorId: 3 }],
  [{ label: 'Database', colorId: 2 }, { label: 'Server', colorId: 6 }, { label: 'Cloud', colorId: 0 }, { label: 'Internal', colorId: 9 }, { label: 'VPN', colorId: 7 }],
  [{ label: 'Database', colorId: 2 }, { label: 'Server', colorId: 6 }, { label: 'Cloud', colorId: 0 }, { label: 'Backup', colorId: 10 }, { label: 'Mail', colorId: 8 }],
  [{ label: 'Database', colorId: 2 }, { label: 'Server', colorId: 6 }, { label: 'Cloud', colorId: 0 }, { label: 'Production', colorId: 4 }, { label: 'Load balancer', colorId: 6 }],
  [{ label: 'Database', colorId: 2 }, { label: 'Server', colorId: 6 }, { label: 'Cloud', colorId: 0 }, { label: 'Staging', colorId: 1 }, { label: 'CDN', colorId: 5 }],
  [{ label: 'Database', colorId: 2 }, { label: 'Server', colorId: 6 }, { label: 'Cloud', colorId: 0 }, { label: 'Dev', colorId: 3 }, { label: 'Internal', colorId: 9 }],
  [{ label: 'Database', colorId: 2 }, { label: 'Server', colorId: 6 }, { label: 'Cloud', colorId: 0 }, { label: 'VPN', colorId: 7 }, { label: 'Backup', colorId: 10 }],
  [{ label: 'Database', colorId: 2 }, { label: 'Server', colorId: 6 }, { label: 'Cloud', colorId: 0 }, { label: 'Mail', colorId: 8 }, { label: 'Production', colorId: 4 }],
  [{ label: 'Database', colorId: 2 }, { label: 'Server', colorId: 6 }, { label: 'Cloud', colorId: 0 }, { label: 'CDN', colorId: 5 }, { label: 'Load balancer', colorId: 6 }],
]

// Domain reputation engine results for the Domain detail card (dummy data).
const REPUTATION = {
  1: { total: 100, passed: 100, failed: 0 },
  2: { total: 100, passed: 20, failed: 80 },
  3: { total: 100, passed: 64, failed: 36 },
}
export function getDomainReputation(id) {
  return { ...(REPUTATION[id] ?? REPUTATION[1]) }
}

// Reputation engines shown in the "View details" modal (dummy data). The first
// `total` names are used so the list always matches the card's counts.
const REPUTATION_ENGINES = [
  'Badbitcoin', 'ANJ Blocked Sites', 'Abusix', 'Acronis', 'ADMINUSLabs', 'AlienVault', 'AhnLab-V3', 'Antiy-AVL', 'ArcSight Threat Intelligence', 'AutoShun',
  'Avira', 'Bambenek Consulting', 'Barracuda', 'BitcoinAbuse', 'Bitdefender', 'Blocklist.de', 'Blueliv', 'Certego', 'Check Point', 'Cisco Talos',
  'CINS Army', 'CLEAN MX', 'CMC Threat Intelligence', 'Comodo Valkyrie', 'Criminal IP', 'CrowdSec', 'CRDF', 'Cyan', 'Cyble', 'Cyradar',
  'desenmascara.me', 'DNS8', 'Dr.Web', 'Emerging Threats', 'Emsisoft', 'ESET', 'ESTsecurity', 'Forcepoint ThreatSeeker', 'Fortinet', 'G-Data',
  'Google Safebrowsing', 'GreenSnow', 'Gridinsoft', 'Heimdal Security', 'Hybrid Analysis', 'Hunt.io', 'IPsum', 'Juniper Networks', 'Kaspersky', 'Lionic',
  'Malwarebytes hpHosts', 'Malware Domain Blocklist', 'MalwarePatrol', 'MalwareURL', 'McAfee', 'Mimecast', 'Netcraft', 'OpenPhish', 'Palo Alto Networks', 'Phishing Database',
  'PhishLabs', 'Phishtank', 'PREBYTES', 'Proofpoint', 'Quick Heal', 'Quttera', 'Rising', 'SafeToOpen', 'Sangfor', 'Scantitan',
  'Seclookup', 'Securolytics', 'SOCRadar', 'Sophos', 'Spam404', 'SpamCop', 'Spamhaus', 'StopForumSpam', 'Sucuri SiteCheck', 'SURBL',
  'Symantec', 'ThreatHive', 'Threatsourcing', 'Trend Micro', 'Trustwave', 'Underworld', 'URLhaus', 'URLQuery', 'VIPRE', 'ViriBack',
  'VX Vault', 'Webroot', 'Yandex Safebrowsing', 'ZeroCERT', 'ZeroFox', 'Zvelo', 'Xcitium', 'Segasec', 'Nucleon', 'Jiangmin',
]

const ENGINE_DESCRIPTIONS = {
  Badbitcoin: 'Lists websites involved in cryptocurrency scams and fraud.',
  'ANJ Blocked Sites': 'A domain blocklist maintained by Asahi Net Japan (ANJ), primarily used to protect Japanese users. It flags domains hosting malware, phishing content, or violating local internet safety policies.',
  Spamhaus: 'Tracks domains and IPs used to send spam or host malicious infrastructure.',
  PhishLabs: 'Monitors domains impersonating brands for phishing campaigns.',
  URLhaus: 'Collects URLs that distribute malware, shared by the abuse.ch project.',
}

// Short name used in the "contact ..." step of the solution text.
const ENGINE_CONTACT = { 'ANJ Blocked Sites': 'ANJ' }

// Indexes (into the engine list) that flag each domain as failed.
// Domains listed in PASSED_AT fail every engine except those indexes.
const PASSED_AT = { 2: [1, 5, 9, 12, 17, 22, 26, 30, 35, 41, 47, 52, 58, 64, 69, 75, 81, 86, 91, 96] }
const FAILED_AT = { 3: [0, 2, 4, 6, 9, 12, 15, 19, 21, 26, 28, 33, 37, 40, 44, 49, 52, 55, 59, 63, 66, 70, 74, 77, 79, 83, 85, 90, 93, 95, 97, 98, 99, 60, 68, 82] }

export function getDomainReputationEngines(id) {
  const { total, failed } = getDomainReputation(id)
  const failedIdx = PASSED_AT[id]
    ? new Set(Array.from({ length: total }, (_, i) => i).filter((i) => !PASSED_AT[id].includes(i)))
    : new Set((FAILED_AT[id] ?? []).slice(0, failed))
  return REPUTATION_ENGINES.slice(0, total).map((name, i) => {
    const isFailed = failedIdx.has(i)
    return {
      id: `eng-${i + 1}`,
      name,
      status: isFailed ? 'Failed' : 'Passed',
      description: ENGINE_DESCRIPTIONS[name] ?? `${name} maintains a reputation database of domains linked to malicious or unwanted activity.`,
      solution: `Scan the domain for malware or phishing content, remove any threats, update all outdated software, and secure the site. Once clean, contact ${isFailed ? 'the engine maintainer' : (ENGINE_CONTACT[name] ?? name)} with details of the remediation to request delisting.`,
    }
  })
}

const RELATED_PREFIXES = [
  ['www', 'api', 'mail'], [], ['www'], ['vpn', 'dev'], [],
  ['www', 'cdn'], ['staging'], [], ['www', 'portal', 'blog', 'shop'], ['app'],
]

export function getDomainEndpoints() {
  const subs = [
    'api.protergo.id', 'app.protergo.id', 'mail.protergo.id', 'vpn.protergo.id', 'cdn.protergo.id',
    'portal.protergo.id', 'dev.protergo.id', 'staging.protergo.id', 'blog.protergo.id', 'shop.protergo.id',
  ]
  // Dummy host IPs behind each discovered subdomain (Domain Reputation view).
  const ips = [
    '10.10.10.59', '10.10.10.12', '10.10.10.34', '10.10.10.73', '10.10.10.88',
    '10.10.10.101', '10.10.10.126', '10.10.10.148', '10.10.10.175', '10.10.10.203',
  ]
  return structuredClone(subs.map((endpoint, i) => ({
    id: `ep-${i + 1}`,
    endpoint,
    ip: ips[i],
    // Extra subdomain prefixes this endpoint also serves (dummy) — the target
    // domain itself is always the first related domain.
    relatedPrefixes: RELATED_PREFIXES[i],
    owner: ENDPOINT_OWNERS[i],
    ...(() => { const { severityCounts, total } = endpointSeverity(i); return { severityCounts, totalSeverity: total } })(),
    tags: [],
    // 10.10.10.12's endpoint scan failed (dummy).
    status: ips[i] === '10.10.10.12' ? 'Failed' : 'Completed',
  })))
}

// Findings for an IP Single endpoint detail view.
const DOMAIN_VULNS = [
  { name: 'NVT: Die-Hellman Ephemeral Key Exchange DoS Vulnerability (SSL/TLS, D(HE)ater)', port: 1000, protocol: 'TCP', service: 'HTTPS', severity: 'high' },
  { name: 'Google API keys should not be disclosed', port: 8080, protocol: 'TCP', service: 'HTTPS', severity: 'high' },
  { name: 'Microsoft Azure Service Fabric Security Misconfiguration', port: 2500, protocol: 'TCP', service: 'HTTPS', severity: 'high' },
  { name: 'Cross-Site Scripting (XSS) Vulnerabilities in Web Applications', port: 6000, protocol: 'TCP', service: 'HTTPS', severity: 'medium' },
  { name: 'Insecure Direct Object References (IDOR) in REST APIs', port: 4500, protocol: 'TCP', service: 'HTTPS', severity: 'medium' },
  { name: 'Hardcoded Credentials in Source Code', port: 3200, protocol: 'TCP', service: 'HTTPS', severity: 'medium' },
  { name: 'Improper Input Validation in Mobile Applications', port: 7500, protocol: 'UDP', service: 'HTTPS', severity: 'low' },
  { name: 'Server-Side Request Forgery (SSRF) Attacks', port: 9100, protocol: 'UDP', service: 'HTTPS', severity: 'low' },
  { name: 'Insufficient Logging and Monitoring Practices', port: 3700, protocol: 'UDP', service: 'HTTPS', severity: 'info' },
  { name: 'Use of Deprecated Cryptographic Algorithms in Applications', port: 5400, protocol: 'UDP', service: 'HTTPS', severity: 'info' },
]

const DOMAIN_MODIFIERS = [
  ['ricolimruijie', 'ricolimruijie@protergo.id'],
  ['alexclaire', 'alex@protergo.id'],
  ['Finished scan by system', ''],
  ['sitirosiyati', 'sitirosiyati@protergo.id'],
  ['budiarto', 'budiarto@protergo.id'],
  ['budiarto', 'budiarto@protergo.id'],
  ['budiarto', 'budiarto@protergo.id'],
  ['budiarto', 'budiarto@protergo.id'],
  ['budiarto', 'budiarto@protergo.id'],
  ['budiarto', 'budiarto@protergo.id'],
]

// Greenbone-style solution types, one per finding (same set as network).
const DOMAIN_SOLUTION_TYPES = [
  'Mitigation', 'Vendor Fix', 'Mitigation', 'Workaround', 'Mitigation',
  'Vendor Fix', 'Workaround', 'Mitigation', 'None Available', 'Mitigation',
]

export function getDomainVulns() {
  return structuredClone(DOMAIN_VULNS.map((v, i) => ({
    id: `nv-${i + 1}`,
    ...v,
    component: `${v.protocol.toLowerCase()} port ${v.port}`,
    line: v.port,
    lastModified: 'Mon, 10 Feb 2025',
    modifiedBy: DOMAIN_MODIFIERS[i][0],
    modifiedEmail: DOMAIN_MODIFIERS[i][1],
    validation: 'Unresolved',
    cycle: 'Active',
    codeLine: v.port,
    solutionType: DOMAIN_SOLUTION_TYPES[i % DOMAIN_SOLUTION_TYPES.length],
    ...DOMAIN_VULN_DETAILS[i],
  })))
}

// Deep-dive content for VulnerabilityDetailModal, aligned to each finding.
const DOMAIN_VULN_DETAILS = [
  {
    cwe: 'CWE-400: Uncontrolled Resource Consumption',
    cves: ['CVE-2002-20001', 'CVE-2002-20002', 'CVE-2002-20003'],
    findingType: 'Vulnerability', cvss: { score: 7.5, rating: 'High' },
    likelihood: 'high', impact: 'high', confidence: 'high',
    summary: 'The scanned host negotiates ephemeral Diffie-Hellman key exchange without bounding parameter size, exposing connecting clients to CPU-exhaustion denial of service.',
    extractedResult: 'Handshake probe against TCP port 1000 confirmed DHE groups above 8192 bits are accepted.',
    impactText: 'Attackers can force repeated expensive key exchanges and degrade availability of services behind this endpoint.',
    mitigationText: 'Disable classic DHE suites, prefer ECDHE, and enforce RFC 7919 named groups on the host.',
    insightText: 'Network-exposed TLS stacks with legacy defaults are the most common source of this recurring finding.',
    codeSnippet: '# tcp port 1000 — handshake\nServerKeyExchange: DHE, 8192-bit modulus (uncapped)',
    references: [{ label: 'CVE-2002-20001', url: 'https://nvd.nist.gov/vuln/detail/CVE-2002-20001' }],
  },
  {
    cwe: 'CWE-798: Use of Hard-coded Credentials',
    cves: [],
    findingType: 'Vulnerability', cvss: { score: 9.1, rating: 'Critical' },
    likelihood: 'high', impact: 'high', confidence: 'high',
    summary: 'A Google API key was observed in traffic to this endpoint, suggesting a hard-coded secret in the client calling it.',
    extractedResult: 'Response inspection on TCP port 8080 matched an AIza-prefixed key pattern in a JavaScript bundle served by the host.',
    impactText: 'The exposed key can be abused for billed API consumption under the project quota.',
    mitigationText: 'Revoke the key, move secrets server-side, and restrict replacements by referrer and IP.',
    insightText: 'Keys leaked through front-end bundles are harvested automatically within hours of exposure.',
    codeSnippet: '// tcp port 8080 — served bundle\nconst KEY = "AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBc";',
    references: [{ label: 'CWE-798', url: 'https://cwe.mitre.org/data/definitions/798.html' }],
  },
  {
    cwe: 'CWE-327: Use of a Broken or Risky Cryptographic Primitive',
    cves: ['CVE-2023-29360', 'CVE-2023-29361', 'CVE-2023-29362'],
    findingType: 'Misconfiguration', cvss: { score: 7.5, rating: 'High' },
    likelihood: 'high', impact: 'high', confidence: 'high',
    summary: 'The host negotiates HMAC-SHA1 integrity, which no longer meets the bar for session protection.',
    extractedResult: 'Algorithm negotiation on TCP port 2500 lists hmac-sha1 among accepted MACs.',
    impactText: 'Weakened integrity coverage risks session forgery and fails baseline compliance checks.',
    mitigationText: 'Restrict MACs to SHA-2 family options and re-scan to confirm.',
    insightText: 'SHA-1 remnants persist wherever configs are cloned from legacy golden images.',
    codeSnippet: '# tcp port 2500 — negotiation\nMACs: hmac-sha1,hmac-sha2-256  # <- drop hmac-sha1',
    references: [{ label: 'CWE-327', url: 'https://cwe.mitre.org/data/definitions/327.html' }],
  },
  {
    cwe: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor',
    cves: ['CVE-2018-15473', 'CVE-2018-15474', 'CVE-2018-15475'],
    findingType: 'Technology Detection', cvss: { score: 5.3, rating: 'Medium' },
    likelihood: 'high', impact: 'low', confidence: 'high',
    summary: 'The OpenSSH banner on this host discloses the exact build, aiding targeted exploit selection.',
    extractedResult: 'Banner grab on TCP port 22 returned the full SSH-2.0 version string.',
    impactText: 'Version disclosure accelerates automated exploit matching against the host.',
    mitigationText: 'Suppress the version comment and keep the daemon on a fixed patch cadence.',
    insightText: 'Banner findings almost always travel with patch-hygiene issues on the same host.',
    codeSnippet: '# tcp port 22 — banner\nSSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5',
    references: [{ label: 'CVE-2018-15473', url: 'https://nvd.nist.gov/vuln/detail/CVE-2018-15473' }],
  },
  {
    cwe: 'CWE-16: Configuration',
    cves: [],
    findingType: 'Misconfiguration', cvss: null,
    likelihood: 'low', impact: 'low', confidence: 'medium',
    summary: 'No CAA record constrains certificate issuance for the zone served by this endpoint.',
    extractedResult: 'DNS query against the endpoint zone returned no CAA record set.',
    impactText: 'Any public CA could issue certificates for the domain, enabling phishing or interception.',
    mitigationText: 'Publish a restrictive CAA record naming only the CAs in use.',
    insightText: 'One DNS line with outsized effect, yet widely missing outside regulated industries.',
    codeSnippet: '; zone — missing\n@  IN  CAA  0 issue "letsencrypt.org"',
    references: [{ label: 'RFC 8659 — CAA', url: 'https://datatracker.ietf.org/doc/html/rfc8659' }],
  },
  {
    cwe: 'CWE-200: Exposure of Sensitive Information to an Unauthorized Actor',
    cves: [],
    findingType: 'Technology Detection', cvss: null,
    likelihood: 'medium', impact: 'low', confidence: 'high',
    summary: 'Handshake logging on this host confirms the SSH build to anyone able to trigger a connection.',
    extractedResult: 'Log review shows version-string probes against TCP port 5400 answered in full.',
    impactText: 'Confirmed builds feed targeted exploit selection and shorten attacker dwell time.',
    mitigationText: 'Suppress version output and alert on enumeration patterns in the SIEM.',
    insightText: 'Enumeration findings cluster — patch hygiene usually needs attention on the same host.',
    codeSnippet: '# tcp port 5400 — log\nsshd: SSH-2.0-OpenSSH_8.2 advertised to 203.0.113.7',
    references: [{ label: 'CWE-200', url: 'https://cwe.mitre.org/data/definitions/200.html' }],
  },
  {
    cwe: 'CWE-20: Improper Input Validation',
    cves: [],
    findingType: 'Vulnerability', cvss: { score: 3.7, rating: 'Low' },
    likelihood: 'medium', impact: 'low', confidence: 'medium',
    summary: 'An input handler reachable through this endpoint does not validate mobile client payloads before processing.',
    extractedResult: 'Fuzzing UDP port 7500 with malformed payloads produced unhandled exceptions in the responder.',
    impactText: 'Malformed input can crash the service process or trigger undefined behavior on the host.',
    mitigationText: 'Validate and bound all fields server-side and add regression tests with malformed inputs.',
    insightText: 'UDP services are frequently under-tested relative to their TCP counterparts.',
    codeSnippet: '# udp port 7500 — handler\npayload = recv(1024)  # <- no length/type check',
    references: [{ label: 'CWE-20', url: 'https://cwe.mitre.org/data/definitions/20.html' }],
  },
  {
    cwe: 'CWE-918: Server-Side Request Forgery (SSRF)',
    cves: [],
    findingType: 'Vulnerability', cvss: { score: 6.5, rating: 'Medium' },
    likelihood: 'medium', impact: 'high', confidence: 'medium',
    summary: 'A request handler on this host fetches attacker-influenced URLs without allow-listing, enabling server-side forgery.',
    extractedResult: 'Probe against UDP port 9100 showed the service resolving and connecting to an internal metadata address.',
    impactText: 'SSRF can expose cloud metadata credentials and pivot into the internal network.',
    mitigationText: 'Enforce an egress allow-list and block link-local/metadata ranges at the resolver.',
    insightText: 'SSRF on non-HTTP services is easy to miss because scanners focus on web parameters.',
    codeSnippet: '# udp port 9100 — fetch\nfetch(user_supplied_url)  # <- no allow-list',
    references: [{ label: 'CWE-918', url: 'https://cwe.mitre.org/data/definitions/918.html' }],
  },
  {
    cwe: 'CWE-778: Insufficient Logging',
    cves: [],
    findingType: 'Informational', cvss: null,
    likelihood: 'low', impact: 'low', confidence: 'medium',
    summary: 'Security-relevant events on this host are not logged at a level that supports incident review.',
    extractedResult: 'Audit of UDP port 3700 traffic showed authentication failures producing no log entries.',
    impactText: 'Blind spots delay detection and complicate post-incident forensics.',
    mitigationText: 'Enable auth and error logging with centralized shipping and retention policy.',
    insightText: 'Logging gaps are informational alone but amplify every other finding on the host.',
    codeSnippet: '# udp port 3700 — config\nLogLevel QUIET  # <- raise to INFO',
    references: [{ label: 'CWE-778', url: 'https://cwe.mitre.org/data/definitions/778.html' }],
  },
  {
    cwe: 'CWE-327: Use of a Broken or Risky Cryptographic Primitive',
    cves: [],
    findingType: 'Vulnerability', cvss: { score: 5.9, rating: 'Medium' },
    likelihood: 'medium', impact: 'medium', confidence: 'high',
    summary: 'A deprecated cryptographic routine is still offered by the service on this host.',
    extractedResult: 'Capability probe on UDP port 5400 confirmed legacy cipher advertisement.',
    impactText: 'Deprecated primitives weaken confidentiality guarantees for sessions with the host.',
    mitigationText: 'Disable the legacy routine and verify clients negotiate modern equivalents.',
    insightText: 'Deprecations linger wherever compatibility matrices are never revisited.',
    codeSnippet: '# udp port 5400 — capabilities\nciphers: 3des-cbc, aes128-ctr  # <- remove 3des',
    references: [{ label: 'CWE-327', url: 'https://cwe.mitre.org/data/definitions/327.html' }],
  },
]
