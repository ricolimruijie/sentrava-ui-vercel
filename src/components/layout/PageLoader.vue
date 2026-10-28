<script setup>
import logoIcon from '@/assets/sentrava-logo-icon.svg'
</script>

<template>
  <!-- Shown inside the content area while a page loads its data; the sidebar and topbar stay put. -->
  <div class="page-loader" role="status" aria-label="Loading">
    <img :src="logoIcon" class="page-loader__logo" width="56" height="56" alt="" aria-hidden="true" />
    <span class="page-loader__name">SENTRAVA</span>
    <span class="page-loader__bar" />
  </div>
</template>

<style scoped lang="scss">
.page-loader {
  height: 100%;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  // Short pages load in a blink: wait a moment before showing so they never flash.
  opacity: 0;
  animation: page-loader-in 240ms ease 180ms forwards;

  &__logo { animation: page-loader-pulse 2.4s ease-in-out infinite; }
  &__name { font-size: var(--fs-lg); font-weight: 800; letter-spacing: .2em; margin-right: -.2em; color: var(--text-2); }
  &__bar {
    position: relative; width: 132px; height: 2px; border-radius: 2px; overflow: hidden; background: var(--gray-200);
    &::after { content: ''; position: absolute; inset: 0; width: 45%; background: linear-gradient(90deg, transparent, var(--coral-600)); animation: page-loader-bar 1.3s cubic-bezier(.4, 0, .2, 1) infinite; }
  }
}
@keyframes page-loader-in { to { opacity: 1 } }
@keyframes page-loader-pulse { 0%, 100% { opacity: .7; transform: scale(.94) } 50% { opacity: 1; transform: scale(1.04) } }
@keyframes page-loader-bar { from { transform: translateX(-100%) } to { transform: translateX(230%) } }
@media (prefers-reduced-motion: reduce) {
  .page-loader, .page-loader__logo, .page-loader__bar::after { animation: none }
  .page-loader { opacity: 1 }
  .page-loader__bar::after { width: 100% }
}
</style>
