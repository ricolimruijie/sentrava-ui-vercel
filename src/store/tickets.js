import { defineStore } from 'pinia'
import { ref } from 'vue'

// Tickets created this session (mock mode keeps nothing server-side). The list
// page shows these above its built-in sample tickets, and the detail page
// looks them up here first.
export const useTicketStore = defineStore('tickets', () => {
  const created = ref([])

  function add(ticket) {
    created.value = [ticket, ...created.value]
  }
  function byId(ticketId) {
    return created.value.find((t) => t.ticketId === ticketId) ?? null
  }

  return { created, add, byId }
})
