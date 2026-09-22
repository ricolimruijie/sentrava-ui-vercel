import {
  IconLayoutGrid,
  IconWorld,
  IconNetwork,
  IconBrowser,
  IconCode,
  IconLogs,
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
    label: 'CI/CD',
    items: [
      { label: 'API Keys',          icon: IconKey,            route: '/settings/api-keys' },
      { label: 'Report Log',        icon: IconLogs,            route: '/scans/history' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Asset Inventory',   icon: IconDeviceDesktop,  route: '/assets' },
      { label: 'Company',           icon: IconBuilding,       route: '/companies' },
      { label: 'Ticket',            icon: IconTicket,         route: '/tickets' },
    ],
  },
]
