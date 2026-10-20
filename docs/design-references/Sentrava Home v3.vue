<!-- SentraVA Home v3 — Vue 3 (Composition API, <script setup>)
     Requires the Coral/Ice token stylesheets (fonts, colors, typography, radius, spacing, glass) loaded globally,
     e.g. in main.js: import './coral-ice/styles.css'. Button/Badge/Card/Dialog/Input are re-implemented below as plain CSS. -->
<template>
  <div ref="root" class="page" :data-theme="theme">
    <div class="glow glow-coral"></div>
    <div class="glow glow-ice"></div>

    <div class="wrap">
      <!-- Sticky nav -->
      <div class="navwrap">
        <nav class="nav glass" @mousemove="glassMove">
          <a href="#top" class="brand"><img src="/logo.svg" alt="SentraVA logo" width="30" height="30" />SentraVA</a>
          <div v-if="wide" class="links">
            <a v-for="n in navItems" :key="n.id" :href="'#' + n.id" :class="['link', { on: active === n.id }]" @click="scrollTo(n.id, $event)">{{ n.label }}</a>
          </div>
          <div class="row gap8">
            <button class="round glass-strong icon" aria-label="Toggle theme" @click="theme = theme === 'dark' ? 'light' : 'dark'">{{ theme === 'dark' ? 'light_mode' : 'dark_mode' }}</button>
            <button v-if="wide" class="btn">Log in</button>
            <button v-else class="round glass-strong icon" aria-label="Menu" @click="menuOpen = !menuOpen">{{ menuOpen ? 'close' : 'menu' }}</button>
          </div>
        </nav>
        <div v-if="menuOpen && !wide" class="mobile glass-strong">
          <a v-for="n in navItems" :key="n.id" :href="'#' + n.id" @click="scrollTo(n.id, $event)">{{ n.label }}</a>
          <a href="#" @click.prevent="menuOpen = false">Log in</a>
        </div>
      </div>

      <!-- Hero -->
      <header id="top" class="hero">
        <div class="col gap28">
          <h1>Know where you are exposed. Fix what matters first.</h1>
          <p class="lead">SentraVA scans your domains, networks, web applications, and source code from one platform. Findings are ranked by severity and exported as reports your team can act on.</p>
          <div class="row gap14 wrapflex">
            <button class="btn lg" @click="demoOpen = true">Request a demo</button>
            <button class="btn lg secondary">Download sample report</button>
          </div>
        </div>

        <div id="product" class="preview">
          <div class="preview-glow"></div>
          <div class="card">
            <div class="card-head glass-strong">
              <span>Assessment: Example Corp</span>
              <span class="mono live" :style="{ color: scan.done ? 'var(--success)' : 'var(--coral-600)' }">
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
                  <span class="ring" :style="{ background: 'conic-gradient(var(--coral-500) ' + r.deg + 'deg, var(--gray-200) 0)' }">
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

              <div class="between wrapflex">
                <span class="mono small faint">Sample data</span>
                <button class="btn secondary">Download report</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Steps -->
      <section data-reveal class="col gap48">
        <h2>From target to report in three steps</h2>
        <div class="grid3">
          <div v-for="(s, i) in steps" :key="s.title" class="col gap18">
            <div class="row gap16"><span class="stepicon icon">{{ s.icon }}</span><span v-if="i < 2" class="rule"></span></div>
            <h3>{{ s.title }}</h3>
            <p class="muted body">{{ s.body }}</p>
          </div>
        </div>
      </section>

      <!-- Targets -->
      <section id="targets" data-reveal class="col gap40">
        <h2>One platform for every target</h2>
        <div class="targets">
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
      <section id="reports" data-reveal class="split">
        <div class="col gap24">
          <h2>Reports for everyone who needs to act</h2>
          <p class="muted lead2 maxw500">Every scan produces a downloadable report. Engineers get the detail to fix each issue. Leadership gets a clear picture of risk.</p>
          <div class="row"><button class="btn lg secondary">Download sample report</button></div>
        </div>
        <div class="col gap14">
          <div v-for="a in audiences" :key="a.who" class="aud">
            <span class="audicon icon">{{ a.icon }}</span>
            <div class="col gap4"><b>{{ a.who }}</b><span class="muted body">{{ a.what }}</span></div>
          </div>
        </div>
      </section>

      <!-- Statement -->
      <section data-reveal class="statement">
        <p class="statement-h">Security findings scattered across tools are hard to act on. SentraVA puts them in one place.</p>
        <p class="muted lead2 maxw640">Most teams check domains, networks, applications, and code with separate tools, then reconcile the results by hand. SentraVA runs every assessment from one platform, so there is one list of findings and one report to work from.</p>
      </section>

      <!-- Security -->
      <section id="security" data-reveal class="col gap40">
        <h2>How we handle your data</h2>
        <div class="grid3 gap24">
          <div v-for="t in trust" :key="t.title" class="trust">
            <span class="icon trusticon">{{ t.icon }}</span>
            <b class="t18">{{ t.title }}</b>
            <span class="mono faint small13">{{ t.body }}</span>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" data-reveal class="col gap32 faq">
        <h2>Questions buyers ask</h2>
        <div class="col gap10">
          <details v-for="q in faq" :key="q.q" class="qa">
            <summary><span class="grow">{{ q.q }}</span><span class="icon faint">expand_more</span></summary>
            <p class="muted body">{{ q.a }}</p>
          </details>
        </div>
      </section>

      <!-- CTA -->
      <section data-reveal class="cta-wrap">
        <div class="cta glass-strong" @mousemove="glassMove">
          <h2 class="maxw560">See your first assessment in a live demo</h2>
          <div class="row gap14 wrapflex">
            <button class="btn lg" @click="demoOpen = true">Request a demo</button>
            <button class="btn lg secondary">Download sample report</button>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="col gap12">
          <span class="brand sm"><img src="/logo.svg" alt="" width="26" height="26" />SentraVA</span>
          <span class="muted small2 body">Centralized vulnerability assessment.</span>
        </div>
        <div v-for="col in footerCols" :key="col.title" class="col gap12 small2">
          <b class="small faint">{{ col.title }}</b>
          <a v-for="l in col.links" :key="l" href="#" class="muted">{{ l }}</a>
        </div>
        <span class="small faint all">© 2026 SentraVA</span>
      </footer>
    </div>

    <!-- Demo dialog -->
    <div v-if="demoOpen" class="overlay" @click.self="demoOpen = false">
      <div class="dialog glass-strong" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        <h3 id="dlg-title" class="h26">Request a demo</h3>
        <label class="field">Full name<input placeholder="Jane Doe" /></label>
        <label class="field">Work email<input type="email" placeholder="jane@company.com" /></label>
        <label class="field">Company<input placeholder="Company name" /></label>
        <div class="row gap8 end">
          <button class="btn secondary" @click="demoOpen = false">Cancel</button>
          <button class="btn" @click="demoOpen = false">Send request</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  liveScan: { type: Boolean, default: true },
  initialTheme: { type: String, default: 'light' } // 'light' | 'dark'
})

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
  { icon: 'my_location', title: 'Choose a target', body: 'Add a domain, network range, web application, or source code repository.' },
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
const SEVCOLOR = { critical: 'var(--critical)', high: 'var(--high)', medium: 'var(--warning)', low: 'var(--success)' }

