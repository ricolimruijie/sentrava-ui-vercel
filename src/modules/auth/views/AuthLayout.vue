<script setup>
import { computed } from 'vue'

// Shared page shell for the signed-out pages (login, forgot password): the
// animated coral visual behind a centered stack of glass cards, from
// references/LoginPage.vue. Pages put their cards in the default slot and load
// the same scoped stylesheet (auth.css) so the cards pick up the card styling.
const props = defineProps({
  layout: { type: String, default: 'centered' }, // 'split' | 'centered'
  motion: { type: Boolean, default: true },
})
const isSplit = computed(() => props.layout === 'split')
</script>

<template>
  <div class="login" :class="{ 'login--split': isSplit, 'login--centered': !isSplit, 'login--still': !motion }">
    <div class="visual" aria-hidden="true">
      <div class="visual__base"></div>
      <span class="blob blob--1"></span>
      <span class="blob blob--2"></span>
      <span class="blob blob--3"></span>
      <span class="blob blob--4"></span>
      <span class="blob blob--5"></span>
      <div class="visual__shade"></div>

      <div v-if="isSplit" class="visual__content">
        <span class="brand-pill">SENTRAVA</span>
        <h2 class="visual__headline">Your Trusted Partner in Cybersecurity &amp; Asset Protection</h2>
      </div>
    </div>

    <div class="form-wrap">
      <div class="stack">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped src="./auth.css"></style>
