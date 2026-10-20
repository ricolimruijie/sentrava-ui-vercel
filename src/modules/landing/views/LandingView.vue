<template>
  <div ref="root" class="page">
    <CoralBackdrop :motion="!reduced" />

    <div class="wrap">
      <!-- Sticky nav -->
      <div class="navwrap">
        <nav class="nav glass" @mousemove="glassMove">
          <a href="#top" class="brand" @click="scrollTop"><img :src="logoIcon" alt="" width="28" height="28" />SENTRAVA</a>
          <div v-if="wide" class="links">
            <span class="links-pill" :class="{ ready: pill.ready }" :style="{ width: pill.w + 'px', transform: 'translateX(' + pill.x + 'px)' }" aria-hidden="true"></span>
            <a v-for="n in navItems" :key="n.id" :ref="(el) => (linkEls[n.id] = el)" :href="'#' + n.id" :class="['link', { on: active === n.id }]" @click="scrollTo(n.id, $event)">{{ n.label }}</a>
          </div>
          <div class="row gap8">
            <RouterLink v-if="wide" to="/login" class="btn">Log in</RouterLink>
            <button v-else class="round glass-strong icon" aria-label="Menu" @click="menuOpen = !menuOpen">{{ menuOpen ? 'close' : 'menu' }}</button>
          </div>
        </nav>
        <div v-if="menuOpen && !wide" class="mobile glass-strong">
          <a v-for="n in navItems" :key="n.id" :href="'#' + n.id" @click="scrollTo(n.id, $event)">{{ n.label }}</a>
          <RouterLink to="/login">Log in</RouterLink>
        </div>
      </div>

      <!-- Hero -->
      <header id="top" class="hero">
        <div class="col gap28 hero-copy">
          <h1>Know where you are exposed. Fix what matters first.</h1>
          <p class="lead">SentraVA scans your domains, networks, web applications, and source code from one platform. Findings are ranked by severity and exported as reports your team can act on.</p>
          <div class="row gap14 wrapflex">
            <button class="btn lg" @click="openDemo">Request a demo</button>
            <button class="btn lg secondary">Download sample report</button>
          </div>
        </div>

        <div id="product" class="preview hero-card">
          <div class="preview-glow"></div>
          <div class="card">
            <div class="card-head glass-strong">
              <span>Assessment: Example Corp</span>
              <span class="mono live" :style="{ color: scan.done ? 'var(--on-glass-ok)' : 'var(--coral-600)' }">
                <i class="dot" :style="{ opacity: scan.done ? 1 : 0.5 + 0.5 * Math.abs(Math.sin(now * 3)) }"></i>{{ scan.done ? 'Complete' : 'Scanning' }}
              </span>
            </div>
            <div class="card-body col gap18">
              <div class="between wrapflex">
                <div class="col gap4">
                  <span class="small muted">Findings so far</span>
                  <span class="big">{{ scan.total }}</span>
                </div>
                <div class="row gap6 wrapflex end">
                  <span v-for="s in scan.summary" :key="s.sev" :class="['badge', s.sev]">{{ s.text }}</span>
                </div>
              </div>

              <div class="col">
                <div v-for="r in scan.rows" :key="r.name" class="scanrow">
                  <span class="ring" :style="{ background: 'conic-gradient(var(--coral-500) ' + r.deg + 'deg, rgba(16,24,32,.12) 0)' }">
                    <span class="ring-in icon" :style="{ color: r.iconColor }">{{ r.icon }}</span>
                  </span>
                  <div class="col gap7 minw0">
                    <div class="between gap10 minw0"><b>{{ r.name }}</b><span class="mono small muted ellipsis">{{ r.host }}</span></div>
                    <div class="sevbar">
                      <span v-for="k in ['critical','high','medium','low']" :key="k" :style="{ width: r.w[k] + '%', background: SEVCOLOR[k] }"></span>
                    </div>
                  </div>
                  <span class="mono small status" :style="{ color: r.statusColor }">{{ r.status }}</span>
                </div>
              </div>

              <div class="ticker">
                <div v-for="(k, i) in scan.ticker" :key="k.title + i" class="ticker-item" :style="{ opacity: k.op, transform: 'translateY(' + k.ty + 'px)' }">
                  <span :class="['badge', k.sev]">{{ k.label }}</span>
                  <div class="col gap2 minw0"><b class="ellipsis">{{ k.title }}</b><span class="mono small muted ellipsis">{{ k.where }}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Dashboard: scales in, then stays pinned while it comes alive as you scroll -->
      <section id="dashboard" class="col gap48 dash-section">
        <div class="dash-title" data-ani="slide">
          <h2>Your whole security posture, on one dashboard</h2>
          <p class="muted lead2">Every asset, scan and finding in one view, so you always know what to fix next.</p>
        </div>
        <LandingDashboard />
      </section>

      <!-- Strip: what one platform covers (loops sideways) -->
      <div class="strip" data-ani="fade" aria-label="Targets SentraVA assesses">
        <div class="strip-track">
          <template v-for="n in 2" :key="n">
            <span v-for="t in TARGETS" :key="n + t.key" class="strip-item" :aria-hidden="n === 2">
              <span class="icon">{{ t.icon }}</span>{{ t.name }}<span class="mono small faint">{{ t.tag }}</span>
            </span>
          </template>
        </div>
      </div>

      <!-- Steps -->
      <section class="col gap48">
        <h2 data-ani="slide" class="oneline">From registration to report in four steps</h2>
        <div class="grid4" data-ani="stagger">
          <div v-for="(s, i) in steps" :key="s.title" class="col gap18">
            <div class="row gap16"><span class="stepicon icon">{{ s.icon }}</span><span v-if="i < steps.length - 1" class="rule" data-rule></span></div>
            <h3>{{ s.title }}</h3>
            <p class="muted body">{{ s.body }}</p>
          </div>
        </div>
      </section>

      <!-- Targets -->
      <section id="targets" class="col gap40">
        <h2 data-ani="slide">One platform for every target</h2>
        <div class="targets" data-ani="slide">
          <div class="col gap8">
            <button v-for="(t, i) in TARGETS" :key="t.key" :class="['tab', { on: i === tsel }]" @click="pick(i)">
              <span class="tabicon icon">{{ t.icon }}</span>
              <span class="col gap2 minw0"><b>{{ t.name }}</b><span class="muted small2">{{ t.short }}</span></span>
              <span class="mono small faint">{{ t.tag }}</span>
              <span class="tabprog" :style="{ width: i === tsel && !reduced ? Math.min(100, ta / ADV * 100) + '%' : '0%' }"></span>
            </button>
          </div>
          <div class="panel">
            <div class="col gap14" :style="{ opacity: tp.op, transform: 'translateY(' + tp.ty + 'px)' }">
              <div class="between"><h3 class="h26">{{ tp.name }}</h3><span class="mono small muted">{{ tp.tag }}</span></div>
              <p class="muted body maxw520">{{ tp.desc }}</p>
            </div>
            <div class="col gap14">
              <div v-for="c in tp.checks" :key="c.text" class="row gap12" :style="{ opacity: c.op, transform: 'translateX(' + c.tx + 'px)' }">
                <span class="icon ok">check_circle</span><span>{{ c.text }}</span>
              </div>
            </div>
            <div class="example" :style="{ opacity: tp.exOp, transform: 'translateY(' + tp.exTy + 'px)' }">
              <span class="small muted">Example finding</span>
              <div class="row gap12">
                <span :class="['badge', tp.ex.sev]">{{ tp.ex.label }}</span>
                <div class="col gap2 minw0"><b>{{ tp.ex.title }}</b><span class="mono small muted">{{ tp.ex.where }}</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Reports -->
      <section id="reports" class="split">
        <div class="col gap24" data-ani="slide">
          <h2>Reports for everyone who needs to act</h2>
          <p class="muted lead2 maxw500">Every scan produces a downloadable report. Engineers get the detail to fix each issue. Leadership gets a clear picture of risk.</p>
          <div class="row"><button class="btn lg secondary">Download sample report</button></div>
        </div>
        <div class="col gap14" data-ani="stagger">
          <div v-for="a in audiences" :key="a.who" class="aud">
            <span class="audicon icon">{{ a.icon }}</span>
            <div class="col gap4"><b>{{ a.who }}</b><span class="muted body">{{ a.what }}</span></div>
          </div>
        </div>
      </section>

      <!-- Statement -->
      <section class="statement">
        <p class="statement-h" data-split>Security findings scattered across tools are hard to act on. SentraVA puts them in one place.</p>
        <p class="muted lead2 maxw640" data-ani="slide">Most teams check domains, networks, applications, and code with separate tools, then reconcile the results by hand. SentraVA runs every assessment from one platform, so there is one list of findings and one report to work from.</p>
      </section>

      <!-- Security -->
      <section id="security" class="col gap40">
        <h2 data-ani="slide">How we handle your data</h2>
        <div class="grid3 gap24" data-ani="stagger">
          <div v-for="t in trust" :key="t.title" class="trust">
            <span class="icon trusticon">{{ t.icon }}</span>
            <b class="t18">{{ t.title }}</b>
            <span class="mono faint small13">{{ t.body }}</span>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" class="col gap32 faq">
        <h2 data-ani="slide">Questions buyers ask</h2>
        <div class="col gap10" data-ani="stagger">
          <details v-for="q in faq" :key="q.q" class="qa">
            <summary><span class="grow">{{ q.q }}</span><span class="icon faint">expand_more</span></summary>
            <p class="muted body">{{ q.a }}</p>
          </details>
        </div>
      </section>

      <!-- CTA -->
      <section class="cta-wrap" data-ani="slide">
        <div class="cta glass-strong" @mousemove="glassMove">
          <h2 class="maxw560">See your first assessment in a live demo</h2>
          <div class="row gap14 wrapflex">
            <button class="btn lg" @click="openDemo">Request a demo</button>
            <button class="btn lg secondary">Download sample report</button>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer" data-ani="fade">
        <div class="col gap12">
          <span class="brand sm"><img :src="logoIcon" alt="" width="28" height="28" />SENTRAVA</span>
          <span class="muted small2 body">Centralized vulnerability assessment.</span>
        </div>
        <div v-for="col in footerCols" :key="col.title" class="col gap12 small2">
          <b class="small faint">{{ col.title }}</b>
          <a v-for="l in col.links" :key="l" href="#" class="muted" @click.prevent>{{ l }}</a>
        </div>
        <span class="small faint all">© 2026 SentraVA</span>
      </footer>
    </div>

    <!-- Demo dialog -->
    <div v-if="demoOpen" class="overlay" @click.self="demoOpen = false">
      <form class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title" @submit.prevent="sendDemo">
        <div class="between">
          <h3 id="dlg-title" class="h26">Request a demo</h3>
          <button type="button" class="round close icon" aria-label="Close" @click="demoOpen = false">close</button>
        </div>
        <template v-if="!demoSent">
          <label class="field">Full name<input required placeholder="Jane Doe" /></label>
          <label class="field">Work email<input required type="email" placeholder="jane@company.com" /></label>
          <label class="field">Company<input required placeholder="Company name" /></label>
          <div class="row gap8 end">
            <button type="button" class="btn secondary" @click="demoOpen = false">Cancel</button>
            <button type="submit" class="btn">Send request</button>
          </div>
        </template>
        <template v-else>
          <p class="muted body">Thanks. We have your request and will be in touch.</p>
          <div class="row end"><button type="button" class="btn" @click="demoOpen = false">Close</button></div>
        </template>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import CoralBackdrop from '@/components/common/CoralBackdrop.vue'
