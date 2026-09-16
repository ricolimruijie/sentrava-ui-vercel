<script setup>
import { defineAsyncComponent } from 'vue'

const ClientDashboard = defineAsyncComponent(() => import('./ClientDashboard.vue'))
</script>

<template>
  <ClientDashboard />
</template>
