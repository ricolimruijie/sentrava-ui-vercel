import { emptyData } from '@/utils/dataMode'
// Source Code Assessment seed data — shared by SourceCodeView (list) and
// SourceCodeDetailView (timeline + findings). Factories return deep copies
// because both views mutate rows locally (status changes, deletes, tags).

const REPOS = [
  { id: 1, lastScanned: '14 July 2026', repo: 'protergo-cyber-security', branch: 'main', gitProvider: 'GitHub', visibility: 'Public', owner: 'Protergo Cyber Security HQ', linesOfCode: 1987, tags: [], status: 'Scanning', scanType: 'manual_scan' },
  { id: 2, lastScanned: '16 July 2026', repo: 'tcg-royal', branch: 'main', gitProvider: 'GitHub', visibility: 'Public', owner: 'Protergo Cyber Security HQ', linesOfCode: 4213, tags: [], status: 'Completed', scanType: 'scheduled_scan' },
  { id: 3, lastScanned: '12 July 2026', repo: 'aoc-glasshour', branch: 'main', gitProvider: 'GitHub', visibility: 'Public', owner: 'Protergo Cyber Security HQ', linesOfCode: 2765, tags: [], status: 'Scanning', scanType: 'continuous_scan', recurrence: 'weekly' },
]

export function getSourceCodeRepos() {
  if (emptyData.value) return []
  return structuredClone(REPOS)
}

// Scan timeline entries, newest first. tcg-royal (id 2) is a freshly
// scheduled repo — its first scan is running and the rest are still queued,
// with no completed history yet.
export function getSourceCodeScans(repoId) {
  if (repoId === 2) {
    return [
      // tcg-royal scans on a daily schedule — each Waiting entry is the next
      // upcoming run, not a blank/unknown date.
      { id: 't1', date: '9 Feb 2025 8:30 AM', status: 'Failed', duration: '2m 03s' },
      { id: 't2', date: '10 Feb 2025 8:30 AM', status: 'Completed', duration: '4m 15s' },
      { id: 't3', date: '11 Feb 2025 8:30 AM', status: 'Scanning', duration: null },
      { id: 't4', date: '12 Feb 2025 8:30 AM', status: 'Waiting', duration: null },
      { id: 't5', date: '13 Feb 2025 8:30 AM', status: 'Waiting', duration: null },
      { id: 't6', date: '14 Feb 2025 8:30 AM', status: 'Waiting', duration: null },
      { id: 't7', date: '15 Feb 2025 8:30 AM', status: 'Waiting', duration: null },
      { id: 't8', date: '16 Feb 2025 8:30 AM', status: 'Waiting', duration: null },
    ]
  }
  if (repoId === 3) {
    // aoc-glasshour — scan running today, next run scheduled next week
    const fmt = (d) => d.toLocaleString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
    })
    return [
      { id: 'a3', date: fmt(new Date(Date.now() - 7 * 24 * 3600 * 1000)), status: 'Completed', duration: '4m 52s' },
      { id: 'a1', date: fmt(new Date()), status: 'Scanning', duration: null },
      { id: 'a2', date: fmt(new Date(Date.now() + 7 * 24 * 3600 * 1000)), status: 'Waiting', duration: null },
    ]
  }
  return [
    { id: 's1', date: '9 Feb 2025 8:30 AM', status: 'Scanning', duration: null },
    { id: 's2', date: '8 Feb 2025 8:30 AM', status: 'Completed', duration: '5m 10s' },
    { id: 's3', date: '7 Feb 2025 2:15 PM', status: 'Failed', duration: '2m 03s' },
    { id: 's4', date: '6 Feb 2025 8:30 AM', status: 'Completed', duration: '4m 05s' },
    { id: 's5', date: '5 Feb 2025 11:45 AM', status: 'Completed', duration: '6m 02s' },
    { id: 's6', date: '4 Feb 2025 8:30 AM', status: 'Completed', duration: '1m 44s' },
    { id: 's7', date: '3 Feb 2025 4:00 PM', status: 'Completed', duration: '3m 59s' },
    { id: 's8', date: '2 Feb 2025 8:30 AM', status: 'Completed', duration: '5m 24s' },
  ]
}

