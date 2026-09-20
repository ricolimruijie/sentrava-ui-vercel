import {
  IconLayoutGrid,
  IconWorld,
  IconNetwork,
  IconBrowser,
  IconCode,
  IconGitPullRequest,
  IconDeviceDesktop,
  IconBuilding,
  IconKey,
  IconTicket,
} from '@tabler/icons-vue'

// Single source of truth for the sidebar's section/item grouping — also used
// by the navbar breadcrumb so clicking a section label offers the same pages.
export const navSections = [
  {
    label: 'Menu',
    items: [
      { label: 'Dashboard',         icon: IconLayoutGrid,     route: '/dashboard' },
    ],
  },
  {
    label: 'Services',
    items: [
      { label: 'Domain Inspection', icon: IconWorld,          route: '/assets/domains' },
      { label: 'Network',           icon: IconNetwork,        route: '/assets/networks' },
      { label: 'Web Application',   icon: IconBrowser,        route: '/assets/webapps' },
      { label: 'Source Code',       icon: IconCode,           route: '/assets/source-code' },
    ],
  },
  {
    label: 'Logs',
    items: [
      { label: 'CI / CD',           icon: IconGitPullRequest, route: '/scans/history' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Asset Inventory',   icon: IconDeviceDesktop,  route: '/assets' },
      { label: 'Company',           icon: IconBuilding,       route: '/companies' },
      { label: 'API Keys',          icon: IconKey,            route: '/settings/api-keys' },
      { label: 'Ticket',            icon: IconTicket,         route: '/tickets' },
    ],
  },
]
