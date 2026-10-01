<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatShortDate } from '@/utils/helpers'
import { useTicketStore } from '@/modules/tickets/store/tickets'
import { useRole } from '@/composables/useRole'
import { useAuthStore } from '@/stores/auth'
import { notifyMock, demoUserId } from '@/utils/notifyMock'
import { sampleTicketOwners, canViewTicket } from '@/modules/tickets/utils/visibility'
import { IconUser, IconPhoto, IconFile, IconSend2, IconArrowLeft, IconX, IconTicket, IconCheck } from '@tabler/icons-vue'

const route = useRoute()
const router = useRouter()
const ticketStore = useTicketStore()
// Only a super admin can close a ticket.
const { can } = useRole()
const auth = useAuthStore()
const ticketId = computed(() => route.params.id ?? 'ANO31456123458765')

const ticketMap = {
  ANO31456123458765: {
    id: '#ANO31456123458765',
    status: 'Open',
    title: "Can't executed scan in module Domain Inspection",
    submissionDate: '10 February 2026',
    submitter: 'ricolimruijie',
    company: 'Protergo Cyber Security Ampera',
    category: 'Application & System Failures',
    description: 'When attempting to execute a scan in the Domain Inspection module, the system returns “Scan execution failed” with error code 500. Steps: 1) Domain Inspection → Start Scan, 2) Target protergo.id, 3) Execute. Expected: scan starts. Actual: error toast, no job created.',
    attachments: [],
    isClosed: false,
  },
  ANO31456123458766: {
    id: '#ANO31456123458766',
    status: 'Open',
    title: 'Potential Port Scanning detected on 10.20.1.10',
    submissionDate: '12 February 2026',
    submitter: 'alexclaire',
    company: 'Protergo Cyber Security Jakarta',
    category: 'Application & System Failures',
    description: 'IDS flagged repeated SYN probes from 203.0.113.42 against port 22 and 3389. Logs attached. Need guidance on blocking and whether to treat as incident.',
    attachments: [{ id: 1, thumb: 'https://via.placeholder.com/120x160/e5e7eb/9ca3af?text=IDS+Log' }],
    isClosed: false,
  },
  ANO31456123458767: {
    id: '#ANO31456123458767',
    status: 'Open',
    title: 'Web Application scan returns empty results',
    submissionDate: '15 February 2026',
    submitter: 'budimansuharjo',
    company: 'Protergo Cyber Security Surabaya',
    category: 'Application & System Failures',
    description: 'Nuclei scan for https://app.protergo.id finished in 2m 14s but findings are empty despite known test payloads. Attached config.',
    attachments: [
      { id: 1, thumb: 'https://via.placeholder.com/120x160/e5e7eb/9ca3af?text=Config' },
      { id: 2, thumb: 'https://via.placeholder.com/120x160/e5e7eb/9ca3af?text=Result' },
    ],
    isClosed: false,
  },
  ANO31456123458768: {
    id: '#ANO31456123458768',
    status: 'Open',
    title: 'Billing inquiry: additional quota for Domain Inspection',
    submissionDate: '18 February 2026',
    submitter: 'sitikhodijah',
    company: 'Protergo Fintech Solutions',
    category: 'General Enquiry',
    description: 'Request to increase monthly quota from 4 to 8 for Domain Inspection. Contract based. Please share pricing and effective date.',
    attachments: [],
    isClosed: false,
  },
  ANO31456123458769: {
    id: '#ANO31456123458769',
    status: 'Open',
    title: 'Source Code scan timeout after 30 minutes',
    submissionDate: '20 February 2026',
    submitter: 'dwiastuti',
    company: 'Protergo Labs',
    category: 'Others',
    description: 'Semgrep job for repo protergo-backend exceeded 30m timeout on branch main. Logs show “out of memory”.',
    attachments: [{ id: 1, thumb: 'https://via.placeholder.com/120x160/e5e7eb/9ca3af?text=Semgrep+Log' }],
    isClosed: false,
  },
  ANO31456123458770: {
    id: '#ANO31456123458770',
    status: 'Open',
    title: 'Unable to download vulnerability report PDF',
    submissionDate: '22 February 2026',
    submitter: 'taufikrahman',
    company: 'Beta Ventures Security',
    category: 'General Enquiry',
    description: 'Export PDF for report 2026-02-22 returns 404. Tried Chrome and Firefox, same. No attachment.',
    attachments: [],
    isClosed: false,
  },
  ANO31456123458771: {
    id: '#ANO31456123458771',
    status: 'Resolved',
    title: 'Probe Box offline in Jakarta DC',
    submissionDate: '25 February 2026',
    submitter: 'nurasiah',
    company: 'Protergo Cyber Security Ampera',
    category: 'Application & System Failures',
    description: 'Probe probe-jakarta-01 last seen 3 days ago. Power and network checked, still offline. Resolved after reboot.',
    attachments: [
      { id: 1, thumb: 'https://via.placeholder.com/120x160/e5e7eb/9ca3af?text=Probe+Photo' },
      { id: 2, thumb: 'https://via.placeholder.com/120x160/e5e7eb/9ca3af?text=Network+Log' },
    ],
    isClosed: true,
  },
  ANO31456123458772: {
    id: '#ANO31456123458772',
    status: 'Open',
    title: 'Request for API key rotation',
    submissionDate: '27 February 2026',
    submitter: 'wiranata',
    company: 'Protergo Cyber Security Bandung',
    category: 'Others',
    description: 'Need to revoke old key ending in 9f12 and issue new for CI/CD pipeline. Attached current key metadata.',
    attachments: [{ id: 1, thumb: 'https://via.placeholder.com/120x160/e5e7eb/9ca3af?text=Key+Meta' }],
    isClosed: false,
  },
  ANO31456123458773: {
    id: '#ANO31456123458773',
    status: 'Resolved',
    title: 'False positive on CVE-2023-1234',
    submissionDate: '28 February 2026',
    submitter: 'eldiana',
    company: 'Protergo Cyber Security Ampera',
    category: 'Application & System Failures',
    description: 'Semgrep flagged CVE-2023-1234 in test fixture as critical, but dependency is not bundled in production. Marked false positive.',
    attachments: [],
    isClosed: true,
  },
  ANO31456123458774: {
    id: '#ANO31456123458774',
    status: 'Open',
    title: 'Top-up credit not reflected in dashboard',
    submissionDate: '02 March 2026',
    submitter: 'ricolimruijie',
    company: 'Protergo Cyber Security Ampera',
    category: 'General Enquiry',
    description: 'Payment for 50 credits succeeded (INV-20260302) but dashboard still shows 0. No attachment.',
    attachments: [],
    isClosed: false,
  },
}

