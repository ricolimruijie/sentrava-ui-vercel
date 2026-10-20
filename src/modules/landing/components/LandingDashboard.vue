<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IconChevronsRight, IconChevronRight, IconChevronDown, IconSun, IconBell } from '@tabler/icons-vue'
import { dashboardPreview as D } from '@/config/dashboardPreview'

// The home page's picture of the product: the real sidebar and dashboard widgets (same components and the
// same sample data as the demo app), rendered at the app's desktop size and scaled to fit. Behaves like the
// orchid.security hero: the window scales in as it arrives, then stays pinned while the dashboard scrolls
// inside it, so every widget is seen before the page moves on.
gsap.registerPlugin(ScrollTrigger)

const data = D.data
const DESIGN_W = 1440 // the width the app is laid out at; the window scales this to fit
const DESIGN_H = 1400 // upper limit for the app's natural height inside the window

const stage = ref(null)
const frame = ref(null)
const page = ref(null)
const scroller = ref(null)
const compact = ref(false) // small screens: no scaling, no sidebar, no pinning
const scale = ref(1)
const innerH = ref(DESIGN_H)
const stickyTop = ref(104) // where the window pins: clear of the nav bar, centred in the space left
const ready = ref(false) // widgets mount when the window comes into view, so their own entrance animations play on screen

let ctx = null
let ro = null
let roPage = null
let lastPageH = 0
let io = null

function layout() {
  compact.value = window.innerWidth < 1100
  if (compact.value) { scale.value = 1; return }
  const w = stage.value.clientWidth
  scale.value = w / DESIGN_W
  // Sized like orchid's: about 86% of the screen height, pinned 10% down, with a small gap underneath.
  const vh = window.innerHeight
  const top = Math.max(88, Math.round(vh * 0.1))
  const avail = vh - top - Math.round(vh * 0.04)
  innerH.value = Math.min(DESIGN_H, Math.floor(avail / scale.value))
  stickyTop.value = Math.round(top + (avail - innerH.value * scale.value) / 2)
}

function build() {
  ctx?.revert()
  ctx = null
  stage.value.style.height = ''
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  ctx = gsap.context(() => {
    if (compact.value) {
      gsap.fromTo(frame.value, { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1, ease: 'power2.out',
        scrollTrigger: { trigger: stage.value, start: 'top 88%' },
      })
      return
    }
    const frameH = innerH.value * scale.value
    lastPageH = page.value.scrollHeight
    const viewH = scroller.value?.clientHeight || innerH.value - 60 // the visible area under the top bar
    const travel = Math.max(0, lastPageH - viewH) * scale.value // how far the dashboard scrolls inside the window
    const hold = window.innerHeight * 0.25
    const extra = travel + hold
    stage.value.style.height = frameH + extra + 'px'

    // 1. The window scales in as it arrives (scrubbed), like orchid's dashboard image.
    gsap.fromTo(frame.value, { scale: 0.86, y: 70, opacity: 0.4, transformOrigin: '50% 0%' }, {
      scale: 1, y: 0, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: stage.value, start: 'top 92%', end: () => 'top ' + stickyTop.value + 'px', scrub: true },
    })
    // 2. While it stays pinned, the dashboard scrolls inside the window, scrubbed by the page scroll.
    gsap.to(page.value, {
      y: -travel / scale.value, ease: 'none',
      scrollTrigger: { trigger: stage.value, start: () => 'top ' + stickyTop.value + 'px', end: () => '+=' + travel, scrub: 0.6 },
    })
  }, stage.value)
}

async function relayout() {
  layout()
  await nextTick()
  build()
  ScrollTrigger.refresh()
}

onMounted(() => {
  layout()
  io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return
    ready.value = true
    io.disconnect()
    // the widgets have their final height a moment after they mount
    setTimeout(relayout, 900)
  }, { rootMargin: '0px 0px 15% 0px' })
  io.observe(stage.value)
  ro = new ResizeObserver(() => { clearTimeout(onMounted.t); onMounted.t = setTimeout(relayout, 150) })
  ro.observe(stage.value)
  window.addEventListener('resize', onWindowResize)
  // The dashboard's height settles after its widgets mount and animate; re-measure so the pinned scroll reaches the very bottom.
  roPage = new ResizeObserver(() => {
    const h = page.value?.scrollHeight ?? 0
    if (Math.abs(h - lastPageH) < 2) return
    lastPageH = h
    onWindowResize()
  })
  roPage.observe(page.value)
  nextTick(build)
})

function onWindowResize() { clearTimeout(onMounted.t); onMounted.t = setTimeout(relayout, 150) }

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
  io?.disconnect()
  ro?.disconnect()
  roPage?.disconnect()
  clearTimeout(onMounted.t)
  ctx?.revert()
})
</script>

<template>
  <div ref="stage" class="dash-stage">
    <div class="dash-sticky" :style="compact ? null : { top: stickyTop + 'px' }">
      <div
        ref="frame" class="dash-frame" :class="{ 'dash-frame--compact': compact }"
        :style="compact ? null : { height: innerH * scale + 'px' }"
        role="img" aria-label="Preview of the SentraVA dashboard (sample data)"
      >
        <div
          class="dash-app" inert
          :style="compact ? null : { width: DESIGN_W + 'px', height: innerH + 'px', transform: 'scale(' + scale + ')' }"
        >
          <D.Sidebar v-if="!compact" class="dash-sidebar" active-path="/dashboard" collapsed />

          <div class="dash-main">
            <header v-if="!compact" class="dash-navbar">
              <div class="dash-navbar__left">
                <span class="dash-navbar__btn"><IconChevronsRight :size="18" /></span>
                <nav class="dash-crumbs">
                  <span class="dash-crumbs__section">Menu <IconChevronDown :size="12" /></span>
                  <IconChevronRight :size="14" class="dash-crumbs__sep" />
                  <b class="dash-crumbs__current">Dashboard</b>
                </nav>
              </div>
              <div class="dash-navbar__right">
                <span class="dash-filter">Filter company <IconChevronDown :size="16" /></span>
                <span class="dash-navbar__btn dash-navbar__btn--sun"><IconSun :size="18" /></span>
                <span class="dash-navbar__btn"><IconBell :size="18" /><i class="dash-navbar__badge">55</i></span>
                <span class="dash-navbar__divider"></span>
                <span class="dash-user"><i class="dash-user__avatar">RL</i>Rico Lim <IconChevronDown :size="14" /></span>
              </div>
            </header>

            <div ref="scroller" class="dash-scroll">
              <div ref="page" class="dash-page">
                <template v-if="ready">
                  <div class="dashboard">
                    <D.DashboardHeader :companies="data.companies" name="Rico" />

                    <div class="row row--top">
                      <D.AccountOverview :data="data.accountOverview" />
                      <D.IntegrationConnection :probe-box="data.probeBoxHealth" :tools="data.scannerTools" />
                      <D.AssetRegisteredTracker :data="data.assetTracker" />
                    </div>

                    <D.OverallSeverityTrend :data="data.severityTrend" />

                    <div class="row row--mid">
                      <D.TopVulnerabilities :items="data.topVulnerabilities" />
                      <D.ScanningInProgress :items="data.scanningInProgress" />
                    </div>

                    <div class="row row--bot">
                      <D.VulnerabilityCycleTracker :initial-values="data.vulnerabilityCycle" />
                      <D.TicketFeed :items="data.ticketFeed" class="ticket-feed" />
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./LandingDashboard.scss"></style>