// Findings for the selected scan — severity is lowercase to match
// VulnerabilityDetailModal's severityMeta.
const BASE_VULNS = [
  { id: 'v1', name: 'NVT: Die-Hellman Ephemeral Key Exchange DoS Vulnerability (CVE-2002-20001)', component: 'unitest/scan/mobsf/ios.json', line: 109, severity: 'high', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'ricolimruijie', modifiedEmail: 'ricolimruijie@protergo.id', cycle: 'Active', validation: 'Unresolved' },
  { id: 'v2', name: 'Google API keys should not be disclosed', component: 'app/deploy/linux/appimage/config.yaml', line: 203, severity: 'high', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'alexclaire', modifiedEmail: 'alex@protergo.id', cycle: 'Active', validation: 'Unresolved' },
  { id: 'v3', name: 'Microsoft Azure Service Fabric Security Misconfiguration', component: 'services/monitoring/logs/2025/fabric.xml', line: 317, severity: 'high', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'Finished scan by system', modifiedEmail: '', cycle: 'Active', validation: 'Unresolved' },
  { id: 'v4', name: 'Cross-Site Scripting (XSS) Vulnerabilities in Web Applications', component: 'database/backup/mysql/2025/dump.sql', line: 425, severity: 'medium', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'sitirosiyati', modifiedEmail: 'sitirosiyati@protergo.id', cycle: 'Active', validation: 'Unresolved' },
  { id: 'v5', name: 'Insecure Direct Object References (IDOR) in REST APIs', component: 'assets/images/icons/icon-router.ts', line: 512, severity: 'medium', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'budiarto', modifiedEmail: 'budiarto@protergo.id', cycle: 'Active', validation: 'Unresolved' },
  { id: 'v6', name: 'Hardcoded Credentials in Source Code', component: 'scripts/automation/deploy-prod.sh', line: 678, severity: 'medium', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'budiarto', modifiedEmail: 'budiarto@protergo.id', cycle: 'Active', validation: 'Unresolved' },
  { id: 'v7', name: 'Improper Input Validation in Mobile Applications', component: 'config/settings/app-config.json', line: 734, severity: 'low', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'budiarto', modifiedEmail: 'budiarto@protergo.id', cycle: 'Active', validation: 'Unresolved' },
  { id: 'v8', name: 'Server-Side Request Forgery (SSRF) Attacks', component: 'tests/unit/test_authentication.py', line: 812, severity: 'low', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'budiarto', modifiedEmail: 'budiarto@protergo.id', cycle: 'Active', validation: 'Unresolved' },
  { id: 'v9', name: 'Insufficient Logging and Monitoring Practices', component: 'documentation/user-manual/logging.md', line: 926, severity: 'info', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'budiarto', modifiedEmail: 'budiarto@protergo.id', cycle: 'Active', validation: 'Unresolved' },
  { id: 'v10', name: 'Use of Deprecated Cryptographic Algorithms in Applications', component: 'resources/fonts/Roboto-Regular.ttf', line: 1054, severity: 'info', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'budiarto', modifiedEmail: 'budiarto@protergo.id', cycle: 'Active', validation: 'Unresolved' },
  { id: 'v11', name: 'Missing Security Headers in HTTP Responses', component: 'config/nginx/security-headers.conf', line: 88, severity: 'medium', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'sitirosiyati', modifiedEmail: 'sitirosiyati@protergo.id', cycle: 'Active', validation: 'Unresolved' },
  { id: 'v12', name: 'Verbose Error Messages Exposing Stack Traces', component: 'app/middleware/error-handler.ts', line: 142, severity: 'low', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'alexclaire', modifiedEmail: 'alex@protergo.id', cycle: 'Active', validation: 'Unresolved' },
  { id: 'v13', name: 'Weak Password Policy Enforcement', component: 'services/auth/password-policy.js', line: 67, severity: 'high', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'budiarto', modifiedEmail: 'budiarto@protergo.id', cycle: 'Active', validation: 'Unresolved' },
  { id: 'v14', name: 'Unvalidated Redirects and Forwards', component: 'app/controllers/redirect-controller.py', line: 231, severity: 'medium', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'ricolimruijie', modifiedEmail: 'ricolimruijie@protergo.id', cycle: 'Active', validation: 'Unresolved' },
  { id: 'v15', name: 'Exposed Debug Endpoints in Production', component: 'routes/debug/admin-panel.go', line: 45, severity: 'critical', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'sitirosiyati', modifiedEmail: 'sitirosiyati@protergo.id', cycle: 'Active', validation: 'Unresolved' },
  { id: 'v16', name: 'Outdated Third-Party Dependency With Known CVE', component: 'package-lock.json', line: 1204, severity: 'medium', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'Finished scan by system', modifiedEmail: '', cycle: 'Active', validation: 'Unresolved' },
  { id: 'v17', name: 'Missing Rate Limiting on Authentication API', component: 'api/v1/auth/login-rate-limit.yaml', line: 33, severity: 'low', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'alexclaire', modifiedEmail: 'alex@protergo.id', cycle: 'Active', validation: 'Unresolved' },
  { id: 'v18', name: 'Sensitive Data in Log Files', component: 'services/monitoring/log-sanitizer.xml', line: 519, severity: 'info', lastModified: 'Mon, 10 Feb 2025', modifiedBy: 'budiarto', modifiedEmail: 'budiarto@protergo.id', cycle: 'Active', validation: 'Unresolved' },
]

