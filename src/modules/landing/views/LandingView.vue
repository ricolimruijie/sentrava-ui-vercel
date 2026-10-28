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
      <!-- Pinned on wide screens: scrolling walks through the four steps (timeline on the right fills as you go).
           On small screens or with reduced motion it is a plain list. -->
      <div class="flow-outer"><section ref="flowEl" class="flow" :class="{ 'flow--static': !flowLive }">
        <div class="flow-pin">
          <div class="flow-panel">
            <div class="flow-left">
              <div class="flow-intro" data-ani="slide">
                <h2>From target to report in four steps</h2>
                <p class="flow-sub">Register an asset once, then scan and report on it whenever you need.</p>
              </div>

              <!-- Live illustration: one radar that changes with the active step -->
              <div class="flow-stage" aria-hidden="true">
                <div class="radar">
                  <svg class="rd-rings" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="14" /><circle cx="50" cy="50" r="28" /><circle cx="50" cy="50" r="42" />
                    <path d="M50 6V94M6 50H94" />
                  </svg>
                  <span class="rd-sweep" :class="{ on: flowStep === 2 }"></span>
                  <span class="rd-core" :class="{ off: flowStep === 3 }"></span>
                  <span v-for="(d, i) in flowDots" :key="d.name" class="rd-dot"
                    :class="{ on: flowStep <= 2, dim: flowStep >= 1 && i !== lockIdx, lock: flowStep >= 1 && i === lockIdx, sink: flowStep === 3 }"
                    :style="{ left: (flowStep === 3 ? 50 : d.x) + '%', top: (flowStep === 3 ? 50 : d.y) + '%', transitionDelay: (flowStep === 0 ? i * 380 : 0) + 'ms' }">
                    <span class="icon">{{ d.icon }}</span>
                    <span class="rd-label" :class="{ on: flowStep === 0 }" :style="{ transitionDelay: (flowStep === 0 ? i * 380 + 260 : 0) + 'ms' }">{{ d.name }}</span>
                  </span>
                  <span v-for="(k, i) in flowBlips" :key="i" class="rd-blip"
                    :class="{ on: flowStep === 2, sink: flowStep === 3 }"
                    :style="{ left: (flowStep === 3 ? 50 : k.x) + '%', top: (flowStep === 3 ? 50 : k.y) + '%', background: SEVCOLOR[k.s], transitionDelay: (flowStep === 2 ? 300 + i * 260 : 0) + 'ms' }"></span>
                  <div class="rd-report" :class="{ on: flowStep === 3 }">
                    <span class="icon rd-report-ico">description</span>
                    <span class="rd-report-line"></span><span class="rd-report-line short"></span>
                    <span class="rd-report-badges"><i style="background: var(--on-glass-critical)"></i><i style="background: var(--on-glass-high)"></i><i style="background: var(--on-glass-warn)"></i><i style="background: var(--on-glass-ok)"></i></span>
                  </div>
                </div>
                <p class="rd-caption mono">{{ ['4 assets registered', 'Target locked: ' + TARGETS[lockIdx].host, 'Scanning · findings ranked by severity', 'Report ready to download'][flowStep] }}</p>
              </div>
            </div>
            <ol class="flow-steps">
              <li v-for="(s, i) in steps" :key="s.title" class="flow-step" :class="{ on: flowStep === i, done: flowStep > i }" :style="{ '--sp': flowStep > i ? 1 : flowStep === i ? flowSub : 0 }">
                <span class="stepicon icon">{{ s.icon }}</span>
                <div class="flow-card">
                  <div class="between gap10"><h3>{{ s.title }}</h3><span class="mono small flow-tag">0{{ i + 1 }} / {{ s.tag }}</span></div>
                  <p class="body">{{ s.body }}</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section></div>

      <!-- Targets -->
      <div class="tg-outer"><section id="targets" ref="tgEl" class="col gap40 tgsec" :class="{ 'tgsec--live': tgLive }">
        <h2 class="oneline" data-ani="slide">One platform for every target</h2>
        <div class="targets" data-ani="slide">
          <ol class="tg-rail">
            <li v-for="(t, i) in TARGETS" :key="t.key" :class="{ on: i === tsel, done: i < tsel }">
              <button class="tg-rail-btn" @click="pick(i)">
                <span class="mono small tg-num">0{{ i + 1 }}</span>
                <b>{{ t.name }}</b>
                <span class="mono small tg-rail-tag">{{ t.tag }}</span>
              </button>
              <span class="tg-bar"><i :style="{ width: (i < tsel ? 100 : i === tsel ? (tgLive ? tgSub * 100 : !reduced ? Math.min(100, ta / ADV * 100) : 100) : 0) + '%' }"></i></span>
            </li>
          </ol>
          <div class="tg-stack">
            <article v-for="(t, i) in TARGETS" :key="t.key" class="tgcard" :class="{ front: i === tsel }"
              :style="{ '--d': i - tsel, zIndex: TARGETS.length - Math.abs(i - tsel) }">
              <span class="tg-bignum mono" aria-hidden="true">0{{ i + 1 }}</span>
              <div class="col gap14" :style="{ opacity: cv(i).op, transform: 'translateY(' + cv(i).ty + 'px)' }">
                <div class="row gap14"><span class="tabicon icon">{{ t.icon }}</span><h3 class="h26">{{ t.name }}</h3><span class="mono small muted tgtag">{{ t.tag }}</span></div>
                <p class="muted body maxw520">{{ t.desc }}</p>
              </div>
              <div class="tgpts" :class="'tgpts--' + t.layout">
                <div v-for="(c, n) in cv(i).points" :key="c.pt.title" class="tgpt" :class="c.pt.tone && 'tone-' + c.pt.tone" :style="{ opacity: c.op, transform: 'translateX(' + c.tx + 'px)' }">
                  <span v-if="c.pt.icon" class="tgpt-ico icon" aria-hidden="true">{{ c.pt.icon }}</span>
                  <span v-else class="tgpt-n" aria-hidden="true">{{ n + 1 }}</span>
                  <div class="tgpt-body">
                    <div class="tgpt-head"><b>{{ c.pt.title }}</b><span v-if="c.pt.cat" class="tgpt-cat">{{ c.pt.cat }}</span></div>
                    <span class="tgpt-text">{{ c.pt.body }}</span>
                  </div>
                  <div v-if="c.pt.chips" class="tgpt-chips"><span v-for="ch in c.pt.chips" :key="ch.t" class="tgpt-chip mono" :class="ch.s">{{ ch.t }}</span></div>
                  <span v-if="c.pt.tag" class="tgpt-tag mono">{{ c.pt.tag }}</span>
                  <span v-if="c.pt.out" class="tgpt-out">{{ c.pt.out }}</span>
                </div>
              </div>
              <p v-if="t.note" class="small muted tgnote">{{ t.note }}</p>
            </article>
          </div>
        </div>
            </section></div>

      <!-- Reports -->
      <div class="rp-outer"><section id="reports" ref="rpEl" class="rp" :class="{ 'rp--live': rpLive }">
        <div class="rp-top" data-ani="slide">
          <div class="col gap14">
            <h2>Reports for everyone who needs to act</h2>
            <p class="lead2 rp-lead-p">Every scan produces a downloadable report. Engineers get the detail to fix each issue. Leadership gets a clear picture of risk.</p>
          </div>
        </div>
        <!-- One finding, three lenses: the same issue is rewritten for each audience as you scroll. -->
        <div class="rp-stage" data-ani="slide">
          <ol class="rp-rail">
            <li v-for="(a, i) in audiences" :key="a.who" :class="{ on: i === rsel, done: i < rsel }">
              <button class="rp-rail-btn" @click="pickR(i)">
                <span class="rp-rail-ico icon" aria-hidden="true">{{ a.icon }}</span>
                <span class="col gap2 minw0"><b>{{ a.who }}</b><span class="rp-rail-txt">{{ a.what }}</span></span>
              </button>
              <span class="tg-bar"><i :style="{ width: (i < rsel ? 100 : i === rsel ? rSub * 100 : 0) + '%' }"></i></span>
            </li>
          </ol>
          <div class="rp-card">
            <div class="rp-fhead">
              <span class="rp-sev"><i></i>Critical</span>
              <b>SQL injection in user lookup</b>
              <span class="mono small rp-loc">SV-2041 · src/api/users.py:42</span>
            </div>
            <div class="rp-views">
              <!-- Engineers: the code and the fix -->
              <div class="rp-view" :class="{ on: viewOn(0) }">
                <div class="rp-lensrow"><span class="rp-lens">For engineers</span><span v-for="c in RP_TAGS" :key="c" class="rp-chip mono">{{ c }}</span></div>
                <div class="rp-code mono">
                  <div v-for="(l, n) in RP_CODE" :key="n" class="rp-ln" :class="l.k" :style="{ '--i': n }"><em>{{ l.n }}</em><span>{{ l.t }}</span></div>
                </div>
                <div class="rp-proof rp-it" style="--i: 5"><span class="rp-proof-lab">Proof</span><span class="mono rp-proof-req">GET /api/users?id=1' OR '1'='1</span><b class="rp-proof-res">200 · all rows returned</b></div>
                <p class="rp-fix rp-it" style="--i: 6"><span class="icon">build</span><span><b>Fix</b> Use a parameterised query so user input is never part of the SQL text.</span></p>
                <div class="rp-acts rp-it" style="--i: 7"><span class="rp-act"><span class="icon">confirmation_number</span>Create ticket</span><span class="rp-act"><span class="icon">content_copy</span>Copy patch</span><span class="rp-act"><span class="icon">replay</span>Re-scan after fix</span></div>
              </div>
              <!-- Leadership: the same finding in plain language -->
              <div class="rp-view" :class="{ on: viewOn(1) }">
                <span class="rp-lens">For leadership</span>
                <p class="rp-plain rp-it" style="--i: 0">Anyone who can reach this page could read or change customer records.</p>
                <div class="rp-meter rp-it" style="--i: 1">
                  <span class="rp-meter-lab">Severity</span>
                  <span class="rp-segs"><i v-for="n in 5" :key="n" :style="{ '--i': n }"></i></span>
                  <b>Critical</b>
                  <span class="rp-rec"><span class="icon">schedule</span>Fix within 24 hours</span>
                </div>
                <div class="rp-facts">
                  <div v-for="(f, n) in RP_FACTS" :key="f.k" class="rp-it rp-fact" :style="{ '--i': n + 2 }"><span>{{ f.k }}</span><b>{{ f.v }}</b></div>
                </div>
                <div class="rp-kpis">
                  <div v-for="(k, n) in RP_KPIS" :key="k.k" class="rp-it rp-kpi" :style="{ '--i': n + 5, '--w': k.w }"><span>{{ k.k }}</span><b>{{ k.v }}<small>{{ k.sub }}</small></b><span class="rp-bar"><i></i></span></div>
                </div>
                <div class="rp-trend rp-it" style="--i: 8">
                  <span class="small">Open critical findings, last 6 scans</span>
                  <svg viewBox="0 0 300 36" aria-hidden="true"><path d="M2 6 L62 9 L122 8 L182 20 L242 24 L298 30" pathLength="1" /></svg>
                  <b>5 → 2</b>
                </div>
              </div>
              <!-- Compliance: the same finding as an audit record -->
              <div class="rp-view" :class="{ on: viewOn(2) }">
                <span class="rp-lens">For compliance</span>
                <div class="rp-cols">
                  <ol class="rp-tl">
                    <li v-for="(e, n) in RP_AUDIT" :key="e.what" class="rp-it" :class="{ wait: e.wait }" :style="{ '--i': n }"><i></i><b>{{ e.what }}</b><span class="mono small">{{ e.when }}</span><span class="rp-tl-txt">{{ e.note }}</span></li>
                  </ol>
                  <div class="rp-kv">
                    <div v-for="(r, n) in RP_EVID" :key="r.k" class="rp-it rp-kvr" :style="{ '--i': n + 1 }"><span>{{ r.k }}</span><b class="mono">{{ r.v }}</b></div>
                  </div>
                </div>
                <div class="rp-ctrl-list">
                  <div v-for="(c, n) in RP_CTRLS" :key="c.id" class="rp-it rp-ctrl" :class="c.tone" :style="{ '--i': n + 5 }"><b class="mono">{{ c.id }}</b><span>{{ c.name }}</span><span class="rp-ctrl-st"><i></i>{{ c.st }}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section></div>

      <!-- Story: the problems SentraVA tackles. A line down the left fills as you scroll and each statement lights its dot. -->
      <div id="problems" class="col gap48">
      <header class="story-head">
        <h2 data-ani="slide">What problems SentraVA tackles</h2>
        <p class="muted lead2 maxw640" data-ani="slide">Security teams lose time to scattered tools, unclear priorities, and reports built by hand. These are the problems SentraVA is built to remove.</p>
      </header>
      <section ref="storyEl" class="story">
        <div class="story__rail" aria-hidden="true"><span class="story__fill" /></div>
        <article v-for="(t, i) in story" :key="t.label" class="story__item">
          <span class="story__dot" aria-hidden="true" />
          <span class="story__num" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
          <h3 class="story__h">{{ t.title }}</h3>
          <p class="muted lead2 story__p">{{ t.body }}</p>
        </article>
      </section>
      </div>

      <!-- FAQ: title on the left, numbered questions on the right -->
      <section id="faq" class="faq">
        <div class="faq-intro col gap16" data-ani="slide">
          <h2>Frequently asked questions</h2>
          <p class="muted lead2">Short answers to what teams usually want to know before they start.</p>
        </div>
        <ul class="faq-list" data-ani="stagger">
          <li v-for="(q, i) in faq" :key="q.q" class="faq-item" :class="{ 'is-open': faqOpen === i }">
            <button type="button" class="faq-q" :id="`faq-q-${i}`" :aria-expanded="faqOpen === i" :aria-controls="`faq-a-${i}`" @click="faqOpen = faqOpen === i ? -1 : i">
              <span class="faq-num" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="faq-text">{{ q.q }}</span>
              <span class="icon faq-icon" aria-hidden="true">expand_more</span>
            </button>
            <div class="faq-a" :id="`faq-a-${i}`" role="region" :aria-labelledby="`faq-q-${i}`">
              <div class="faq-a__in"><p class="muted lead2">{{ q.a }}</p></div>
            </div>
          </li>
        </ul>
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
  { key: 'Domain', name: 'Domains', icon: 'language', host: 'example.com', tag: 'DNS', short: 'Records, subdomains, certificates', layout: 'rec', desc: 'Register a domain. SentraVA maps its subdomains and endpoints, giving continuous visibility into external perimeter growth, forgotten test environments, and exposed services.', points: [
    { icon: 'code', title: 'Exposed Services & Ports', body: 'Internet-reachable ports, listeners, and unsegmented services.', tag: 'PORTS' },
    { icon: 'bug_report', title: 'Known CVE Signatures', body: 'Matches detected server banners and software stacks to public CVE feeds.', tag: 'CVE' },
    { icon: 'more_horiz', title: 'Weak & Default Logins', body: 'Administrative portals with default passwords or exposed credentials.', tag: 'AUTH' },
    { icon: 'lock', title: 'SSL/TLS Misconfigurations', body: 'Expired certificates, weak cipher suites, and outdated cryptographic protocols.', tag: 'TLS' },
    { icon: 'gpp_bad', title: 'End-of-Life Software', body: 'Unsupported server components no longer receiving security patches.', tag: 'EOL' }
  ] },
  { key: 'Network', name: 'Network', icon: 'lan', host: '10.0.4.0/24', tag: 'NET', short: 'Hosts, ports, and services', layout: 'host', desc: 'Register an IP or CIDR range. SentraVA finds live hosts and open ports across full subnets or targeted host lists, revealing perimeter exposure on internal and external networks.', points: [
    { icon: 'dns', title: 'Host & Service Mapping', body: 'Discovers responsive IP addresses, open listening ports, and running daemons.', chips: [{ t: '22 SSH', s: 'ok' }, { t: '80 HTTP', s: 'ok' }, { t: '23 Telnet', s: 'bad' }] },
    { icon: 'memory', title: 'Network Stack CVEs', body: 'Correlates detected OS versions and network hardware firmware against known flaws.', chips: [{ t: 'OpenSSH 7.4', s: 'bad' }, { t: 'nginx 1.24', s: 'ok' }] },
    { icon: 'router', title: 'Default Appliance Access', body: 'Identifies unhardened routers, switches, and remote access endpoints.', chips: [{ t: 'admin:admin', s: 'bad' }, { t: '8443 HTTPS', s: 'ok' }] },
    { icon: 'shield', title: 'Protocol Hardening', body: 'Flags legacy protocols including unencrypted Telnet, cleartext FTP, and weak TLS.', chips: [{ t: '23 Telnet', s: 'bad' }, { t: '21 FTP', s: 'bad' }, { t: '443 TLS', s: 'ok' }] },
    { icon: 'gpp_bad', title: 'End-of-Life Devices', body: 'Highlights obsolete hardware models and unsupported network operating systems.', chips: [{ t: 'EOL OS', s: 'bad' }, { t: 'No patches', s: 'bad' }] }
  ] },
  { key: 'Web application', name: 'Web application', icon: 'web', host: 'app.example.com', tag: 'DAST', short: 'Running, public-facing apps', layout: 'host', desc: 'Register a web application URL. SentraVA scans it from the outside, the way an attacker would see it, probing pages, forms and APIs for exposed admin panels, injection flaws, vulnerable web software, leaked secrets and API misconfigurations.', points: [
    { icon: 'gpp_maybe', title: 'Administrative exposure', body: 'Finds unprotected admin dashboards, default portals, and test consoles.', chips: [{ t: 'Unauthorized Access', s: 'ok' }] },
    { icon: 'vaccines', title: 'Injection vulnerabilities', body: 'Tests payloads for Cross-Site Scripting (XSS), SQLi, and code execution.', chips: [{ t: 'Data Compromise', s: 'bad' }] },
    { icon: 'deployed_code', title: 'Web software CVEs', body: 'Fingerprints CMS engines, frameworks, and third-party web libraries for known flaws.', chips: [{ t: 'RCE & Bypass', s: 'bad' }] },
    { icon: 'key', title: 'Leaked secrets & files', body: 'Checks public paths for exposed .env files, backup archives, and leaked API tokens.', chips: [{ t: 'Credential Theft', s: 'bad' }] },
    { icon: 'open_with', title: 'API misconfigurations', body: 'Evaluates REST endpoints for broken authorization and insecure CORS headers.', chips: [{ t: 'Data Leakage', s: 'ok' }] }
  ] },
  { key: 'Source code', name: 'Source code', icon: 'code', host: 'example/api-service', tag: 'SAST', short: 'Repositories and codebases', layout: 'host', desc: 'Connect a GitHub repo with a token and all its branches are registered. Static application security testing (SAST) identifies coding flaws, embedded credentials, and IaC weaknesses.', note: 'Native engine support: Java, C#, Go, JavaScript, TypeScript, PHP, Python, Ruby, Scala, and Terraform.', points: [
    { title: 'Code-Level Injections', body: 'Traces data flow from unvalidated inputs to SQL queries and OS shell commands.', icon: 'bug_report', chips: [{ t: 'Application code', s: 'bad' }] },
    { title: 'Hardcoded Secrets', body: 'Scans source trees for committed private keys, database credentials, and cloud tokens.', icon: 'key', chips: [{ t: 'Secrets audit', s: 'mid' }] },
    { title: 'Unsafe Functions', body: 'Flags deprecated cryptographic routines, weak randomness, and unsafe file handlers.', icon: 'warning', chips: [{ t: 'Runtime logic', s: 'mid' }] },
    { title: 'Authentication Flaws', body: 'Detects broken access controls, insecure session tokens, and bypass vectors.', icon: 'lock_open', chips: [{ t: 'Auth system', s: 'ok' }] },
    { title: 'IaC Misconfigurations', body: 'Validates Terraform scripts and infrastructure configurations for security oversights.', icon: 'cloud', chips: [{ t: 'Cloud infrastructure', s: 'mid' }] }
  ] }
]
const storyEl = ref(null)
const faqOpen = ref(-1) // index of the open question (-1 = all closed)
const navItems = [['product', 'Product'], ['targets', 'Targets'], ['reports', 'Reports'], ['problems', 'Problems'], ['faq', 'FAQ']].map(([id, label]) => ({ id, label }))
const steps = [
  { icon: 'app_registration', title: 'Register your assets', tag: 'ASSETS', body: 'Add the domains, network ranges, web applications, and source code repositories you want assessed.' },
  { icon: 'my_location', title: 'Choose a target', tag: 'TARGET', body: 'Select which registered asset to assess: a domain, network, web application, or source code repository.' },
  { icon: 'radar', title: 'Scan', tag: 'SCAN', body: 'SentraVA scans the target and lists every vulnerability it finds, ranked by severity.' },
  { icon: 'description', title: 'Review and report', tag: 'REPORT', body: 'Review results in one place and download reports to share with your team.' }
]
// Radar illustration: positions are percentages of the radar box.
const flowDots = [
  { icon: 'language', name: 'Domains', x: 26, y: 20 },
  { icon: 'lan', name: 'Network', x: 82, y: 32 },
  { icon: 'web', name: 'Web application', x: 70, y: 80 },
  { icon: 'code', name: 'Source code', x: 20, y: 68 }
]
const flowBlips = [
  { x: 40, y: 30, s: 'critical' }, { x: 63, y: 27, s: 'high' }, { x: 74, y: 50, s: 'medium' }, { x: 57, y: 63, s: 'high' },
  { x: 38, y: 72, s: 'low' }, { x: 27, y: 46, s: 'medium' }, { x: 51, y: 17, s: 'low' }, { x: 84, y: 66, s: 'low' }
]
const flowEl = ref(null)
const tgEl = ref(null)
const tgSub = ref(0)
const flowStep = ref(0)
const flowSub = ref(0) // progress through the active step, 0 to 1
const flowLive = computed(() => !reduced.value && w.value >= 1000)
// The target the radar locks onto: while choosing, it moves across each asset in turn, then stays on the last.
const lockIdx = computed(() => flowStep.value === 1 ? Math.min(flowDots.length - 1, Math.floor(flowSub.value * flowDots.length)) : flowDots.length - 1)
const rpEl = ref(null)
const rpLive = flowLive // the reports section pins on the same screens; scrolling moves through the three lenses
const rsel = ref(0)
const rSub = ref(0) // progress through the active lens, 0 to 1
const RP_CODE = [
  { n: 40, t: 'def get_user(request):', k: '' },
  { n: 41, t: '    uid = request.args["id"]', k: '' },
  { n: 42, t: '-   q = "SELECT * FROM users WHERE id=" + uid', k: 'del' },
  { n: 42, t: '+   q = "SELECT * FROM users WHERE id = %s"', k: 'add' },
  { n: 43, t: '+   return db.execute(q, (uid,))', k: 'add' }
]
const RP_TAGS = ['CWE-89', 'CVSS 9.8', 'Python', 'Flask']
const RP_FACTS = [{ k: 'Exposure', v: 'Internet-facing' }, { k: 'Affects', v: 'Customer database' }, { k: 'Time to fix', v: 'About 1 hour' }]
const RP_KPIS = [
  { k: 'Risk score', v: '72', sub: ' / 100', w: 0.72 },
  { k: 'Open criticals', v: '2', sub: ' down from 5', w: 0.4 },
  { k: 'Fixed this month', v: '14', sub: ' of 19', w: 0.74 }
]
const RP_AUDIT = [
  { what: 'Detected', when: '22 Oct 2026 · 09:14', note: 'Found by the scan of app.example.com' },
  { what: 'Assigned', when: '22 Oct 2026 · 11:02', note: 'Platform team' },
  { what: 'Fix verified', when: 'Pending re-scan', note: 'Status moves from Open to Fixed', wait: true }
]
const RP_EVID = [
  { k: 'Scan ID', v: 'scan_8f2a1c' }, { k: 'Scope', v: 'app.example.com' }, { k: 'Method', v: 'Automated · DAST' },
  { k: 'Owner', v: 'Platform team' }, { k: 'Due', v: '29 Oct 2026' }
]
const RP_CTRLS = [
  { id: 'OWASP A03:2021', name: 'Injection', st: 'Failing', tone: 'bad' },
  { id: 'PCI DSS 6.2.4', name: 'Attack prevention', st: 'Failing', tone: 'bad' },
  { id: 'ISO 27001 A.8.28', name: 'Secure coding', st: 'In review', tone: 'mid' }
]
const tgLive = flowLive // the targets section pins on the same screens, and scrolling moves through the targets
const audiences = [
  { icon: 'code', who: 'Engineers', what: 'Each finding with its location, severity, and the detail needed to fix it.' },
  { icon: 'monitoring', who: 'Leadership', what: 'A severity summary that shows overall risk at a glance.' },
  { icon: 'verified', who: 'Compliance', what: 'A downloadable record of what was assessed and what was found.' }
]
const story = [
  { label: 'One place', title: 'Security findings scattered across tools are hard to act on. SentraVA puts them in one place.', body: 'Most teams check domains, networks, applications, and code with separate tools, then reconcile the results by hand. Every tool has its own dashboard, its own severity scale, and its own export, so the same issue can show up twice or be missed entirely. SentraVA runs every assessment from one platform, so there is one list of findings and one report to work from. Your team can see all of its assets, what was found on each, and what has already been fixed, without switching between tools or merging spreadsheets.' },
  { label: 'One view', title: 'Findings split across tools make it hard to see the whole picture.', body: 'Domains, networks, applications, and code each have their own scanner and their own report. Someone has to open every tool, export the results, and line them up by hand just to answer a simple question like "what is our risk today?". SentraVA runs Domain, Network, Web App, and Source Code assessments from one platform and keeps every finding in a single list you can filter by asset, severity, and status.' },
  { label: 'Where to start', title: 'A long list of issues does not say where to start.', body: 'Hundreds of findings with no order leave teams guessing, and the serious ones get buried under the minor ones. SentraVA ranks every finding by severity, so critical and high issues come first. Each finding shows the affected asset and what was detected, and you can raise a ticket for it, so your team fixes the right things in the right order.' },
  { label: 'Reports', title: 'Building reports by hand takes time away from fixing.', body: 'Copying results from several tools into one document is slow and easy to get wrong, and it is out of date by the time it is shared. SentraVA produces a report straight from the findings in one place, so you can review the results and download a report for your team, your manager, or an auditor whenever you need one.' }
]
const faq = [
  { q: 'What can SentraVA scan?', a: 'SentraVA assesses four kinds of targets from one platform: domains, networks, web applications, and source code. Domains and networks are checked for exposed services and known vulnerabilities, web applications are tested for common web flaws, and source code is analysed for coding flaws, embedded credentials, and infrastructure-as-code misconfigurations. You register each target once, then scan it whenever you need.' },
  { q: 'What do I get after a scan?', a: 'You get a list of the vulnerabilities found, ranked by severity so the most urgent come first. Each finding shows the affected asset and what was detected, and you can raise a ticket for it so your team tracks the fix. You can also download a report from the same findings, with the detail engineers need to fix each issue and a clear picture of risk for leadership.' },
  { q: 'How is SentraVA priced?', a: 'Pricing is based on your assets. We count how many assets or targets you register, such as domains, networks, web applications, and code repositories, and your price follows that number.' },
  { q: 'How is SentraVA deployed?', a: 'SentraVA is deployed on-premises. We place a probe box in your environment, and it runs the assessments from inside your network. You allow the probe box through your firewall to the assets you want scanned, for example by whitelisting its address, so it can reach them. Nothing else needs to be installed on your assets.' },
  { q: 'Which tools does it integrate with?', a: 'You can raise a ticket from any finding so your team tracks the fix. Source code scanning connects to a GitHub repository with an access token, and all of its branches are registered for scanning. Connections are managed from the dashboard and the company settings, so an admin can see what is connected in one place.' },
  { q: 'How often can I run scans?', a: 'Run a scan whenever you need one, for example after a release or a change to your network. You can also schedule a scan to repeat, so a target is checked on a regular cadence without anyone having to remember. Each scan updates the findings for that target, so you can see what is new and what has been fixed since the last one.' }
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
const active = ref('product')
const now = ref(0)
const tsel = ref(0)
const tsw = ref(0)
const reduced = ref(false)
let raf = 0, t0 = 0, lenis = null, tick = null, ctx = null, onRefresh = null

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
    points: tg.points.map((pt, i) => { const k = ease((a - 0.12 - i * 0.08) / 0.4); return { pt, op: k, tx: (1 - k) * -14 } })
  }
})
const pick = i => { tsel.value = i; tsw.value = now.value }
const viewOn = i => !rpLive.value || rsel.value === i // narrow screens show all three lenses stacked
const pickR = i => { rsel.value = i; rSub.value = 0 }
// What a stacked card shows: the active one animates in, the others sit fully drawn behind it.
const cv = i => i === tsel.value ? tp.value : (() => {
  const tg = TARGETS[i]
  return { ex: FINDINGS[tg.key][0], op: 1, ty: 0, exOp: 1, exTy: 0, points: tg.points.map(pt => ({ pt, op: 1, tx: 0 })) }
})()

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