/* ---------- state ---------- */
const root = ref(null)
const theme = ref(props.initialTheme)
const w = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
const menuOpen = ref(false)
const demoOpen = ref(false)
const active = ref('product')
const now = ref(0)
const tsel = ref(0)
const tsw = ref(0)
const reduced = ref(false)
let raf = 0, t0 = 0, io = null

const wide = computed(() => w.value >= 860)
const live = computed(() => props.liveScan && !reduced.value)

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
      statusColor: status === 'Done' ? 'var(--success)' : status === 'Scanning' ? 'var(--coral-600)' : 'var(--text-3)',
      iconColor: status === 'Scanning' ? 'var(--coral-600)' : status === 'Done' ? 'var(--text-1)' : 'var(--text-3)'
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
function scrollTo(id, e) {
  if (e) e.preventDefault()
  const el = document.getElementById(id)
  if (!el) return
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: reduced.value ? 'auto' : 'smooth' })
  active.value = id
  menuOpen.value = false
  if (el.animate && !reduced.value)
    el.animate([{ transform: 'translateY(14px)', opacity: 0.6 }, { transform: 'none', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.2,.7,.2,1)', delay: 250 })
}
function spy() {
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

/* ---------- lifecycle ---------- */
const onResize = () => { w.value = window.innerWidth }
onMounted(() => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', spy, { passive: true })
  t0 = performance.now()
  if (!reduced.value) {
    const loop = () => {
      now.value = (performance.now() - t0) / 1000
      if (now.value - tsw.value >= ADV) { tsel.value = (tsel.value + 1) % TARGETS.length; tsw.value = now.value }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'none'; io.unobserve(e.target) }
      }), { threshold: 0.12 })
      root.value.querySelectorAll('[data-reveal]').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight) return
        el.style.opacity = '0'; el.style.transform = 'translateY(20px)'
        el.style.transition = 'opacity .7s ease, transform .7s ease'
        io.observe(el)
      })
    }
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', spy)
  cancelAnimationFrame(raf)
  io && io.disconnect()
})
</script>