// Tickets created this session live in the ticket store; the rest are the samples above.
function lookup(id) {
  const made = ticketStore.byId(id)
  if (made) {
    return {
      id: `#${made.ticketId}`,
      status: 'Open',
      title: made.name,
      submissionDate: made.date,
      submitter: made.submitter,
      company: made.company,
      category: made.category,
      description: made.description,
      attachments: [],
      isClosed: false,
    }
  }
  const known = ticketMap[id] ?? ticketMap.ANO31456123458765
  const key = ticketMap[id] ? id : 'ANO31456123458765'
  return { ...known, ...sampleTicketOwners[key] }
}
const ticket = ref({ ...lookup(ticketId.value) })
// Members only see their own tickets and admins their company's (PRD 6.4);
// anything else goes back to the list.
const allowed = computed(() => canViewTicket(ticket.value, auth.user))
watch(allowed, (ok) => { if (!ok) router.replace('/tickets') }, { immediate: true })
watch(ticketId, (id) => {
  const next = lookup(id)
  ticket.value = { ...next }
})

const reply = ref('')

const messages = ref([
  { id: 's0', kind: 'system', text: 'Rico Lim Rui Jie <b>Opened</b> ticket', time: '16 May 2025 &nbsp; 10:54' },
  { id: 'm1', from: 'user', name: 'Rico Lim Rui Jie', time: '03 April 2025 &nbsp; 15:20', initials: 'R', text: 'Ticket sent to Protergo Support Team.', variant: 'user' },
  { id: 'm2', from: 'support', name: 'Protergo Support', time: '03 April 2025 &nbsp; 15:20', text: 'Thanks for submitting your ticket.<br>Your Ticket ID for this Ticket is “<b>ANO3146565</b>”', variant: 'support' },
  { id: 's1', kind: 'system', text: 'Protergo Support changed to <b>Processing</b> ticket', time: '16 May 2025 &nbsp; 10:54' },
  { id: 'm3', from: 'support', name: 'Protergo Support', time: '03 April 2025 &nbsp; 15:20', text: 'Our technical team is currently working on it<br>and will get back to you soon.', variant: 'support' },
  { id: 's2', kind: 'system', text: 'Protergo Support changed to <b>Closed</b> ticket', time: '16 May 2025 &nbsp; 10:54' },
  { id: 'm4', from: 'support', name: 'Protergo Support', time: '03 April 2025 &nbsp; 15:20', text: 'Dear Rico,<br>Protergo Support closed the ticket.', variant: 'support' },
])