import LandingDashboard from '@/modules/landing/components/LandingDashboard.vue'
import { useEscapeToClose } from '@/composables/useEscapeToClose'
import logoIcon from '@/assets/sentrava-logo-icon.svg'

// Public home page (signed-out visitors land here). Layout and copy from
// docs/design-references/Sentrava Home v3.vue, on the same animated coral background as the
// login page. The coral background is light-only, so there is no theme toggle. The [bracketed]
// lines in the FAQ and Security sections are the reference's placeholders for copy still to write.
const liveScan = true
gsap.registerPlugin(ScrollTrigger, SplitText)
useEscapeToClose()

/* ---------- data ---------- */
const FINDINGS = {
  'Web application': [
    { sev: 'critical', label: 'Critical', title: 'SQL injection in login form', where: 'POST /api/auth' },
    { sev: 'high', label: 'High', title: 'Reflected XSS in search parameter', where: 'GET /search?q=' },
    { sev: 'medium', label: 'Medium', title: 'Missing Content-Security-Policy header', where: 'GET /' },
    { sev: 'medium', label: 'Medium', title: 'Session cookie without Secure flag', where: 'GET /login' },
    { sev: 'low', label: 'Low', title: 'Server version disclosed in response', where: 'GET /' }
  ],
  Domain: [
    { sev: 'high', label: 'High', title: 'Subdomain takeover possible', where: 'staging.example.com' },
    { sev: 'medium', label: 'Medium', title: 'TLS certificate expires in 9 days', where: 'example.com:443' },
    { sev: 'medium', label: 'Medium', title: 'DMARC record missing', where: '_dmarc.example.com' },
    { sev: 'low', label: 'Low', title: 'Zone allows outdated TLS 1.0', where: 'mail.example.com' }
  ],
  Network: [
    { sev: 'critical', label: 'Critical', title: 'Remote code execution in exposed service', where: '10.0.4.12:8080' },
    { sev: 'high', label: 'High', title: 'RDP exposed to the internet', where: '10.0.4.30:3389' },
    { sev: 'medium', label: 'Medium', title: 'Telnet service enabled', where: '10.0.4.51:23' },
    { sev: 'low', label: 'Low', title: 'ICMP timestamp response enabled', where: '10.0.4.0/24' }
  ],
  'Source code': [
    { sev: 'critical', label: 'Critical', title: 'Hard-coded database credential', where: 'config/db.js:14' },
    { sev: 'high', label: 'High', title: 'Unsanitized input passed to shell', where: 'src/jobs/export.js:88' },
    { sev: 'medium', label: 'Medium', title: 'Weak hashing algorithm (MD5)', where: 'src/auth/hash.js:7' },
    { sev: 'low', label: 'Low', title: 'Verbose error message exposes stack', where: 'src/api/errors.js:22' }
  ]
}
const TARGETS = [
  { key: 'Domain', name: 'Domains', icon: 'language', host: 'example.com', tag: 'DNS', short: 'Records, subdomains, certificates', desc: 'Assesses your domains and the records around them for exposure and misconfiguration.', checks: ['DNS record misconfiguration', 'Exposed subdomains', 'Expired or weak TLS certificates', 'Missing email security records (SPF, DMARC)'] },
  { key: 'Network', name: 'Networks', icon: 'lan', host: '10.0.4.0/24', tag: 'NET', short: 'Hosts, ports, and services', desc: 'Scans hosts and services across your network ranges to find exposed and vulnerable systems.', checks: ['Open ports and exposed services', 'Outdated software with known vulnerabilities', 'Default or weak service credentials', 'Insecure protocols in use'] },
  { key: 'Web application', name: 'Web applications', icon: 'web', host: 'app.example.com', tag: 'DAST', short: 'Running, public-facing apps', desc: 'Scans running, public-facing applications from the outside, the way an attacker would see them.', checks: ['Injection flaws such as SQL injection and XSS', 'Missing or misconfigured security headers', 'Weak session and cookie handling', 'Information disclosure'] },
  { key: 'Source code', name: 'Source code', icon: 'code', host: 'example/api-service', tag: 'SAST', short: 'Repositories and codebases', desc: 'Analyzes your codebase to catch weaknesses before they reach production.', checks: ['Hard-coded secrets and credentials', 'Unsafe handling of user input', 'Weak cryptography', 'Insecure error handling'] }
]
const navItems = [['product', 'Product'], ['targets', 'Targets'], ['reports', 'Reports'], ['security', 'Security'], ['faq', 'FAQ']].map(([id, label]) => ({ id, label }))
const steps = [
  { icon: 'app_registration', title: 'Register your assets', body: 'Register your domains, network ranges, web applications, and source code repositories in the asset inventory.' },
  { icon: 'my_location', title: 'Choose a target', body: 'Pick the registered asset you want to assess and start a scan.' },
  { icon: 'radar', title: 'Scan', body: 'SentraVA scans the target and lists every vulnerability it finds, ranked by severity.' },
  { icon: 'description', title: 'Review and report', body: 'Review results in one place and download reports to share with your team.' }
]
const audiences = [
  { icon: 'code', who: 'Engineers', what: 'Each finding with its location, severity, and the detail needed to fix it.' },
  { icon: 'monitoring', who: 'Leadership', what: 'A severity summary that shows overall risk at a glance.' },
  { icon: 'verified', who: 'Compliance', what: 'A downloadable record of what was assessed and what was found.' }
]
const trust = [
  { icon: 'lock', title: 'Encryption', body: '[Describe encryption in transit and at rest]' },
  { icon: 'public', title: 'Data residency', body: '[Describe where scan data is stored]' },
  { icon: 'admin_panel_settings', title: 'Access control', body: '[Describe roles, SSO, and audit logs]' }
]
const faq = [
  { q: 'What can SentraVA scan?', a: 'Domains, networks, web applications, and source code, from one platform.' },
  { q: 'What do I get after a scan?', a: 'A list of the vulnerabilities found, ranked by severity. You can review the results and download reports.' },
  { q: 'How is SentraVA priced?', a: '[Describe pricing model]' },
  { q: 'Is it cloud-hosted or on-premises?', a: '[Describe deployment options]' },
  { q: 'Which tools does it integrate with?', a: '[List integrations, e.g. CI/CD, issue trackers, chat]' },
  { q: 'How often can I run scans?', a: '[Describe scan scheduling and limits]' }
]
const footerCols = [
  { title: 'Product', links: ['Domain scanning', 'Network scanning', 'Web application scanning', 'Source code scanning', 'Reports'] },
  { title: 'Company', links: ['About', 'Security', 'Contact'] },
  { title: 'Legal', links: ['Privacy policy', 'Terms of service'] }
]

