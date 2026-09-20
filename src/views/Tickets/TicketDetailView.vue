<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconUser, IconPhoto, IconFile, IconSend2, IconArrowLeft, IconX, IconTicket, IconCheck } from '@tabler/icons-vue'

const route = useRoute()
const router = useRouter()
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

const ticket = ref({ ...ticketMap[ticketId.value] ?? ticketMap.ANO31456123458765 })
watch(ticketId, (id) => {
  const next = ticketMap[id] ?? ticketMap.ANO31456123458765
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
  <div class="ticket-detail">
    <button type="button" class="back-btn" @click="router.push('/tickets')">
      <IconArrowLeft :size="16" /> Back to Ticket List
    </button>

    <div class="ticket-layout">
      <div class="main-card">
        <div class="main-head">
          <div class="main-head__id">{{ ticket.id }} <span class="status-pill status-pill--open">{{ ticket.status }}</span></div>
          <h1 class="main-head__title">{{ ticket.title }}</h1>
          <div class="main-head__meta">Submission Date: {{ ticket.submissionDate }}</div>
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
        <div v-if="showCloseModal" class="modal-backdrop" @mousedown.self="closeCloseModal">
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

<style scoped lang="scss">
.ticket-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  height: calc(100vh - 140px);
  min-height: 0;
}

.back-btn {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: var(--glacia-ink-dim);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  &:hover { color: var(--glacia-ink); }
}

.ticket-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.75fr) 360px;
  gap: 20px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
  height: 100%;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
}

.main-card {
  background: #fff;
  border: 1px solid var(--glacia-glass-border);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  box-shadow: 0 1px 3px rgba(16,24,32,0.06);
}

.main-head {
  padding: 20px 22px 16px;
  border-bottom: 1px solid var(--glacia-glass-border);
  background: #fff;

  &__id {
    font-size: 12px;
    font-weight: 600;
    color: var(--glacia-ink-dim);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__title {
    margin: 10px 0 6px;
    font-size: 17px;
    line-height: 1.3;
    font-weight: 800;
    color: var(--glacia-ink);
  }

  &__meta {
    font-size: 12px;
    color: var(--glacia-ink-dim);
  }
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--glacia-radius-pill);
  font-size: 11px;
  font-weight: 700;

  &--open {
    background: rgba(255,37,41,0.08);
    color: #e53925;
  }
}

.chat {
  flex: 1;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
  min-height: 0;
}

.chat-system {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #9aa3b2;
  font-size: 11px;
  text-align: center;

  &__line {
    flex: 1;
    height: 1px;
    background: var(--glacia-glass-border);
  }

  &__text {
    white-space: nowrap;
    line-height: 1.4;
    small { display: block; color: #a1a8b5; margin-top: 2px; }
    :deep(b) { color: var(--glacia-ink); font-weight: 700; }
  }
}

.chat-msg {
  display: flex;
  gap: 10px;
  max-width: 68%;

  &--user {
    align-self: flex-end;
    flex-direction: row-reverse;
    text-align: right;
  }

  &--support {
    align-self: flex-start;
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 800;

    &--user {
      background: #e53925;
      color: #fff;
    }

    &--support {
      background: #4b5563;
      color: #fff;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__meta {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 11px;
    color: var(--glacia-ink-dim);

    .chat-msg--user & { justify-content: flex-end; }
  }

  &__name { font-weight: 700; color: var(--glacia-ink); }
  &__time { color: #a1a8b5; }

  &__bubble {
    padding: 12px 16px;
    border-radius: 18px;
    font-size: 13px;
    line-height: 1.5;
    color: #fff;

    .chat-msg--user & {
      background: #e53925;
      border-bottom-right-radius: 6px;
    }

    .chat-msg--support & {
      background: #111827;
      border-bottom-left-radius: 6px;
    }

    :deep(b) { font-weight: 700; }
  }
}

.reply-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid var(--glacia-glass-border);
  background: #fff;

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: #e53925;
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }

  &__input {
    flex: 1;
    height: 40px;
    padding: 0 16px;
    border-radius: 999px;
    border: none;
    background: #f1f5f9;
    outline: none;
    font-size: 13px;
  }

  &__send {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: #e53925;
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }
}

.info-card {
  background: #fff;
  border: 1px solid var(--glacia-glass-border);
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-self: start;
  height: auto;
  position: sticky;
  top: 16px;
  box-shadow: 0 1px 3px rgba(16,24,32,0.06);

  &__title {
    font-size: 16px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0 0 2px;
  }
}

.info-field {
  display: flex;
  flex-direction: column;
  gap: 5px;

  &__label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--glacia-ink-dim);
  }

  &__value {
    font-size: 13px;
    font-weight: 500;
    color: var(--glacia-ink);
    word-break: break-word;

    &--desc {
      font-weight: 400;
      color: var(--glacia-ink-dim);
      line-height: 1.6;
    }
  }
}