<style>
.page{min-height:100vh;position:relative;overflow:clip;background:var(--surface-base);color:var(--text-1);font-family:"Plus Jakarta Sans",sans-serif;transition:background .3s ease,color .3s ease}
.page *{box-sizing:border-box}
.page a{color:var(--coral-700);text-decoration:none}.page a:hover{color:var(--coral-500)}
.page button{font-family:inherit;white-space:nowrap}
.page h1,.page h2,.page h3,.page p{margin:0}
.page h2{font-weight:800;font-size:clamp(32px,4vw,44px);letter-spacing:-.025em;max-width:680px}
.page h3{font-size:22px;font-weight:700}
.glow{position:absolute;width:1000px;height:1000px;pointer-events:none}
.glow-coral{top:-240px;right:-220px;background:radial-gradient(circle,var(--surface-glow-coral),transparent 65%)}
.glow-ice{top:-120px;left:-280px;background:radial-gradient(circle,var(--surface-glow-ice),transparent 65%)}
.wrap{position:relative;max-width:1200px;margin:0 auto;padding:20px 28px 0;display:flex;flex-direction:column;gap:136px}

/* utilities */
.row{display:flex;align-items:center}.col{display:flex;flex-direction:column}.between{display:flex;justify-content:space-between;align-items:flex-end;gap:16px}
.wrapflex{flex-wrap:wrap}.end{justify-content:flex-end}.grow{flex:1;min-width:0}.minw0{min-width:0}.all{grid-column:1/-1}
.gap2{gap:2px}.gap4{gap:4px}.gap6{gap:6px}.gap7{gap:7px}.gap8{gap:8px}.gap10{gap:10px}.gap12{gap:12px}.gap14{gap:14px}.gap16{gap:16px}.gap18{gap:18px}.gap24{gap:24px}.gap28{gap:28px}.gap32{gap:32px}.gap40{gap:40px}.gap48{gap:48px}
.muted{color:var(--text-2)}.faint{color:var(--text-3)}.mono{font-family:'IBM Plex Mono',monospace}
.small{font-size:12px}.small2{font-size:14px}.small13{font-size:13px}.t18{font-size:18px}.body{line-height:1.6}.lead2{font-size:18px;line-height:1.6}
.maxw500{max-width:500px}.maxw520{max-width:520px}.maxw560{max-width:560px}.maxw640{max-width:640px}
.ellipsis{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.icon{font-family:var(--font-icon)}
.glass{background:radial-gradient(260px circle at var(--mx,-999px) var(--my,-999px),var(--glass-hi),transparent 60%),var(--glass-fill);border:1px solid var(--glass-border);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);box-shadow:inset 0 1px 0 var(--glass-hi),0 10px 36px var(--glass-shadow)}
.glass-strong{background:var(--glass-fill-strong);border:1px solid var(--glass-border);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);box-shadow:inset 0 1px 0 var(--glass-hi),0 10px 36px var(--glass-shadow)}