// Deep-dive content for VulnerabilityDetailModal, keyed by the same id as
// BASE_VULNS above — kept separate so the table-row fields above stay easy
// to scan. Every finding gets its own CWE/OWASP mapping, snippet, and write-up
// instead of the modal falling back to blank fields or a generic placeholder.
const VULN_DETAILS = {
  v1: {
    cves: ['CVE-2002-20001', 'CVE-2002-20002', 'CVE-2002-20003', 'CVE-2002-20004', 'CVE-2002-20005', 'CVE-2002-20006', 'CVE-2002-20007', 'CVE-2002-20008', 'CVE-2002-20009', 'CVE-2002-20010', 'CVE-2002-20011', 'CVE-2002-20012', 'CVE-2002-20013', 'CVE-2002-20014', 'CVE-2002-20015', 'CVE-2002-20016', 'CVE-2002-20017', 'CVE-2002-20018', 'CVE-2002-20019', 'CVE-2002-20020'],
    findingType: 'Vulnerability',
    cvss: { score: 9, rating: 'High' },
    cwe: 'CWE-400: Uncontrolled Resource Consumption',
    owasp: 'A05:2021 - Security Misconfiguration',
    likelihood: 'high', impact: 'high', confidence: 'high',
    summary: 'The TLS handshake accepts arbitrarily large Diffie-Hellman ephemeral (DHE) parameters from the server, allowing a malicious or compromised peer to force the client into expensive modular exponentiation and exhaust CPU resources.',
    extractedResult: 'Nuclei DHE-DoS template flagged the TLS endpoint at unitest/scan/mobsf/ios.json:109 for accepting DHE key sizes above 8192 bits without a client-side cap.',
    impactText: 'A remote attacker controlling the TLS server can repeatedly trigger oversized key exchanges, driving CPU usage to 100% on affected clients and causing denial of service for legitimate app users.',
    mitigationText: 'Cap the accepted DHE modulus size (e.g. reject parameters over 2048 bits), prefer ECDHE cipher suites, and upgrade the TLS library to a version that enforces RFC 7919 named groups.',
    insightText: 'This is a long-standing class of issue (CVE-2002-20001) that resurfaces whenever a TLS stack negotiates classic DHE without bounding parameter size — mobile HTTP clients are frequently affected because they reuse older OpenSSL builds.',
    codeSnippet: '// unitest/scan/mobsf/ios.json:109\n"tls": {\n  "keyExchange": "DHE",\n  "minDheBits": 1024,\n  "maxDheBits": null   // <- unbounded, allows CVE-2002-20001\n}',
    references: [
      { label: 'CVE-2002-20001', url: 'https://nvd.nist.gov/vuln/detail/CVE-2002-20001' },
      { label: 'RFC 7919 — Negotiated FFDHE Groups', url: 'https://datatracker.ietf.org/doc/html/rfc7919' },
    ],
  },
  v2: {
    cves: [],
    findingType: 'Vulnerability',
    cvss: { score: 7.5, rating: 'High' },
    cwe: 'CWE-798: Use of Hard-coded Credentials',
    owasp: 'A02:2021 - Cryptographic Failures',
    likelihood: 'high', impact: 'high', confidence: 'high',
    summary: 'A Google API key is committed in plaintext inside the AppImage deployment config, making it retrievable by anyone with read access to the repository or the built artifact.',
    extractedResult: 'Secret scanner matched pattern AIza[0-9A-Za-z-_]{35} at app/deploy/linux/appimage/config.yaml:203.',
    impactText: 'An attacker who extracts the key can call billed Google APIs on the project\'s quota, access any API the key is scoped to, and potentially pivot to other Google Cloud resources.',
    mitigationText: 'Revoke the exposed key immediately, move it to a secrets manager or environment variable injected at build time, and restrict the replacement key by API and HTTP referrer/IP.',
    insightText: 'Config files bundled into build artifacts are often overlooked by .gitignore rules, so secrets meant only for CI can end up shipped to end users.',
    codeSnippet: '# app/deploy/linux/appimage/config.yaml:203\ngoogle:\n  maps_api_key: "AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBc"  # hard-coded',
    references: [
      { label: 'Google — API key best practices', url: 'https://support.google.com/googleapi/answer/6310037' },
      { label: 'CWE-798', url: 'https://cwe.mitre.org/data/definitions/798.html' },
    ],
  },
  v3: {
    cves: ['CVE-2023-29360', 'CVE-2023-29361', 'CVE-2023-29362'],
    findingType: 'Misconfiguration',
    cvss: { score: 7.5, rating: 'High' },
    cwe: 'CWE-16: Configuration',
    owasp: 'A05:2021 - Security Misconfiguration',
    likelihood: 'high', impact: 'high', confidence: 'high',
    summary: 'The Service Fabric cluster manifest disables client certificate authentication on the management endpoint, leaving cluster administration reachable over an unauthenticated channel.',
    extractedResult: 'Cluster manifest at services/monitoring/logs/2025/fabric.xml:317 sets ClusterProtectionLevel to "None" for the management endpoint.',
    impactText: 'Anyone on the network path to the management port can deploy or remove services, read cluster secrets, and disrupt production workloads without authenticating.',
    mitigationText: 'Set ClusterProtectionLevel to "EncryptAndSign", require client certificates for the management endpoint, and restrict the port with network security group rules.',
    insightText: 'Service Fabric ships with permissive defaults during initial cluster bring-up; teams frequently forget to harden the manifest before promoting the cluster to production.',
    codeSnippet: '<!-- services/monitoring/logs/2025/fabric.xml:317 -->\n<Security>\n  <ClusterProtectionLevel>None</ClusterProtectionLevel>\n</Security>',
    references: [
      { label: 'Azure Service Fabric security best practices', url: 'https://learn.microsoft.com/azure/service-fabric/service-fabric-best-practices-security' },
    ],
  },
  v4: {
    cves: ['CVE-2024-31409', 'CVE-2024-31410', 'CVE-2024-31411'],
    findingType: 'Vulnerability',
    cvss: { score: 6.1, rating: 'Medium' },
    cwe: 'CWE-79: Improper Neutralization of Input During Web Page Generation',
    owasp: 'A03:2021 - Injection',
    likelihood: 'medium', impact: 'medium', confidence: 'medium',
    summary: 'A backup restoration script writes raw customer-supplied fields from the MySQL dump directly into an HTML report without encoding, allowing stored XSS when the report is later viewed in a browser.',
    extractedResult: 'Static analysis flagged an unescaped template interpolation at database/backup/mysql/2025/dump.sql:425 that reaches the report renderer.',
    impactText: 'An attacker who controls a customer record can inject a script that executes in the browser of any staff member who opens the generated backup report, enabling session hijacking or further compromise.',
    mitigationText: 'HTML-encode all dynamic values before interpolation, adopt a templating engine with auto-escaping enabled by default, and add a Content-Security-Policy header to the report viewer.',
    insightText: 'Backup and reporting tooling is often exempted from the same input-sanitization review as the main application, making it a recurring source of stored XSS.',
    codeSnippet: '-- database/backup/mysql/2025/dump.sql:425\nINSERT INTO report_html VALUES (\n  CONCAT(\'<td>\', customer.notes, \'</td>\')  -- notes rendered unescaped\n);',
    references: [
      { label: 'OWASP XSS Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html' },
    ],
  },
  v5: {
    cves: ['CVE-2023-46129', 'CVE-2023-46130', 'CVE-2023-46131'],
    findingType: 'Vulnerability',
    cvss: { score: 6.5, rating: 'Medium' },
    cwe: 'CWE-639: Authorization Bypass Through User-Controlled Key',
    owasp: 'A01:2021 - Broken Access Control',
    likelihood: 'medium', impact: 'medium', confidence: 'medium',
    summary: 'The icon router accepts a raw asset ID from the client and fetches the record without verifying it belongs to the requesting tenant, allowing enumeration of other tenants\' assets.',
    extractedResult: 'Route handler at assets/images/icons/icon-router.ts:512 queries the icons table by :id with no ownership check.',
    impactText: 'A low-privilege user can increment the id parameter to view or modify icon assets belonging to other organizations, leaking tenant-specific branding and metadata.',
    mitigationText: 'Scope every lookup to the authenticated tenant (e.g. WHERE tenant_id = :current AND id = :id), or switch to non-sequential, unguessable identifiers.',
    insightText: 'IDOR on low-sensitivity resources like icons is often deprioritized, but it reliably confirms tenant boundaries are missing and is frequently chained with other findings to escalate access.',
    codeSnippet: '// assets/images/icons/icon-router.ts:512\nrouter.get(\'/icons/:id\', async (req, res) => {\n  const icon = await db.icons.findById(req.params.id) // no tenant scope\n  res.json(icon)\n})',
    references: [
      { label: 'OWASP — Broken Access Control', url: 'https://owasp.org/Top10/A01_2021-Broken_Access_Control/' },
    ],
  },
  v6: {
    cves: ['CVE-2024-28027', 'CVE-2024-28028', 'CVE-2024-28029'],
    findingType: 'Vulnerability',
    cvss: { score: 7.8, rating: 'High' },
    cwe: 'CWE-798: Use of Hard-coded Credentials',
    owasp: 'A07:2021 - Identification and Authentication Failures',
    likelihood: 'medium', impact: 'medium', confidence: 'medium',
    summary: 'The production deployment script embeds the database service account password directly in shell code instead of reading it from a secret store.',
    extractedResult: 'Secret pattern matched a plaintext password assignment at scripts/automation/deploy-prod.sh:678.',
    impactText: 'Anyone with read access to the repository or CI logs obtains a working production database credential, enabling data exfiltration or tampering.',
    mitigationText: 'Remove the credential from source control, rotate it immediately, and load it at deploy time from a secrets manager (Vault, AWS Secrets Manager, or CI masked variables).',
    insightText: 'Deployment scripts are commonly excluded from secret-scanning scope because they are treated as "internal tooling," which is exactly why they end up carrying long-lived hard-coded credentials.',
    codeSnippet: '# scripts/automation/deploy-prod.sh:678\nexport DB_PASSWORD="Pr0d-db-p@ss2024"   # hard-coded, checked into git',
    references: [
      { label: 'CWE-798', url: 'https://cwe.mitre.org/data/definitions/798.html' },
    ],
  },
  v7: {
    cves: ['CVE-2024-31334', 'CVE-2024-31335', 'CVE-2024-31336'],
    findingType: 'Vulnerability',
    cvss: { score: 3.7, rating: 'Low' },
    cwe: 'CWE-20: Improper Input Validation',
    owasp: 'A03:2021 - Injection',
    likelihood: 'low', impact: 'medium', confidence: 'low',
    summary: 'The mobile app config loader parses app-config.json feature-flag values without type or range checking before passing them to native modules.',
    extractedResult: 'config/settings/app-config.json:734 defines a numeric flag consumed by native code without bounds checking.',
    impactText: 'A malformed or attacker-tampered config (e.g. delivered via a compromised CDN) can crash the app or trigger undefined behaviour in the native layer.',
    mitigationText: 'Validate every config value against an explicit schema (type, range, allowed enum) before use, and fail closed to safe defaults when validation fails.',
    insightText: 'Remote config systems are a popular vector for supply-chain-style attacks because client apps tend to trust them implicitly once TLS is in place.',
    codeSnippet: '// config/settings/app-config.json:734\n{ "imageCacheSizeMb": -1 }  // negative value reaches native cache allocator unchecked',
    references: [
      { label: 'OWASP Mobile Top 10 — Insufficient Input Validation', url: 'https://owasp.org/www-project-mobile-top-10/' },
    ],
  },
  v8: {
    cves: ['CVE-2023-27524', 'CVE-2023-27525', 'CVE-2023-27526'],
    findingType: 'Vulnerability',
    cvss: { score: 6.5, rating: 'Medium' },
    cwe: 'CWE-918: Server-Side Request Forgery (SSRF)',
    owasp: 'A10:2021 - Server-Side Request Forgery',
    likelihood: 'low', impact: 'low', confidence: 'medium',
    summary: 'The authentication test harness fetches a user-supplied callback URL server-side to verify webhook delivery, without restricting the target to public, non-internal hosts.',
    extractedResult: 'tests/unit/test_authentication.py:812 calls requests.get(user_supplied_url) with no allow-list.',
    impactText: 'An attacker can point the callback URL at internal services (e.g. cloud metadata endpoints) to read credentials or pivot into the internal network.',
    mitigationText: 'Resolve and validate the target host against an allow-list before the request, block RFC1918/loopback/link-local ranges, and disable automatic redirect-following.',
    insightText: 'SSRF findings inside test code are easy to dismiss as "not production," but shared test utilities are frequently promoted into application code unchanged.',
    codeSnippet: '# tests/unit/test_authentication.py:812\nresponse = requests.get(callback_url)  # callback_url is attacker-controlled',
    references: [
      { label: 'OWASP SSRF Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html' },
    ],
  },
  v9: {
    cves: [],
    findingType: 'Informational',
    cvss: null,
    cwe: 'CWE-778: Insufficient Logging',
    owasp: 'A09:2021 - Security Logging and Monitoring Failures',
    likelihood: 'low', impact: 'low', confidence: 'low',
    summary: 'The logging module documentation confirms authentication failures are not recorded, so brute-force or credential-stuffing attempts leave no audit trail.',
    extractedResult: 'documentation/user-manual/logging.md:926 lists auth.failure as an event explicitly excluded from the logging pipeline.',
    impactText: 'Without failure logging, security teams cannot detect ongoing credential attacks or reconstruct the timeline of a breach after the fact.',
    mitigationText: 'Log all authentication attempts (success and failure) with actor, source IP, and timestamp, and forward them to the SIEM with alerting on abnormal failure rates.',
    insightText: 'Missing negative-path logging is one of the most common gaps found during incident response — teams log what succeeded but not what was attempted and denied.',
    codeSnippet: '<!-- documentation/user-manual/logging.md:926 -->\n| Event         | Logged |\n|---------------|--------|\n| auth.success  | Yes    |\n| auth.failure  | No     |',
    references: [
      { label: 'OWASP — Logging and Monitoring Failures', url: 'https://owasp.org/Top10/A09_2021-Security_Logging_and_Monitoring_Failures/' },
    ],
  },
  v10: {
    cves: ['CVE-2024-12984', 'CVE-2024-12985', 'CVE-2024-12986'],
    findingType: 'Vulnerability',
    cvss: { score: 5.9, rating: 'Medium' },
    cwe: 'CWE-327: Use of a Broken or Risky Cryptographic Algorithm',
    owasp: 'A02:2021 - Cryptographic Failures',
    likelihood: 'low', impact: 'low', confidence: 'low',
    summary: 'A bundled font-processing utility still links against an MD5-based checksum routine to verify font integrity before load.',
    extractedResult: 'Binary analysis of resources/fonts/Roboto-Regular.ttf:1054 traced the loader\'s integrity check to a legacy MD5 routine.',
    impactText: 'MD5 collisions allow a tampered font file to pass integrity verification, enabling delivery of a malicious asset through an otherwise-trusted update channel.',
    mitigationText: 'Replace MD5 with SHA-256 (or better, a signed manifest) for asset integrity checks, and re-sign the existing asset bundle.',
    insightText: 'Legacy checksum code is often carried forward unchanged across app generations because "it still works," even after the underlying algorithm is broken for its intended purpose.',
    codeSnippet: '// asset loader\nconst isValid = md5(fontBytes) === manifest.checksum  // MD5 is broken for integrity use',
    references: [
      { label: 'CWE-327', url: 'https://cwe.mitre.org/data/definitions/327.html' },
    ],
  },
  v11: {
    cves: [],
    findingType: 'Misconfiguration',
    cvss: { score: 5.4, rating: 'Medium' },
    cwe: 'CWE-693: Protection Mechanism Failure',
    owasp: 'A05:2021 - Security Misconfiguration',
    likelihood: 'medium', impact: 'medium', confidence: 'medium',
    summary: 'The nginx configuration serving the app does not set Content-Security-Policy, X-Frame-Options, or Strict-Transport-Security headers on any response.',
    extractedResult: 'config/nginx/security-headers.conf:88 defines only the gzip and proxy directives — no add_header security directives are present.',
    impactText: 'Without these headers the app is more exposed to clickjacking, mixed-content downgrade, and script injection attacks that the headers would otherwise mitigate.',
    mitigationText: 'Add CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, and Strict-Transport-Security headers at the reverse proxy, then verify with an HTTP header scanner.',
    insightText: 'Security headers are cheap to add and rarely regress functionality, making this one of the highest ROI fixes in the whole finding set.',
    codeSnippet: '# config/nginx/security-headers.conf:88\nserver {\n  # add_header Content-Security-Policy ...  <- missing entirely\n  gzip on;\n}',
    references: [
      { label: 'OWASP Secure Headers Project', url: 'https://owasp.org/www-project-secure-headers/' },
    ],
  },
  v12: {
    cves: ['CVE-2024-34142', 'CVE-2024-34143', 'CVE-2024-34144'],
    findingType: 'Misconfiguration',
    cvss: { score: 3.7, rating: 'Low' },
    cwe: 'CWE-209: Generation of Error Message Containing Sensitive Information',
    owasp: 'A05:2021 - Security Misconfiguration',
    likelihood: 'low', impact: 'low', confidence: 'medium',
    summary: 'The global error handler returns the raw exception stack trace and internal file paths to the client whenever an unhandled error occurs.',
    extractedResult: 'app/middleware/error-handler.ts:142 serializes err.stack directly into the JSON response body in all environments.',
    impactText: 'Attackers can use the leaked stack traces and file paths to map internal architecture, framework versions, and dependency names, accelerating targeted exploitation.',
    mitigationText: 'Return a generic error message to clients in production, log the full stack trace server-side only, and gate verbose errors behind a NODE_ENV !== "production" check.',
    insightText: 'Verbose error handlers are usually left over from local development and forgotten when the middleware is promoted to production.',
    codeSnippet: '// app/middleware/error-handler.ts:142\nres.status(500).json({ error: err.message, stack: err.stack })  // leaked in prod',
    references: [
      { label: 'CWE-209', url: 'https://cwe.mitre.org/data/definitions/209.html' },
    ],
  },
  v13: {
    cves: ['CVE-2024-22263', 'CVE-2024-22264', 'CVE-2024-22265'],
    findingType: 'Misconfiguration',
    cvss: { score: 6.5, rating: 'Medium' },
    cwe: 'CWE-521: Weak Password Requirements',
    owasp: 'A07:2021 - Identification and Authentication Failures',
    likelihood: 'high', impact: 'high', confidence: 'high',
    summary: 'The password policy module only enforces a 6-character minimum with no complexity, breach-list, or reuse checks.',
    extractedResult: 'services/auth/password-policy.js:67 defines MIN_LENGTH = 6 and no other validation rules.',
    impactText: 'Weak passwords make user accounts significantly easier to compromise through brute force or credential-stuffing attacks using leaked password lists.',
    mitigationText: 'Raise the minimum length to at least 12 characters, check new passwords against a breached-password list (e.g. HaveIBeenPwned range API), and block direct reuse of the previous 5 passwords.',
    insightText: 'Password policy is one of the cheapest authentication controls to strengthen and directly reduces the success rate of credential-stuffing campaigns.',
    codeSnippet: '// services/auth/password-policy.js:67\nconst MIN_LENGTH = 6\nfunction isValid(pw) { return pw.length >= MIN_LENGTH }  // no complexity/breach check',
    references: [
      { label: 'NIST SP 800-63B — Digital Identity Guidelines', url: 'https://pages.nist.gov/800-63-3/sp800-63b.html' },
    ],
  },
  v14: {
    cves: ['CVE-2024-22195', 'CVE-2024-22196', 'CVE-2024-22197'],
    findingType: 'Vulnerability',
    cvss: { score: 6.1, rating: 'Medium' },
    cwe: 'CWE-601: URL Redirection to Untrusted Site',
    owasp: 'A01:2021 - Broken Access Control',
    likelihood: 'medium', impact: 'medium', confidence: 'medium',
    summary: 'The redirect controller forwards users to any URL supplied in the ?next= query parameter without validating it against an allow-list.',
    extractedResult: 'app/controllers/redirect-controller.py:231 calls redirect(request.args.get("next")) directly.',
    impactText: 'Attackers can craft links that appear to originate from the trusted domain but redirect victims to a phishing site, aiding credential theft campaigns.',
    mitigationText: 'Restrict redirect targets to a fixed allow-list of internal paths, or require a signed/opaque token that maps to a known destination server-side.',
    insightText: 'Open redirects are frequently underrated because they don\'t compromise the app directly, but they are a favourite building block in phishing kits that abuse a trusted brand\'s domain.',
    codeSnippet: '# app/controllers/redirect-controller.py:231\nreturn redirect(request.args.get("next"))  # unvalidated open redirect',
    references: [
      { label: 'CWE-601', url: 'https://cwe.mitre.org/data/definitions/601.html' },
    ],
  },
  v15: {
    cves: ['CVE-2024-6387', 'CVE-2024-6388', 'CVE-2024-6389'],
    findingType: 'Misconfiguration',
    cvss: { score: 9.8, rating: 'Critical' },
    cwe: 'CWE-489: Active Debug Code',
    owasp: 'A05:2021 - Security Misconfiguration',
    likelihood: 'high', impact: 'medium', confidence: 'low',
    summary: 'A debug admin panel that dumps environment variables and internal routing tables is reachable on the production deployment without any authentication.',
    extractedResult: 'routes/debug/admin-panel.go:45 registers /debug/admin with no auth middleware and is included in the production build.',
    impactText: 'Anyone who discovers the endpoint can read environment secrets, internal service URLs, and runtime configuration, enabling full compromise of the deployment.',
    mitigationText: 'Strip debug routes from production builds via a build flag, and if a debug panel is needed, require authentication plus network-level restriction to internal IPs.',
    insightText: 'Debug endpoints left enabled in production are one of the most common causes of full-environment compromise because they were never designed with an external attacker in mind.',
    codeSnippet: '// routes/debug/admin-panel.go:45\nrouter.GET("/debug/admin", dumpEnvHandler)  // no auth, shipped to prod',
    references: [
      { label: 'CWE-489', url: 'https://cwe.mitre.org/data/definitions/489.html' },
    ],
  },
  v16: {
    cves: ['CVE-2024-21626', 'CVE-2024-21627', 'CVE-2024-21628'],
    findingType: 'Vulnerability',
    cvss: { score: 7.5, rating: 'High' },
    cwe: 'CWE-1104: Use of Unmaintained Third-Party Components',
    owasp: 'A06:2021 - Vulnerable and Outdated Components',
    likelihood: 'medium', impact: 'medium', confidence: 'medium',
    summary: 'The lockfile pins a JSON-parsing dependency at a version with a publicly disclosed prototype-pollution vulnerability.',
    extractedResult: 'package-lock.json:1204 resolves the dependency to a version two major releases behind the patched release.',
    impactText: 'The known prototype-pollution flaw can allow an attacker to alter object behaviour across the app, potentially escalating to remote code execution depending on how the polluted objects are used.',
    mitigationText: 'Bump the dependency to the patched version, add automated dependency-vulnerability scanning (e.g. npm audit / Dependabot) to CI, and re-test after the upgrade.',
    insightText: 'Lockfiles quietly drift out of date when nobody owns dependency upgrades; a single transitive package can reintroduce a CVE that was already fixed upstream.',
    codeSnippet: '// package-lock.json:1204\n"json-parse-lib": {\n  "version": "2.3.1"  // vulnerable; patched in 2.3.5+\n}',
    references: [
      { label: 'OWASP — Vulnerable and Outdated Components', url: 'https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/' },
    ],
  },
  v17: {
    cves: ['CVE-2023-49103', 'CVE-2023-49104', 'CVE-2023-49105'],
    findingType: 'Misconfiguration',
    cvss: { score: 5.3, rating: 'Medium' },
    cwe: 'CWE-307: Improper Restriction of Excessive Authentication Attempts',
    owasp: 'A07:2021 - Identification and Authentication Failures',
    likelihood: 'low', impact: 'low', confidence: 'medium',
    summary: 'The login endpoint accepts unlimited authentication attempts per IP or account, with no throttling, lockout, or CAPTCHA challenge.',
    extractedResult: 'api/v1/auth/login-rate-limit.yaml:33 defines the rate-limit rule set with the auth route explicitly excluded.',
    impactText: 'Attackers can run unthrottled brute-force or credential-stuffing attacks against user accounts with no automated defence slowing them down.',
    mitigationText: 'Apply per-IP and per-account rate limiting with exponential backoff, add a CAPTCHA after repeated failures, and alert on abnormal login-attempt volume.',
    insightText: 'Rate limiting is frequently applied to public API routes but forgotten on the authentication route itself, which is exactly the route attackers target first.',
    codeSnippet: '# api/v1/auth/login-rate-limit.yaml:33\nroutes:\n  - path: /api/v1/auth/login\n    rateLimit: none   # excluded from throttling',
    references: [
      { label: 'CWE-307', url: 'https://cwe.mitre.org/data/definitions/307.html' },
    ],
  },
  v18: {
    cves: ['CVE-2020-1938', 'CVE-2020-1939', 'CVE-2020-1940'],
    findingType: 'Informational',
    cvss: null,
    cwe: 'CWE-532: Insertion of Sensitive Information into Log File',
    owasp: 'A09:2021 - Security Logging and Monitoring Failures',
    likelihood: 'low', impact: 'low', confidence: 'low',
    summary: 'The log sanitizer\'s field allow-list omits the "authorization" and "password" fields, so full request headers and credentials are written to application logs in plaintext.',
    extractedResult: 'services/monitoring/log-sanitizer.xml:519 lists the redaction rules; authorization and password are absent from the <redact> set.',
    impactText: 'Anyone with log access (including third-party log aggregation vendors) can read live session tokens and passwords, enabling account takeover without ever touching the application.',
    mitigationText: 'Add authorization, password, and any other credential-bearing fields to the redaction allow-list, and rotate the log-analytics access keys as a precaution.',
    insightText: 'Log redaction rules are usually written once at launch and never revisited as new fields are added to requests, so sensitive fields silently start leaking.',
    codeSnippet: '<!-- services/monitoring/log-sanitizer.xml:519 -->\n<redact>\n  <field>email</field>\n  <!-- password, authorization missing -->\n</redact>',
    references: [
      { label: 'CWE-532', url: 'https://cwe.mitre.org/data/definitions/532.html' },
    ],
  },
}

export function getSourceCodeVulns() {
  if (emptyData.value) return []
  return BASE_VULNS.map((v) => ({ ...v, codeLine: v.line, ...VULN_DETAILS[v.id] }))
}
