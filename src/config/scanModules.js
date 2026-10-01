import { defineAsyncComponent } from 'vue'
import { IconWorld, IconNetwork, IconBrowser, IconCode } from '@tabler/icons-vue'

// App-level registry of the four scan modules' "Start Scanning" entry points.
// Lives here (like the router) so feature modules, e.g. the dashboard, can open
// another module's scan modal without importing that module directly.
// Each view's modal-only mode renders just its Start Scanning modal.
export const scanModules = [
  { key: 'domain',  label: 'Domain Inspection', icon: IconWorld,   view: defineAsyncComponent(() => import('@/modules/domain-inspection/views/DomainView.vue')) },
  { key: 'network', label: 'Network',           icon: IconNetwork, view: defineAsyncComponent(() => import('@/modules/network/views/NetworkView.vue')) },
  { key: 'webapp',  label: 'Web Application',   icon: IconBrowser, view: defineAsyncComponent(() => import('@/modules/web-application/views/WebAppView.vue')) },
  { key: 'source',  label: 'Source Code',       icon: IconCode,    view: defineAsyncComponent(() => import('@/modules/source-code/views/SourceCodeView.vue')) },
]