/* buttons / badges */
.btn{height:40px;padding:0 20px;border-radius:999px;border:0;background:var(--coral-500);color:#fff;font-weight:700;font-size:15px;cursor:pointer;transition:background .2s ease}
.btn:hover{background:var(--coral-600)}.btn:active{background:var(--coral-700)}
.btn.lg{height:48px;padding:0 26px;font-size:16px}
.btn.secondary{background:var(--glass-fill-strong);color:var(--text-1);border:1px solid var(--glass-border);box-shadow:inset 0 1px 0 var(--glass-hi),0 6px 20px var(--glass-shadow)}
.btn.secondary:hover{background:var(--glass-fill)}
.round{width:40px;height:40px;border-radius:999px;color:var(--text-1);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;padding:0}
.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:16px;font-size:12px;font-weight:700;white-space:nowrap;border:1px solid currentColor;background:color-mix(in srgb,currentColor 12%,transparent)}
.badge.critical{color:var(--critical)}.badge.high{color:var(--high)}.badge.medium{color:var(--warning)}.badge.low{color:var(--success)}.badge.info{color:var(--info)}

/* nav */
.navwrap{position:sticky;top:16px;z-index:20;display:flex;flex-direction:column;gap:8px}
.nav{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:8px 8px 8px 18px;border-radius:999px}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:20px;letter-spacing:-.02em;color:var(--text-1)!important}
.brand.sm{font-size:18px}
.links{display:flex;gap:4px;font-size:15px;font-weight:600}
.link{padding:8px 14px;border-radius:999px;color:var(--text-1)!important;transition:background .3s ease,color .3s ease,box-shadow .3s ease}
.link.on{color:#fff!important;background:var(--coral-500);box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 6px 14px -6px rgba(196,20,30,.4)}
.mobile{display:flex;flex-direction:column;gap:4px;padding:12px;border-radius:16px}
.mobile a{padding:12px;color:var(--text-1);font-weight:600}

/* hero */
.hero{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr));gap:56px;align-items:center;margin-top:-40px}
.hero h1{font-weight:800;font-size:clamp(42px,6vw,76px);line-height:1.02;letter-spacing:-.035em;text-wrap:balance}
.lead{font-size:19px;line-height:1.6;max-width:540px;color:var(--text-2);text-wrap:pretty}
.preview{position:relative}
.preview-glow{position:absolute;inset:-80px;background:radial-gradient(circle at 60% 40%,var(--surface-glow-coral),transparent 60%);pointer-events:none}
.card{position:relative;border-radius:16px;overflow:hidden;box-shadow:0 16px 48px var(--glass-shadow)}
.card-head{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;font-weight:700;border-radius:16px 16px 0 0}
.card-body{padding:24px;background:var(--surface-card-body)}
.live{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:400}
.dot{width:8px;height:8px;border-radius:999px;background:currentColor}
.big{font-size:48px;font-weight:800;line-height:1;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.scanrow{display:grid;grid-template-columns:44px minmax(0,1fr) 72px;gap:14px;align-items:center;padding:12px 0;border-top:1px solid var(--gray-200)}
.ring{width:44px;height:44px;border-radius:999px;display:flex;align-items:center;justify-content:center}
.ring-in{width:36px;height:36px;border-radius:999px;background:var(--surface-card-body);display:flex;align-items:center;justify-content:center;font-size:20px;transition:color .4s ease}
.sevbar{display:flex;gap:2px;height:6px;border-radius:999px;background:var(--gray-200);overflow:hidden}
.sevbar span{transition:width .6s cubic-bezier(.2,.7,.2,1)}
.status{text-align:right;transition:color .4s ease}
.ticker{position:relative;height:68px;border-radius:16px;background:var(--surface-base);overflow:hidden}
.ticker-item{position:absolute;inset:0;display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;padding:0 16px}

/* steps / reports / security / faq */
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:32px}.grid3.gap24{gap:24px}
.stepicon{width:56px;height:56px;flex-shrink:0;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:26px;color:var(--coral-600);background:var(--glass-fill-strong);border:1px solid var(--glass-border);box-shadow:inset 0 1px 0 var(--glass-hi),0 8px 24px var(--glass-shadow)}
.rule{flex:1;height:1px;background:linear-gradient(90deg,var(--gray-300),transparent)}
.split{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:56px;align-items:center}
.aud{display:grid;grid-template-columns:48px minmax(0,1fr);gap:16px;align-items:start;padding:22px;border-radius:16px;background:var(--surface-card-body)}
.audicon{width:48px;height:48px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:22px;color:var(--ice-700);background:var(--ice-200)}
.statement{display:flex;flex-direction:column;gap:28px;padding:72px 0;border-top:1px solid var(--gray-200);border-bottom:1px solid var(--gray-200)}
.statement-h{font-weight:800;font-size:clamp(30px,4.4vw,52px);line-height:1.12;letter-spacing:-.03em;max-width:960px;text-wrap:balance}
.trust{display:flex;flex-direction:column;gap:12px;padding:28px;border-radius:16px;background:var(--surface-card-body)}
.trusticon{font-size:28px;color:var(--ice-700)}
.faq{max-width:880px}
.qa{padding:20px 24px;border-radius:16px;background:var(--surface-card-body)}
.qa summary{display:flex;justify-content:space-between;gap:16px;font-weight:700;font-size:17px;cursor:pointer;list-style:none}
.qa summary::-webkit-details-marker{display:none}
.qa p{margin-top:12px}