/* ---------- constants / helpers ---------- */
const DUR = 3.2, HOLD = 4, CYCLE = DUR * 4 + HOLD, ADV = 6
const ease = x => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3)
const SEV = [['critical', 'Critical'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']]
const SEVCOLOR = { critical: 'var(--on-glass-critical)', high: 'var(--on-glass-high)', medium: 'var(--on-glass-warn)', low: 'var(--on-glass-ok)' }

/* ---------- state ---------- */
const root = ref(null)
const w = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
const menuOpen = ref(false)
const demoOpen = ref(false)
const demoSent = ref(false)
const active = ref('product')
const now = ref(0)
const tsel = ref(0)
const tsw = ref(0)
const reduced = ref(false)
let raf = 0, t0 = 0, lenis = null, tick = null, ctx = null

const wide = computed(() => w.value >= 860)
const live = computed(() => liveScan && !reduced.value)

/* ---------- hero scan ---------- */
const scan = computed(() => {
  const t = live.value ? now.value % CYCLE : CYCLE
  const all = []
  const rows = TARGETS.map((tg, i) => {
    const list = FINDINGS[tg.key], st = i * DUR
    const found = list.filter((f, j) => t >= st + (j + 1) * DUR / (list.length + 1))
    found.forEach(f => all.push({ ...f, at: st + (list.indexOf(f) + 1) * DUR / (list.length + 1) }))
    const p = Math.max(0, Math.min(1, (t - st) / DUR))
    const count = sev => found.filter(f => f.sev === sev).length * 20
    const status = p <= 0 ? 'Queued' : p < 1 ? 'Scanning' : 'Done'
    return {
      icon: tg.icon, name: tg.key, host: tg.host, deg: Math.round(ease(p) * 360), status,
      w: { critical: count('critical'), high: count('high'), medium: count('medium'), low: count('low') },
      statusColor: status === 'Done' ? 'var(--on-glass-ok)' : status === 'Scanning' ? 'var(--coral-600)' : 'var(--on-glass-3)',
      iconColor: status === 'Scanning' ? 'var(--coral-600)' : status === 'Done' ? 'var(--on-glass-1)' : 'var(--on-glass-3)'
    }
  })
  all.sort((a, b) => a.at - b.at)
  let ticker
  if (!all.length) ticker = [{ sev: 'info', label: 'Info', title: 'Starting assessment', where: '4 targets queued', op: 1, ty: 0 }]
  else {
    const last = all[all.length - 1], prev = all[all.length - 2]
    const k = live.value ? ease((t - last.at) / 0.5) : 1
    ticker = []
    if (prev && k < 1) ticker.push({ ...prev, op: 1 - k, ty: -k * 18 })
    ticker.push({ ...last, op: k, ty: (1 - k) * 18 })
  }
  return {
    rows, ticker, total: all.length, done: t >= DUR * 4,
    summary: SEV.map(([sev, l]) => ({ sev, text: l + ' ' + all.filter(f => f.sev === sev).length }))
  }
})

/* ---------- targets panel ---------- */
const ta = computed(() => (reduced.value ? 9 : now.value - tsw.value))
const tp = computed(() => {
  const a = ta.value, tg = TARGETS[tsel.value], op = ease(a / 0.45), ex = ease((a - 0.5) / 0.45)
  return {
    name: tg.name, tag: tg.tag, desc: tg.desc, op, ty: (1 - op) * 12,
    ex: FINDINGS[tg.key][0], exOp: ex, exTy: (1 - ex) * 10,
    checks: tg.checks.map((text, i) => { const k = ease((a - 0.12 - i * 0.08) / 0.4); return { text, op: k, tx: (1 - k) * -14 } })
  }
})
const pick = i => { tsel.value = i; tsw.value = now.value }

/* ---------- nav ---------- */
// Lenis (when running) owns scrolling; otherwise fall back to the native scroll.
// While a click on a nav link is scrolling the page, that link stays active (navLock): otherwise the
// scroll listener would flip the active section on every section the page glides past, and the pill
// would jump back before sliding to the target.
let navLock = null
let navLockTimer
function unlockNav() {
  clearTimeout(navLockTimer)
  if (navLock === null) return
  navLock = null
  spy()
}
function goTo(target, lockId) {
  const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY - 100
  if (lockId) {
    navLock = lockId
    active.value = lockId
    clearTimeout(navLockTimer)
    navLockTimer = setTimeout(unlockNav, 2200) // safety net if the scroll is interrupted
  }
  if (lenis) lenis.scrollTo(top, { duration: 1.4, onComplete: unlockNav })
  else { window.scrollTo({ top, behavior: 'auto' }); unlockNav() }
}
function scrollTo(id, e) {
  if (e) e.preventDefault()
  const el = document.getElementById(id)
  if (!el) return
  menuOpen.value = false
  goTo(el, id)
}
// Glass pill behind the active nav link: it slides to the new link when the section changes.
const linkEls = {}
const pill = reactive({ x: 0, w: 0, ready: false })
function measurePill() {
  const el = linkEls[active.value]
  if (!el) return
  pill.x = el.offsetLeft
  pill.w = el.offsetWidth
  if (!pill.ready) requestAnimationFrame(() => { pill.ready = true }) // no slide on the first placement
}
watch(active, () => nextTick(measurePill))
watch(wide, (v) => { pill.ready = false; if (v) nextTick(measurePill) })

function spy() {
  if (navLock) return
  let cur = 'product'
  navItems.forEach(({ id }) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < 160) cur = id })
  if (cur !== active.value) active.value = cur
}
function glassMove(e) {
  if (reduced.value || window.matchMedia('(hover: none)').matches) return
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', e.clientX - r.left + 'px')
  e.currentTarget.style.setProperty('--my', e.clientY - r.top + 'px')
}