const chatRef = ref(null)

function scrollToBottom() {
  nextTick(() => {
    const el = chatRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

onMounted(scrollToBottom)
watch(() => messages.value.length, scrollToBottom)

function sendReply() {
  const t = reply.value.trim()
  if (!t) return
  messages.value.push({ id: `u-${Date.now()}`, from: 'user', name: 'Rico Lim Rui Jie', time: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), initials: 'R', text: t, variant: 'user' })
  reply.value = ''
}

function closeTicket() {
  ticket.value.isClosed = true
  // N-TK-04: tell the ticket's creator it was closed (the real backend does this itself).
  const id = String(ticketId.value)
  demoUserId(ticket.value.submitter).then((creator) => {
    if (creator) notifyMock('N-TK-04', { vars: { ticket: id }, userIds: [creator], link: `/tickets/${id}` })
  })
  messages.value.push({ id: `s-${Date.now()}`, kind: 'system', text: 'Ticket <b>Closed</b> by user', time: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) })
}

const showCloseModal = ref(false)
const closeTicketState = ref('idle') // 'idle' | 'loading' | 'saved'
function openCloseModal() { closeTicketState.value = 'idle'; showCloseModal.value = true }
function closeCloseModal() { showCloseModal.value = false }
function confirmCloseTicket() {
  if (closeTicketState.value !== 'idle') return
  closeTicketState.value = 'loading'
  setTimeout(() => {
    closeTicketState.value = 'saved'
    setTimeout(() => {
      showCloseModal.value = false
      closeTicket()
    }, 400)
  }, 600)
}

const showAttachmentModal = ref(false)
const activeAttachment = ref(null)
function openAttachment(a) {
  activeAttachment.value = a
  showAttachmentModal.value = true
}
function closeAttachmentModal() {
  showAttachmentModal.value = false
  activeAttachment.value = null
}
</script>

<template>
  <div v-if="allowed" class="ticket-detail">
    <button type="button" class="back-btn" @click="router.push('/tickets')">
      <IconArrowLeft :size="16" /> Back to Ticket List
    </button>

    <div class="ticket-layout">
      <div class="main-card">
        <div class="main-head">
          <div class="main-head__id">{{ ticket.id }} <span class="status-pill status-pill--open">{{ ticket.status }}</span></div>
          <h1 class="main-head__title">{{ ticket.title }}</h1>
          <div class="main-head__meta">Submission Date: {{ formatShortDate(ticket.submissionDate) }}</div>
        </div>

        <div ref="chatRef" class="chat">
          <template v-for="m in messages" :key="m.id">
            <div v-if="m.kind === 'system'" class="chat-system">
              <span class="chat-system__line" />
              <span class="chat-system__text" v-html="`${m.text}<br><small>${m.time}</small>`" />
              <span class="chat-system__line" />
            </div>

            <div v-else class="chat-msg" :class="`chat-msg--${m.variant}`">
              <span class="chat-msg__avatar" :class="{ 'chat-msg__avatar--user': m.variant === 'user', 'chat-msg__avatar--support': m.variant === 'support' }">
                <template v-if="m.variant === 'user'">{{ m.initials }}</template>
                <IconUser v-else :size="16" />
              </span>
              <div class="chat-msg__content">
                <div class="chat-msg__meta">
                  <span class="chat-msg__name">{{ m.name }}</span>
                  <span class="chat-msg__time" v-html="m.time" />
                </div>
                <div class="chat-msg__bubble" v-html="m.text" />
              </div>
            </div>
          </template>
        </div>

        <div v-if="!ticket.isClosed" class="reply-bar">
          <button type="button" class="reply-bar__icon" aria-label="Attach image"><IconPhoto :size="16" /></button>
          <button type="button" class="reply-bar__icon" aria-label="Attach file"><IconFile :size="16" /></button>
          <input v-model="reply" type="text" class="reply-bar__input" placeholder="Reply a message" @keyup.enter="sendReply" />
          <button type="button" class="reply-bar__send" aria-label="Send" @click="sendReply"><IconSend2 :size="16" /></button>
        </div>
      </div>

      <aside class="info-card">
        <h2 class="info-card__title">Ticket Information</h2>

        <div class="info-field">
          <div class="info-field__label">Submitter Username</div>
          <div class="info-field__value">{{ ticket.submitter }}</div>
        </div>
        <div class="info-field">
          <div class="info-field__label">Company</div>
          <div class="info-field__value">{{ ticket.company }}</div>
        </div>
        <div class="info-field">
          <div class="info-field__label">Issue Category</div>
          <div class="info-field__value">{{ ticket.category }}</div>
        </div>
        <div class="info-field">
          <div class="info-field__label">Description</div>
          <div class="info-field__value info-field__value--desc">{{ ticket.description }}</div>
        </div>
        <div class="info-field">
          <div class="info-field__label">Attachments</div>
          <div v-if="ticket.attachments.length" class="attachment-links">
            <button
              v-for="a in ticket.attachments"
              :key="a.id"
              type="button"
              class="attachment-link"
              @click="openAttachment(a)"
            >
              <IconFile :size="14" />
              <span>Attachment {{ a.id }} — Click to view</span>
            </button>
          </div>
          <div v-else class="no-attachment">
            <div class="no-attachment__title">No attachments</div>
            <div class="no-attachment__desc">No files were attached to this ticket. You can add screenshots or logs when replying.</div>
          </div>
        </div>

        <button
          v-if="can('close_ticket')"
          type="button"
          class="close-ticket-btn"
          :disabled="ticket.isClosed"
          @click="openCloseModal"
        >
          {{ ticket.isClosed ? 'Ticket Closed' : 'Close Ticket' }}
        </button>
      </aside>
    </div>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="can('close_ticket') && showCloseModal" class="modal-backdrop" @mousedown.self="closeCloseModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Close Ticket</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeCloseModal">
                <IconX :size="20" />
              </button>
            </div>
            <div class="close-ticket__icon">
              <IconTicket :size="64" />
            </div>
            <p class="close-ticket__text">Are you sure you want to close this ticket? Once closed, no further updates can be made.</p>
            <div class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeCloseModal">Cancel</button>
              <button
                type="button"
                class="modal-btn modal-btn--save"
                :class="{ 'modal-btn--saved': closeTicketState === 'saved' }"
                :disabled="closeTicketState !== 'idle'"
                @click="confirmCloseTicket"
              >
                <span v-if="closeTicketState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="closeTicketState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Close Ticket</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showAttachmentModal" class="modal-backdrop" @mousedown.self="closeAttachmentModal">
          <div class="attachment-modal">
            <button type="button" class="attachment-modal__close" aria-label="Close" @click="closeAttachmentModal">
              <IconX :size="20" />
            </button>
            <img v-if="activeAttachment" :src="activeAttachment.thumb" alt="attachment preview" class="attachment-modal__img" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss" src="./TicketDetailView.scss"></style>