/* targets */
.targets{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:24px;align-items:stretch}
.tab{position:relative;overflow:hidden;display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:14px;align-items:center;text-align:left;padding:16px 18px;border-radius:16px;border:1px solid transparent;background:transparent;color:var(--text-1);cursor:pointer;white-space:normal!important;backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);transition:background .45s ease,box-shadow .45s ease,border-color .45s ease}
.tab.on{background:var(--glass-fill-strong);border-color:var(--glass-border);box-shadow:inset 0 1px 0 var(--glass-hi),0 10px 30px var(--glass-shadow)}
.tab b{font-size:17px}
.tabicon{width:48px;height:48px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:22px;background:var(--ice-200);color:var(--ice-700);transition:background .45s ease,color .45s ease}
.tab.on .tabicon{background:var(--coral-500);color:#fff}
.tabprog{position:absolute;left:0;bottom:0;height:2px;background:var(--coral-500)}
.panel{display:flex;flex-direction:column;gap:24px;padding:36px;border-radius:16px;background:var(--surface-card-body);min-height:420px}
.h26{font-size:26px!important;font-weight:800!important;letter-spacing:-.02em}
.ok{font-size:20px;color:var(--success)}
.example{margin-top:auto;display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:16px;background:var(--surface-base)}
.example .row{display:grid;grid-template-columns:auto minmax(0,1fr)}

/* cta / footer / dialog */
.cta-wrap{position:relative}
.cta{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:32px;padding:56px;border-radius:16px;background:radial-gradient(420px circle at var(--mx,-999px) var(--my,-999px),var(--glass-hi),transparent 60%),var(--glass-fill-strong);box-shadow:inset 0 1px 0 var(--glass-hi),0 16px 48px var(--glass-shadow)}
.footer{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:32px;padding:56px 0 40px;border-top:1px solid var(--gray-200)}
.overlay{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(10,20,30,.35)}
.dialog{display:flex;flex-direction:column;gap:14px;padding:28px;border-radius:16px;width:min(440px,90vw)}
.field{display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:600}
.field input{height:44px;padding:0 14px;border-radius:16px;border:1px solid var(--glass-border);background:var(--glass-fill);color:var(--text-1);font:inherit}
.field input:focus{outline:2px solid var(--coral-500);outline-offset:1px}
@media (prefers-reduced-motion:reduce){.page *{transition:none!important}}
</style>
