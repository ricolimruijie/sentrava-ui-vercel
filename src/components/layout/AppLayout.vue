<script setup>
import { ref } from 'vue'
import Sidebar   from './Sidebar.vue'
import AppNavbar from './AppNavbar.vue'

const collapsed = ref(false)
</script>

<template>
  <!-- Fixed gradient blobs — visible through glass panels -->
  <div class="app-bg" aria-hidden="true">
    <div class="blob blob--red" />
    <div class="blob blob--blue" />
    <div class="blob blob--purple" />
  </div>

  <div class="app-layout" :class="{ 'app-layout--collapsed': collapsed }">
    <Sidebar :collapsed="collapsed" />

    <div class="app-layout__main">
      <AppNavbar :collapsed="collapsed" @toggle-sidebar="collapsed = !collapsed">
        <slot name="navbar" />
      </AppNavbar>

      <main class="app-layout__content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
// ── Background blobs ────────────────────────────────────────────────────────
.app-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.blob {
  position: absolute;
  border-radius: 50%;

  &--red {
    width: 600px;
    height: 500px;
    background: radial-gradient(ellipse, rgba(255,37,41,0.10) 0%, transparent 70%);
    top: -120px;
    left: -80px;
    filter: blur(50px);
  }

  &--blue {
    width: 500px;
    height: 600px;
    background: radial-gradient(ellipse, rgba(40,90,210,0.08) 0%, transparent 70%);
    bottom: -120px;
    right: -80px;
    filter: blur(50px);
  }

  &--purple {
    width: 400px;
    height: 400px;
    background: radial-gradient(ellipse, rgba(120,40,210,0.07) 0%, transparent 70%);
    top: 45%;
    left: 45%;
    transform: translate(-50%, -50%);
    filter: blur(60px);
  }
}

// ── Layout ───────────────────────────────────────────────────────────────────
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
  z-index: 1;

  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    background: transparent;
    padding: 24px 28px;

    @include below($bp-lg) {
      padding: 16px;
    }
  }
}
</style>
