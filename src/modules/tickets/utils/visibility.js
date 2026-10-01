import { ROLES } from '@/constants'

// Who raised each sample ticket (mock data). Used for both the list and the
// detail page so their company/submitter always agree.
export const sampleTicketOwners = {
  ANO31456123458765: { company: 'Acme Corporation', submitter: 'Alex Johnson' },
  ANO31456123458766: { company: 'Acme Corporation', submitter: 'James Park' },
  ANO31456123458767: { company: 'Acme Corporation', submitter: 'Alex Johnson' },
  ANO31456123458768: { company: 'Globex Industries', submitter: 'Dana Lee' },
  ANO31456123458769: { company: 'Acme Corporation', submitter: 'James Park' },
  ANO31456123458770: { company: 'Globex Industries', submitter: 'Dana Lee' },
  ANO31456123458771: { company: 'Acme Corporation', submitter: 'Alex Johnson' },
  ANO31456123458772: { company: 'Initech', submitter: 'Sam Cole' },
  ANO31456123458773: { company: 'Acme Corporation', submitter: 'James Park' },
  ANO31456123458774: { company: 'Acme Corporation', submitter: 'Alex Johnson' },
}

// PRD 6.4: Super Admin sees every ticket, Admin sees their own company's
// tickets, Member sees only the tickets they raised themselves.
export function canViewTicket(ticket, user) {
  if (!ticket) return false
  if (user?.role === ROLES.SUPER_ADMIN) return true
  if (user?.role === ROLES.ADMIN) return (user.companies ?? []).some((c) => c.name === ticket.company)
  return ticket.submitter === user?.name
}