function scrollTop(e) {
  e.preventDefault()
  goTo(0, 'product')
}
function openDemo() {
  demoSent.value = false
  demoOpen.value = true
}
function sendDemo() {
  // No backend yet: the request is only acknowledged on screen.
  demoSent.value = true
}

/* ---------- motion ---------- */
// Same flow as orchid.security: Lenis smooth scroll driving GSAP ScrollTrigger, a staggered fade-up on
// load, slide / fade / stagger reveals as sections enter, and a scrubbed word-by-word statement.
function setupMotion() {
  lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  tick = (time) => lenis.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)

  ctx = gsap.context(() => {
    const reveal = (targets, from, to, trigger, start = 'top 90%') =>
      gsap.fromTo(targets, from, { ...to, scrollTrigger: { trigger, start, toggleActions: 'play none none none' } })

    // On load: nav drops in, then the hero copy and card rise in one after another.
    gsap.timeline({ defaults: { duration: 1, ease: 'power1.inOut' } })
      .fromTo('.navwrap', { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.8 })
      .fromTo('.hero-copy > *', { opacity: 0, y: 50 }, { opacity: 1, y: 0, stagger: 0.2 }, '<0.2')
      .fromTo('.hero-card', { opacity: 0, y: 50 }, { opacity: 1, y: 0 }, '<0.3')

    // On scroll.
    gsap.utils.toArray('[data-ani="slide"]').forEach((el) => reveal(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, el))
    gsap.utils.toArray('[data-ani="fade"]').forEach((el) => reveal(el, { opacity: 0 }, { opacity: 1, duration: 1 }, el))
    gsap.utils.toArray('[data-ani="stagger"]').forEach((box) =>
      reveal([...box.children], { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power2.out' }, box, 'top 88%'))
    gsap.utils.toArray('[data-rule]').forEach((el) =>
      reveal(el, { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 1.2, delay: 0.4, ease: 'power2.out' }, el, 'top 92%'))

    // The statement lights up word by word as it scrolls through.
    const split = SplitText.create('[data-split]', { type: 'words' })
    gsap.fromTo(split.words, { opacity: 0.25 }, {
      opacity: 1, ease: 'none', stagger: 0.1,
      scrollTrigger: { trigger: '[data-split]', start: 'top 85%', end: 'bottom 55%', scrub: true },
    })

    // Depth: the hero card drifts up slower than the page, and the coral blobs shift with scroll progress.
    gsap.to('.hero-card', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => root.value?.style.setProperty('--coral-scroll', self.progress.toFixed(4)),
    })
  }, root.value)
}

/* ---------- lifecycle ---------- */
const onResize = () => { w.value = window.innerWidth; measurePill() }
// The home page is light only (coral background, and the dashboard preview shows the app in its light theme):
// switch dark mode off while it is open and give it back when leaving.
let hadDark = false
onMounted(() => {
  hadDark = document.documentElement.classList.contains('dark')
  document.documentElement.classList.remove('dark')
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', spy, { passive: true })
  for (const ev of ['wheel', 'touchstart', 'keydown']) window.addEventListener(ev, unlockNav, { passive: true })
  nextTick(measurePill)
  document.fonts?.ready.then(measurePill) // link widths change once the web font is in
  t0 = performance.now()
  if (!reduced.value) {
    const loop = () => {
      now.value = (performance.now() - t0) / 1000
      if (now.value - tsw.value >= ADV) { tsel.value = (tsel.value + 1) % TARGETS.length; tsw.value = now.value }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    setupMotion()
  }
})
onBeforeUnmount(() => {
  if (hadDark) document.documentElement.classList.add('dark')
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', spy)
  for (const ev of ['wheel', 'touchstart', 'keydown']) window.removeEventListener(ev, unlockNav)
  clearTimeout(navLockTimer)
  cancelAnimationFrame(raf)
  ctx?.revert()
  if (tick) gsap.ticker.remove(tick)
  lenis?.destroy()
})
</script>

<style scoped lang="scss" src="./LandingView.scss"></style>
