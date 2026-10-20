<script setup>
// The animated coral visual behind the signed-out pages: same blobs, gradients and
// motion as the login page (modules/auth AuthLayout). Fixed to the viewport, so a
// long page scrolls over it. If a parent sets --coral-scroll (0 to 1 scroll progress) the blobs drift with it.
defineProps({ motion: { type: Boolean, default: true } })
</script>

<template>
  <div class="coral" :class="{ 'coral--still': !motion }" aria-hidden="true">
    <div class="coral__base"></div>
    <span class="blob blob--1"></span>
    <span class="blob blob--2"></span>
    <span class="blob blob--3"></span>
    <span class="blob blob--4"></span>
    <span class="blob blob--5"></span>
    <div class="coral__shade"></div>
  </div>
</template>

<style scoped>
.coral { position: fixed; inset: 0; z-index: 0; overflow: hidden; isolation: isolate; pointer-events: none; background: var(--coral-700); }
.coral__base { position: absolute; inset: 0; background: radial-gradient(120% 90% at 20% 10%, var(--coral-500), var(--coral-700) 45%, var(--coral-900) 100%); }
.coral__shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(40,0,6,0) 45%, rgba(40,0,6,.55) 100%); }

.blob { position: absolute; aspect-ratio: 1; }
.blob--1 { translate: 0 calc(var(--coral-scroll, 0) * -30vh); will-change: translate; left: -12%; top: -14%; width: 58%; background: linear-gradient(150deg, var(--coral-flame), var(--coral-600)); box-shadow: 0 50px 90px -20px rgba(60,0,8,.55); animation: morphA 22s ease-in-out infinite; }
.blob--2 { translate: 0 calc(var(--coral-scroll, 0) * -18vh); will-change: translate; right: -18%; top: -10%; width: 62%; background: linear-gradient(200deg, var(--coral-700), var(--coral-800)); box-shadow: 0 50px 90px -20px rgba(60,0,8,.55); animation: morphB 26s ease-in-out infinite; }
.blob--3 { translate: 0 calc(var(--coral-scroll, 0) * -46vh); will-change: translate; left: 26%; top: 22%; width: 52%; background: linear-gradient(160deg, var(--coral-600), var(--coral-700)); box-shadow: 0 60px 100px -20px rgba(50,0,6,.6); animation: morphC 20s ease-in-out infinite; }
.blob--4 { translate: 0 calc(var(--coral-scroll, 0) * 24vh); will-change: translate; right: -14%; bottom: -18%; width: 56%; background: linear-gradient(330deg, var(--coral-flame-2), var(--coral-500)); box-shadow: 0 -40px 90px -20px rgba(60,0,8,.5); animation: morphB 24s ease-in-out -8s infinite; }
.blob--5 { translate: 0 calc(var(--coral-scroll, 0) * -26vh); will-change: translate; left: -16%; bottom: -24%; width: 60%; background: linear-gradient(30deg, var(--coral-ember), var(--coral-900)); box-shadow: 0 -40px 90px -20px rgba(30,0,4,.6); animation: morphA 28s ease-in-out -12s infinite; }
.coral--still .blob { animation-play-state: paused; }

@keyframes morphA { 0%,100% { border-radius: 58% 42% 63% 37% / 45% 55% 45% 55%; transform: translate(0,0) rotate(0) } 50% { border-radius: 40% 60% 38% 62% / 60% 38% 62% 40%; transform: translate(4%,6%) rotate(18deg) } }
@keyframes morphB { 0%,100% { border-radius: 42% 58% 35% 65% / 58% 40% 60% 42%; transform: translate(0,0) rotate(0) } 50% { border-radius: 63% 37% 56% 44% / 40% 62% 38% 60%; transform: translate(-5%,-4%) rotate(-22deg) } }
@keyframes morphC { 0%,100% { border-radius: 50% 50% 40% 60% / 40% 60% 50% 50%; transform: translate(0,0) scale(1) } 50% { border-radius: 36% 64% 60% 40% / 62% 36% 64% 38%; transform: translate(3%,-6%) scale(1.06) } }
@media (prefers-reduced-motion: reduce) { .blob { animation: none; } }
</style>