.attachments {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.attachment-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--glacia-glass-border);
  background: #f8fafc;
  color: var(--glacia-ink);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-family: inherit;
  transition: background 0.13s, border-color 0.13s, color 0.13s;

  &:hover {
    background: rgba(255,37,41,0.06);
    border-color: rgba(255,37,41,0.2);
    color: var(--glacia-red);
  }
}

.attachment-modal {
  position: relative;
  max-width: 90vw;
  max-height: 88vh;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 48px -12px rgba(16,24,32,0.35);
  animation: create-modal-bounce 0.28s cubic-bezier(0.34,1.56,0.64,1);

  &__close {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: rgba(15,23,42,0.75);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1;
  }

  &__img {
    display: block;
    max-width: 90vw;
    max-height: 88vh;
    width: auto;
    height: auto;
    object-fit: contain;
  }
}

.no-attachment {
  padding: 14px;
  border-radius: 12px;
  border: 1px dashed var(--glacia-glass-border);
  background: #f8fafc;
  text-align: left;

  &__title {
    font-size: 13px;
    font-weight: 700;
    color: var(--glacia-ink-dim);
  }

  &__desc {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--glacia-ink-dim);
  }
}

.attachment {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--glacia-glass-border);
  background: #f8fafc;
  aspect-ratio: 3/4;

  &__thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.close-ticket-btn {
  margin-top: 10px;
  height: 44px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #e53925, #b91c1c);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(229,57,37,0.30);

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.close-ticket__icon {
  margin: 16px 0 12px;
  color: #e53925;
  display: flex;
  justify-content: center;
}

.close-ticket__text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--glacia-ink-dim);
  text-align: center;
  margin: 0 12px 8px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
}

.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }

.create-modal {
  position: relative;
  width: 100%;
  max-width: 460px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 24px 48px -12px rgba(16,24,32,0.35);
  padding: 28px;
  animation: create-modal-bounce 0.28s cubic-bezier(0.34,1.56,0.64,1);
}

.create-modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.create-modal__title {
  font-family: 'Manrope', 'Inter', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: var(--glacia-ink);
  margin: 0;
}

.create-modal__close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: none;
  color: var(--glacia-ink-dim);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  &:hover { background: rgba(0,0,0,0.05); color: var(--glacia-ink); }
}

.create-modal__actions {
  display: flex;
  gap: 14px;
  margin-top: 20px;
}

.modal-btn {
  flex: 1;
  height: 52px;
  border-radius: 14px;
  border: none;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Manrope', 'Inter', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.13s, opacity 0.13s;

  &--cancel {
    background: rgba(220,38,38,0.06);
    color: var(--glacia-sev-critical);
    &:hover { background: rgba(220,38,38,0.12); }
  }

  &--save {
    background: linear-gradient(135deg, #e53925, #b91c1c);
    color: #fff;
    box-shadow: 0 8px 20px -6px rgba(229,57,37,0.4);
  }

  &--saved {
    background: #16a34a;
    box-shadow: 0 8px 20px -6px rgba(22,163,74,0.4);
  }

  &__spinner {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    animation: modal-btn-spin 0.7s linear infinite;
  }

  &__check {
    animation: modal-btn-pop 0.4s ease;
  }
}

@keyframes modal-btn-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes modal-btn-pop {
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); }
}

@keyframes create-modal-bounce {
  0% { opacity: 0; transform: scale(0.92) translateY(10px); }
  60% { opacity: 1; transform: scale(1.01) translateY(0); }
  100% { transform: scale(1); }
}
</style>