/* ---------- motion ---------- */
// Same flow as orchid.security: Lenis smooth scroll driving GSAP ScrollTrigger, a staggered fade-up on
// load, slide / fade / stagger reveals as sections enter, and a masked line-by-line headline reveal.
function setupMotion() {
  lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  // The page height changes after load (the dashboard preview grows once it mounts) and ScrollTrigger refreshes;
  // Lenis keeps its own scroll limit, so re-measure it each time or scrolling stops short of the page end.
  onRefresh = () => lenis?.resize()
  ScrollTrigger.addEventListener('refresh', onRefresh)
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

    // Problems: the rail fills with scroll; each statement's headline rises line by line out of a mask, its number
    // fades in and its dot lights up as it enters.
    gsap.fromTo('.story__fill', { scaleY: 0 }, {
      scaleY: 1, ease: 'none', transformOrigin: 'top center',
      scrollTrigger: { trigger: storyEl.value, start: 'top 60%', end: 'bottom 60%', scrub: true },
    })
    gsap.utils.toArray('.story__item').forEach((item) => {
      item.classList.add('story__item--wait')
      ScrollTrigger.create({
        trigger: item, start: 'top 60%',
        onEnter: () => item.classList.remove('story__item--wait'),
        onLeaveBack: () => item.classList.add('story__item--wait'),
      })
      gsap.from(item.querySelector('.story__num'), {
        opacity: 0, x: -24, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: item, start: 'top 75%' },
      })
      SplitText.create(item.querySelector('.story__h'), {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 110, duration: 0.9, ease: 'power3.out', stagger: 0.12,
          scrollTrigger: { trigger: item, start: 'top 72%' },
        }),
      })
    })

    // Steps: the section pins, and scroll progress picks the active step (wide screens only).
    gsap.matchMedia().add('(min-width: 1000px)', () => {
      ScrollTrigger.create({
        trigger: flowEl.value, start: 'top top', end: '+=220%', pin: true, anticipatePin: 1,
        onUpdate: (self) => {
          const f = Math.min(3.999, self.progress * 4)
          flowStep.value = Math.floor(f)
          flowSub.value = +(f - flowStep.value).toFixed(3)
        },
        onLeave: () => { flowStep.value = 3; flowSub.value = 1 },
        onLeaveBack: () => { flowStep.value = 0; flowSub.value = 0 },
      })
    })

    // Targets: the section fills the screen and pins; scroll progress opens each target in turn.
    gsap.matchMedia().add('(min-width: 1000px)', () => {
      const n = TARGETS.length
      const set = (i, sub) => { if (tsel.value !== i) { tsel.value = i; tsw.value = now.value } tgSub.value = sub }
      ScrollTrigger.create({
        trigger: tgEl.value, start: 'top top', end: '+=' + n * 70 + '%', pin: true, anticipatePin: 1,
        onUpdate: (self) => {
          const f = Math.min(n - 0.001, self.progress * n)
          set(Math.floor(f), +(f - Math.floor(f)).toFixed(3))
        },
        onLeave: () => set(n - 1, 1),
        onLeaveBack: () => set(0, 0),
      })
    })

    // Reports: created after the targets trigger so ScrollTrigger measures it in page order. It pins, and scroll
    // progress moves through the three lenses on the same finding.
    gsap.matchMedia().add('(min-width: 1000px)', () => {
      const n = audiences.length
      const set = (i, sub) => { rsel.value = i; rSub.value = sub }
      ScrollTrigger.create({
        trigger: rpEl.value, start: 'top top', end: '+=' + n * 55 + '%', pin: true, anticipatePin: 1,
        onUpdate: (self) => {
          const f = Math.min(n - 0.001, self.progress * n)
          set(Math.floor(f), +(f - Math.floor(f)).toFixed(3))
        },
        onLeave: () => set(n - 1, 1),
        onLeaveBack: () => set(0, 0),
      })
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
      if (!tgLive.value && now.value - tsw.value >= ADV) { tsel.value = (tsel.value + 1) % TARGETS.length; tsw.value = now.value }
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
  if (onRefresh) ScrollTrigger.removeEventListener('refresh', onRefresh)
  lenis?.destroy()
})
</script>

<style scoped lang="scss" src="./LandingView.scss"></style>
