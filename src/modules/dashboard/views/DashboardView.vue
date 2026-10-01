<script setup>
import { defineAsyncComponent } from 'vue'

const ClientDashboard = defineAsyncComponent(() => import('@/modules/dashboard/views/ClientDashboard.vue'))
</script>

<template>
  <ClientDashboard />
</template>
