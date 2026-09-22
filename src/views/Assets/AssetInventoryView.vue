<script setup>
import { ref, computed, reactive, watch, nextTick, onMounted, onUnmounted } from 'vue'
import DataTable from '@/components/table/DataTable.vue'
import FilterDropdown from '@/components/filter/FilterDropdown.vue'
import SearchInput from '@/components/reusable/SearchInput.vue'
import { IconDotsVertical, IconPlus, IconWorld, IconBrowser, IconNetwork, IconCode, IconTag, IconChevronDown, IconX, IconCheck, IconEye, IconRefresh, IconTrash, IconSitemap, IconCircleDot, IconArrowsLeftRight, IconPencil, IconArrowRight, IconPalette } from '@tabler/icons-vue'

const tabs = [
  { key: 'domain', label: 'Domain', icon: IconWorld },
  { key: 'webapp', label: 'Web Application', icon: IconBrowser },
  { key: 'network', label: 'Network', icon: IconNetwork },
  { key: 'source', label: 'Source Code', icon: IconCode },
  { key: 'tags', label: 'Tags', icon: IconTag },
]
const activeTab = ref('domain')

// ── Sliding tab-bar pill — mirrors the active tab's box, animating between
// positions instead of each tab owning its own static "active" background.
const tabButtonEls = {}
const tabPillStyle = ref({ left: '0px', top: '0px', width: '0px', height: '0px' })
const tabPillReady = ref(false)
function setTabButtonRef(key, el) {
  if (el) tabButtonEls[key] = el
}
function moveTabPill() {
  const el = tabButtonEls[activeTab.value]
  if (!el) return
  tabPillStyle.value = { left: `${el.offsetLeft}px`, top: `${el.offsetTop}px`, width: `${el.offsetWidth}px`, height: `${el.offsetHeight}px` }
}
function onTabResize() { moveTabPill(); moveKindPill() }
onMounted(() => {
  nextTick(() => {
    moveTabPill()
    requestAnimationFrame(() => { tabPillReady.value = true })
  })
  window.addEventListener('resize', onTabResize)
})
onUnmounted(() => window.removeEventListener('resize', onTabResize))
watch(activeTab, () => nextTick(moveTabPill))

const assets = ref([
  { id: 1, domain: 'protergo.id', owner: 'Protergo Cyber Security Ampera', lastScanned: '23 June 2026', status: 'Completed', tags: [{ label: 'Production', colorId: 4 }] },
  { id: 2, domain: 'api.protergo.id', owner: 'Protergo Cyber Security Ampera', lastScanned: '22 June 2026', status: 'Queue', tags: [{ label: 'Production', colorId: 4 }, { label: 'Load balancer', colorId: 6 }] },
  { id: 3, domain: 'app.protergo.id', owner: 'Protergo Cyber Security Jakarta', lastScanned: '20 June 2026', status: 'Scanning', tags: [{ label: 'Internal', colorId: 10 }] },
  { id: 4, domain: 'staging.protergo.id', owner: 'Protergo Cyber Security Surabaya', lastScanned: '18 June 2026', status: 'Queue', tags: [{ label: 'Staging', colorId: 2 }] },
  { id: 5, domain: 'admin.protergo.id', owner: 'Protergo Fintech Solutions', lastScanned: '15 June 2026', status: 'Failed', tags: [{ label: 'Internal', colorId: 10 }] },
  { id: 6, domain: 'vpn.protergo.id', owner: 'Protergo Cyber Security Bandung', lastScanned: '10 June 2026', status: 'Scanning', tags: [{ label: 'VPN', colorId: 8 }] },
  { id: 7, domain: 'cdn.protergo.id', owner: 'Beta Ventures Security', lastScanned: '05 June 2026', status: 'Completed', tags: [{ label: 'CDN', colorId: 5 }] },
  { id: 8, domain: 'partners.protergo.id', owner: 'Protergo Labs', lastScanned: '01 June 2026', status: 'Queue', tags: [] },
  { id: 9, domain: 'blog.protergo.id', owner: 'Protergo Cyber Security Ampera', lastScanned: '28 May 2026', status: 'Completed', tags: [{ label: 'CDN', colorId: 5 }] },
  { id: 10, domain: 'shop.protergo.id', owner: 'Protergo Cyber Security Jakarta', lastScanned: '25 May 2026', status: 'Completed', tags: [{ label: 'Production', colorId: 4 }] },
  { id: 11, domain: 'support.protergo.id', owner: 'Protergo Cyber Security Surabaya', lastScanned: '22 May 2026', status: 'Scanning', tags: [{ label: 'Internal', colorId: 10 }] },
  { id: 12, domain: 'docs.protergo.id', owner: 'Protergo Fintech Solutions', lastScanned: '20 May 2026', status: 'Completed', tags: [] },
  { id: 13, domain: 'careers.protergo.id', owner: 'Protergo Cyber Security Bandung', lastScanned: '13 May 2026', status: 'Queue', tags: [{ label: 'Dev', colorId: 3 }] },
  { id: 14, domain: 'status.protergo.id', owner: 'Beta Ventures Security', lastScanned: '15 May 2026', status: 'Failed', tags: [{ label: 'Backup', colorId: 1 }] },
])

const webapps = ref([
  { id: 1, appName: 'Protergo Website', url: 'https://protergo.id/', owner: 'Protergo Cyber Security Ampera', basicAuth: 'Inactive', lastScanned: '03 June 2026', tags: [{ label: 'Production', colorId: 4 }], status: 'Completed' },
  { id: 2, appName: 'Protergo Admin', url: 'https://admin.protergo.id/', owner: 'Protergo Cyber Security Jakarta', basicAuth: 'Active', lastScanned: '02 June 2026', tags: [{ label: 'Internal', colorId: 10 }], status: 'Scanning' },
  { id: 3, appName: 'API Gateway', url: 'https://api.protergo.id/v1', owner: 'Protergo Cyber Security Surabaya', basicAuth: 'Active', lastScanned: '01 June 2026', tags: [{ label: 'Load balancer', colorId: 6 }], status: 'Queue' },
  { id: 4, appName: 'Staging Portal', url: 'https://staging.protergo.id/', owner: 'Protergo Fintech Solutions', basicAuth: 'Inactive', lastScanned: '30 May 2026', tags: [{ label: 'Staging', colorId: 2 }], status: 'Queue' },
  { id: 5, appName: 'Customer Dashboard', url: 'https://app.protergo.id/dashboard', owner: 'Protergo Cyber Security Bandung', basicAuth: 'Inactive', lastScanned: '28 May 2026', tags: [{ label: 'Dev', colorId: 3 }], status: 'Failed' },
  { id: 6, appName: 'Billing Service', url: 'https://billing.protergo.id/', owner: 'Beta Ventures Security', basicAuth: 'Active', lastScanned: '25 May 2026', tags: [{ label: 'Production', colorId: 4 }], status: 'Scanning' },
  { id: 7, appName: 'Partner Portal', url: 'https://partners.protergo.id/', owner: 'Protergo Labs', basicAuth: 'Inactive', lastScanned: '20 May 2026', tags: [], status: 'Completed' },
  { id: 8, appName: 'VPN Console', url: 'https://vpn.protergo.id/admin', owner: 'Protergo Cyber Security Ampera', basicAuth: 'Active', lastScanned: '18 May 2026', tags: [{ label: 'VPN', colorId: 8 }, { label: 'Internal', colorId: 10 }], status: 'Queue' },
  { id: 9, appName: 'Marketing Site', url: 'https://blog.protergo.id/', owner: 'Protergo Cyber Security Jakarta', basicAuth: 'Inactive', lastScanned: '15 May 2026', tags: [{ label: 'CDN', colorId: 5 }], status: 'Completed' },
  { id: 10, appName: 'Support Center', url: 'https://support.protergo.id/', owner: 'Protergo Cyber Security Surabaya', basicAuth: 'Inactive', lastScanned: '12 May 2026', tags: [{ label: 'Internal', colorId: 10 }], status: 'Completed' },
  { id: 11, appName: 'Docs Portal', url: 'https://docs.protergo.id/', owner: 'Protergo Fintech Solutions', basicAuth: 'Inactive', lastScanned: '10 May 2026', tags: [], status: 'Scanning' },
  { id: 12, appName: 'Careers Site', url: 'https://careers.protergo.id/', owner: 'Protergo Cyber Security Bandung', basicAuth: 'Inactive', lastScanned: '11 May 2026', tags: [{ label: 'Mail', colorId: 7 }], status: 'Queue' },
  { id: 13, appName: 'Status Page', url: 'https://status.protergo.id/', owner: 'Beta Ventures Security', basicAuth: 'Active', lastScanned: '05 May 2026', tags: [{ label: 'Backup', colorId: 1 }], status: 'Failed' },
])

const networks = ref([
  { id: 1, endpoint: '163.7.16.212', endpointType: 'IP Single', owner: 'Protergo Cyber Security Ampera', lastScanned: '22 June 2026', tags: [{ label: 'Production', colorId: 4 }], status: 'Completed' },
  { id: 2, endpoint: '172.20.0.4', endpointType: 'IP Single', owner: 'Protergo Cyber Security Ampera', lastScanned: '14 July 2026', tags: [], status: 'Completed' },
  { id: 3, endpoint: '10.20.0.0/24', endpointType: 'CIDR', owner: 'Protergo Cyber Security Jakarta', lastScanned: '18 June 2026', tags: [{ label: 'Internal', colorId: 10 }, { label: 'VPN', colorId: 8 }], status: 'Scanning' },
  { id: 4, endpoint: '192.168.1.0/24', endpointType: 'CIDR', owner: 'Protergo Labs', lastScanned: '12 June 2026', tags: [], status: 'Queue' },
  { id: 5, endpoint: '103.150.24.10', endpointType: 'IP Single', owner: 'Protergo Cyber Security Jakarta', lastScanned: '2 July 2026', tags: [{ label: 'Production', colorId: 4 }, { label: 'CDN', colorId: 5 }], status: 'Completed' },
  { id: 6, endpoint: '45.120.8.33', endpointType: 'IP Single', owner: 'Protergo Cyber Security Surabaya', lastScanned: '28 June 2026', tags: [{ label: 'Staging', colorId: 2 }], status: 'Completed' },
  { id: 7, endpoint: '198.51.100.7', endpointType: 'IP Single', owner: 'Protergo Fintech Solutions', lastScanned: '19 June 2026', tags: [], status: 'Queue' },
  { id: 8, endpoint: '203.0.113.52', endpointType: 'IP Single', owner: 'Protergo Cyber Security Bandung', lastScanned: '9 July 2026', tags: [{ label: 'Backup', colorId: 1 }], status: 'Failed' },
  { id: 9, endpoint: '172.16.5.19', endpointType: 'IP Single', owner: 'Beta Ventures Security', lastScanned: '15 June 2026', tags: [{ label: 'Internal', colorId: 10 }], status: 'Completed' },
  { id: 10, endpoint: '192.0.2.88', endpointType: 'IP Single', owner: 'Protergo Labs', lastScanned: '5 July 2026', tags: [], status: 'Scanning' },
  { id: 11, endpoint: '81.94.6.201', endpointType: 'IP Single', owner: 'Protergo Cyber Security Ampera', lastScanned: '20 June 2026', tags: [{ label: 'VPN', colorId: 8 }, { label: 'Mail', colorId: 7 }], status: 'Completed' },
  { id: 12, endpoint: '10.10.40.3', endpointType: 'IP Single', owner: 'Protergo Cyber Security Jakarta', lastScanned: '1 July 2026', tags: [], status: 'Scanning' },
  { id: 13, endpoint: '172.31.0.0/24', endpointType: 'CIDR', owner: 'Protergo Cyber Security Surabaya', lastScanned: '30 June 2026', tags: [{ label: 'Staging', colorId: 2 }], status: 'Completed' },
  { id: 14, endpoint: '10.0.5.0/24', endpointType: 'CIDR', owner: 'Protergo Fintech Solutions', lastScanned: '11 July 2026', tags: [{ label: 'Production', colorId: 4 }], status: 'Completed' },
  { id: 15, endpoint: '192.168.50.0/24', endpointType: 'CIDR', owner: 'Protergo Cyber Security Bandung', lastScanned: '27 June 2026', tags: [], status: 'Queue' },
  { id: 16, endpoint: '10.100.2.0/24', endpointType: 'CIDR', owner: 'Beta Ventures Security', lastScanned: '24 June 2026', tags: [{ label: 'Internal', colorId: 10 }, { label: 'Backup', colorId: 1 }], status: 'Failed' },
  { id: 17, endpoint: '172.20.10.0/24', endpointType: 'CIDR', owner: 'Protergo Cyber Security Ampera', lastScanned: '3 July 2026', tags: [], status: 'Scanning' },
  { id: 18, endpoint: '10.30.0.0/24', endpointType: 'CIDR', owner: 'Protergo Labs', lastScanned: '17 June 2026', tags: [{ label: 'CDN', colorId: 5 }], status: 'Completed' },
  { id: 19, endpoint: '192.168.200.0/24', endpointType: 'CIDR', owner: 'Protergo Cyber Security Jakarta', lastScanned: '29 June 2026', tags: [], status: 'Scanning' },
  { id: 20, endpoint: '10.44.0.0/24', endpointType: 'CIDR', owner: 'Protergo Fintech Solutions', lastScanned: '7 July 2026', tags: [], status: 'Queue' },
  { id: 21, endpoint: '66.42.51.9', endpointType: 'IP Single', owner: 'Protergo Cyber Security Jakarta', lastScanned: '12 July 2026', tags: [{ label: 'Production', colorId: 4 }], status: 'Completed' },
  { id: 22, endpoint: '104.21.9.140', endpointType: 'IP Single', owner: 'Beta Ventures Security', lastScanned: '8 July 2026', tags: [], status: 'Scanning' },
  { id: 23, endpoint: '172.65.0.0/24', endpointType: 'CIDR', owner: 'Protergo Cyber Security Ampera', lastScanned: '6 July 2026', tags: [{ label: 'Staging', colorId: 2 }], status: 'Completed' },
  { id: 24, endpoint: '10.60.0.0/24', endpointType: 'CIDR', owner: 'Protergo Cyber Security Bandung', lastScanned: '9 June 2026', tags: [], status: 'Queue' },
])

const networkColumnsSingle = [
  { key: '__index', label: '#', width: '32px', dim: true },
  { key: 'endpoint', label: 'Endpoint', width: '13%', mono: true },
  { key: 'endpointType', label: 'Endpoint Type', width: '15%' },
  { key: 'owner', label: 'Asset Owner', width: '21%' },
  { key: 'lastScanned', label: 'Last Scanned', width: '12%' },
  { key: 'tags', label: 'Multi-Tags', width: '14%', align: 'center' },
  { key: 'status', label: 'Scanner Status', width: '15%', align: 'center' },
  { key: 'actions', label: 'Action', width: '32px', align: 'center' },
]
const networkColumnsCidr = [
  { key: '__index', label: '#', width: '32px', dim: true },
  { key: 'endpoint', label: 'Endpoint', width: '16%', mono: true },
  { key: 'endpointType', label: 'Endpoint Type', width: '17%' },
  { key: 'owner', label: 'Asset Owner', width: '25%' },
  { key: 'lastScanned', label: 'Last Scanned', width: '14%' },
  { key: 'status', label: 'Scanner Status', width: '17%', align: 'center' },
  { key: 'actions', label: 'Action', width: '32px', align: 'center' },
]

const networkKind = ref('single') // 'single' | 'cidr'
// Sliding pill for the IP Single / CIDR toggle — same mirrored-box approach
// as the tab bars, but keeps the red active fill (not a white pill).
const kindButtonEls = {}
const kindPillStyle = ref({ left: '0px', top: '0px', width: '0px', height: '0px' })
const kindPillReady = ref(false)
function setKindButtonRef(key, el) {
  if (el) kindButtonEls[key] = el
}
function moveKindPill() {
  const el = kindButtonEls[networkKind.value]
  if (!el) return
  kindPillStyle.value = { left: `${el.offsetLeft}px`, top: `${el.offsetTop}px`, width: `${el.offsetWidth}px`, height: `${el.offsetHeight}px` }
}
watch(networkKind, () => nextTick(moveKindPill))
watch(activeTab, (val) => {
  if (val !== 'network') return
  nextTick(() => {
    moveKindPill()
    if (!kindPillReady.value) requestAnimationFrame(() => { kindPillReady.value = true })
  })
})
const networkColumns = computed(() => networkKind.value === 'cidr' ? networkColumnsCidr : networkColumnsSingle)
const filteredNetworks = computed(() => {
  const want = networkKind.value === 'single' ? 'IP Single' : 'CIDR'
  let list = networks.value.filter((n) => n.endpointType === want)
  if (ownerFilter.value) list = list.filter((n) => n.owner === ownerFilter.value)
  if (statusFilter.value) list = list.filter((n) => n.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((n) => n.endpoint.toLowerCase().includes(q) || n.owner.toLowerCase().includes(q))
  return list
})

const sourceCodes = ref([
  { id: 1, repoOwner: 'protergo-ampera', repoName: 'protergo-web', gitProvider: 'GitHub', visibility: 'Public', owner: 'Protergo Cyber Security Ampera', lastScanned: '20 June 2026', tags: [{ label: 'Production', colorId: 4 }], status: 'Completed' },
  { id: 2, repoOwner: 'protergo', repoName: 'protergo-api', gitProvider: 'GitHub', visibility: 'Public', owner: 'Protergo Cyber Security Ampera', lastScanned: '18 June 2026', tags: [], status: 'Completed' },
  { id: 3, repoOwner: 'protergo-jkt', repoName: 'billing-service', gitProvider: 'GitHub', visibility: 'Private', owner: 'Protergo Cyber Security Jakarta', lastScanned: '15 June 2026', tags: [{ label: 'Internal', colorId: 10 }], status: 'Scanning' },
  { id: 4, repoOwner: 'protergo-sby', repoName: 'customer-dashboard', gitProvider: 'GitHub', visibility: 'Private', owner: 'Protergo Cyber Security Surabaya', lastScanned: '02 June 2026', tags: [], status: 'Queue' },
  { id: 5, repoOwner: 'protergo-fintech', repoName: 'mobile-app-ios', gitProvider: 'GitHub', visibility: 'Public', owner: 'Protergo Fintech Solutions', lastScanned: '10 June 2026', tags: [{ label: 'Production', colorId: 4 }], status: 'Completed' },
  { id: 6, repoOwner: 'protergo-mobile', repoName: 'mobile-app-android', gitProvider: 'GitHub', visibility: 'Public', owner: 'Protergo Fintech Solutions', lastScanned: '10 June 2026', tags: [], status: 'Failed' },
  { id: 7, repoOwner: 'protergo-bdg', repoName: 'internal-tools', gitProvider: 'GitHub', visibility: 'Private', owner: 'Protergo Cyber Security Bandung', lastScanned: '05 June 2026', tags: [], status: 'Queue' },
  { id: 8, repoOwner: 'beta-ventures', repoName: 'auth-service', gitProvider: 'GitHub', visibility: 'Private', owner: 'Beta Ventures Security', lastScanned: '01 June 2026', tags: [{ label: 'Internal', colorId: 10 }], status: 'Completed' },
  { id: 9, repoOwner: 'protergo-labs', repoName: 'payment-gateway', gitProvider: 'GitHub', visibility: 'Private', owner: 'Protergo Labs', lastScanned: '28 May 2026', tags: [], status: 'Completed' },
  { id: 10, repoOwner: 'protergo-ampera', repoName: 'notification-service', gitProvider: 'GitHub', visibility: 'Public', owner: 'Protergo Cyber Security Ampera', lastScanned: '25 May 2026', tags: [], status: 'Scanning' },
  { id: 11, repoOwner: 'protergo-jkt', repoName: 'analytics-pipeline', gitProvider: 'GitHub', visibility: 'Public', owner: 'Protergo Cyber Security Jakarta', lastScanned: '20 May 2026', tags: [{ label: 'Staging', colorId: 2 }], status: 'Completed' },
  { id: 12, repoOwner: 'protergo-sby', repoName: 'admin-portal', gitProvider: 'GitHub', visibility: 'Private', owner: 'Protergo Cyber Security Surabaya', lastScanned: '18 May 2026', tags: [], status: 'Queue' },
  { id: 13, repoOwner: 'protergo-fintech', repoName: 'legacy-crm', gitProvider: 'GitHub', visibility: 'Private', owner: 'Protergo Fintech Solutions', lastScanned: '10 May 2026', tags: [], status: 'Scanning' },
])
const sourceCodeColumns = [
  { key: '__index', label: '#', width: '32px', dim: true },
  { key: 'repoOwner', label: 'Repository', width: '16%' },
  { key: 'gitProvider', label: 'Git Provider', width: '12%' },
  { key: 'owner', label: 'Asset Owner', width: '21%' },
  { key: 'lastScanned', label: 'Last Scanned', width: '13%' },
  { key: 'tags', label: 'Multi-Tags', width: '14%', align: 'center' },
  { key: 'status', label: 'Scanner Status', width: '14%', align: 'center' },
  { key: 'actions', label: 'Action', width: '32px', align: 'center' },
]
const filteredSourceCodes = computed(() => {
  let list = sourceCodes.value
  if (ownerFilter.value) list = list.filter((s) => s.owner === ownerFilter.value)
  if (statusFilter.value) list = list.filter((s) => s.status === statusFilter.value)
  if (gitProviderFilter.value) list = list.filter((s) => s.gitProvider === gitProviderFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((s) => s.repoName.toLowerCase().includes(q) || s.repoOwner.toLowerCase().includes(q) || s.owner.toLowerCase().includes(q))
  return list
})

const totalLabels = {
  domain: 'Total Domain Registered',
  webapp: 'Total Web Application Registered',
  network: 'Total Network Registered',
  source: 'Total Source Code Registered',
  tags: 'Total Tags Registered',
}
const totalLabel = computed(() => totalLabels[activeTab.value] ?? 'Total Registered')
const totalCount = computed(() => {
  if (activeTab.value === 'domain') return filtered.value.length
  if (activeTab.value === 'webapp') return filteredWebapps.value.length
  if (activeTab.value === 'network') return filteredNetworks.value.length
  if (activeTab.value === 'source') return filteredSourceCodes.value.length
  if (activeTab.value === 'tags') return filteredTags.value.length
  return 0
})

// ── Register Network modal — same pattern as Register Domain/Web Application
const showRegisterNetworkModal = ref(false)
const regNetOwner = ref(null)
const regNetType = ref(null) // 'single' | 'range'
const regNetField = ref(null)
const regNetState = ref('idle') // 'idle' | 'loading' | 'saved'
const regNetIp = ref('')
const regNetRange = ref('')
// Set once Proceed is clicked while the IP fields are still empty — only
// then do the inline "required" errors show, matching the reference (the
// button itself stays enabled once Owner + Type are picked; it's the IP
// fields that block the actual submit).
const regNetAttempted = ref(false)
const ipTypeOptions = [
  { value: 'single', label: 'IP Single' },
  { value: 'range',  label: 'IP Range' },
]
// Owner + Type alone gate whether Proceed is clickable at all.
const canRegisterNetwork = computed(() => !!regNetOwner.value && !!regNetType.value)
const isValidIpAddress = (v) => /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(v.trim())
const isValidCidrRange = (v) => /^\d{1,2}$/.test(v.trim()) && Number(v.trim()) >= 0 && Number(v.trim()) <= 32
const regNetIpError = computed(() => {
  if (!regNetAttempted.value) return ''
  if (!regNetIp.value.trim()) return 'IP Address is required'
  if (!isValidIpAddress(regNetIp.value)) return 'Enter a valid IP address, e.g. 1.xx.34.82'
  return ''
})
const regNetRangeError = computed(() => {
  if (!regNetAttempted.value || regNetType.value !== 'range') return ''
  if (!regNetRange.value.trim()) return 'Range is required'
  if (!isValidCidrRange(regNetRange.value)) return 'Enter a valid range, e.g. 24'
  return ''
})

function openRegisterNetworkModal() {
  regNetOwner.value = null
  regNetType.value = null
  regNetField.value = null
  regNetState.value = 'idle'
  regNetIp.value = ''
  regNetRange.value = ''
  regNetAttempted.value = false
  showRegisterNetworkModal.value = true
}
function closeRegisterNetworkModal() {
  showRegisterNetworkModal.value = false
  regNetField.value = null
}
function toggleRegNetField(key) {
  regNetField.value = regNetField.value === key ? null : key
}
function selectRegNetOwner(value) {
  regNetOwner.value = value
  regNetField.value = null
}
function selectRegNetType(value) {
  regNetType.value = value
  regNetField.value = null
  regNetIp.value = ''
  regNetRange.value = ''
  regNetAttempted.value = false
}
function onRegNetIpInput(e) {
  const cleaned = e.target.value.replace(/[^0-9.]/g, '')
  regNetIp.value = cleaned
  if (e.target.value !== cleaned) e.target.value = cleaned
}
function onRegNetRangeInput(e) {
  const cleaned = e.target.value.replace(/[^0-9]/g, '')
  regNetRange.value = cleaned
  if (e.target.value !== cleaned) e.target.value = cleaned
}
function clearRegNetType() {
  regNetType.value = null
  regNetField.value = null
  regNetIp.value = ''
  regNetRange.value = ''
  regNetAttempted.value = false
}
function submitRegisterNetwork() {
  if (!canRegisterNetwork.value || regNetState.value !== 'idle') return
  regNetAttempted.value = true
  if (regNetIpError.value || regNetRangeError.value) return
  regNetState.value = 'loading'
  setTimeout(() => {
    const newId = networks.value.length + 1
    const endpoint = regNetType.value === 'single' ? regNetIp.value.trim() : `${regNetIp.value.trim()}/${regNetRange.value.trim()}`
    networks.value.unshift({
      id: newId,
      endpoint,
      endpointType: regNetType.value === 'single' ? 'IP Single' : 'CIDR',
      owner: regNetOwner.value,
      lastScanned: '-',
      tags: [],
      status: 'Scanning',
    })
    regNetState.value = 'saved'
    setTimeout(closeRegisterNetworkModal, 700)
  }, 500)
}

// ── Register Repository modal — same pattern as Register Domain/Web Application/Network
const showRegisterSourceModal = ref(false)
const regSrcOwner = ref(null)
const regSrcProvider = ref(null)
const regSrcVisibility = ref(null)
const regSrcField = ref(null)
const regSrcToken = ref('')
const regSrcRepoUrl = ref('')
const regSrcState = ref('idle') // 'idle' | 'loading' | 'saved'
const gitProviderOptions = [
  { value: 'github', label: 'GitHub' },
]
const repoVisibilityOptions = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]
const regSrcRepoUrlError = computed(() => {
  const u = regSrcRepoUrl.value.trim()
  if (!u) return ''
  const ok = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}\/[\w.-]+\/[\w.-]+\/?$/i.test(u)
  if (!ok) return 'Enter a valid repository URL, e.g. github.com/xxxxx/xxxxx-repo'
  return ''
})
const canRegisterSource = computed(() =>
  !!regSrcOwner.value && !!regSrcProvider.value && !!regSrcVisibility.value &&
  !!regSrcRepoUrl.value.trim() && !regSrcRepoUrlError.value &&
  (regSrcVisibility.value === 'public' || !!regSrcToken.value.trim())
)
function openRegisterSourceModal() {
  regSrcOwner.value = null
  regSrcProvider.value = null
  regSrcVisibility.value = null
  regSrcField.value = null
  regSrcToken.value = ''
  regSrcRepoUrl.value = ''
  regSrcState.value = 'idle'
  showRegisterSourceModal.value = true
}
function closeRegisterSourceModal() {
  showRegisterSourceModal.value = false
  regSrcField.value = null
}
function toggleRegSrcField(key) {
  regSrcField.value = regSrcField.value === key ? null : key
}
function selectRegSrcOwner(value) {
  regSrcOwner.value = value
  regSrcField.value = null
}
function selectRegSrcProvider(value) {
  regSrcProvider.value = value
  regSrcField.value = null
}
function selectRegSrcVisibility(value) {
  regSrcVisibility.value = value
  regSrcField.value = null
  if (value === 'public') regSrcToken.value = ''
}
function clearRegSrcVisibility() {
  regSrcVisibility.value = null
  regSrcField.value = null
}
function submitRegisterSource() {
  if (!canRegisterSource.value || regSrcState.value !== 'idle') return
  regSrcState.value = 'loading'
  setTimeout(() => {
    const newId = sourceCodes.value.length + 1
    const url = regSrcRepoUrl.value.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
    const parts = url.split('/').filter(Boolean)
    const repoName = parts[parts.length - 1] || url
    const repoOwner = parts[parts.length - 2] || ''
    sourceCodes.value.unshift({
      id: newId,
      repoOwner,
      repoName,
      gitProvider: gitProviderOptions.find((o) => o.value === regSrcProvider.value)?.label ?? '',
      visibility: repoVisibilityOptions.find((o) => o.value === regSrcVisibility.value)?.label ?? '',
      owner: regSrcOwner.value,
      lastScanned: '-',
      tags: [],
      status: 'Scanning',
    })
    regSrcState.value = 'saved'
    setTimeout(closeRegisterSourceModal, 700)
  }, 500)
}

const columns = [
  { key: '__index', label: '#', width: '32px', dim: true },
  { key: 'domain', label: 'Domain', width: '28%' },
  { key: 'owner', label: 'Asset Owner', width: '26%' },
  { key: 'lastScanned', label: 'Last Scanned', width: '18%' },
  { key: 'status', label: 'Scanner Status', width: '16%', align: 'center' },
  { key: 'actions', label: 'Action', width: '32px', align: 'center' },
]

const webappColumns = [
  { key: '__index', label: '#', width: '32px', dim: true },
  { key: 'appName', label: 'App Name', width: '16%' },
  { key: 'owner', label: 'Asset Owner', width: '20%' },
  { key: 'lastScanned', label: 'Last Scanned', width: '15%' },
  { key: 'tags', label: 'Multi-Tags', width: '17%', align: 'center' },
  { key: 'status', label: 'Scanner Status', width: '15%', align: 'center' },
  { key: 'actions', label: 'Action', width: '32px', align: 'center' },
]

const ownerOptions = [
  { value: 'Protergo Cyber Security Ampera', label: 'Protergo Cyber Security Ampera' },
  { value: 'Protergo Cyber Security Jakarta', label: 'Protergo Cyber Security Jakarta' },
  { value: 'Protergo Cyber Security Surabaya', label: 'Protergo Cyber Security Surabaya' },
  { value: 'Protergo Fintech Solutions', label: 'Protergo Fintech Solutions' },
  { value: 'Protergo Cyber Security Bandung', label: 'Protergo Cyber Security Bandung' },
  { value: 'Beta Ventures Security', label: 'Beta Ventures Security' },
  { value: 'Protergo Labs', label: 'Protergo Labs' },
]
const statusOptions = [
  { value: 'Queue', label: 'Queue' },
  { value: 'Scanning', label: 'Scanning' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Waiting', label: 'Waiting' },
]
const tagsData = ref([
  { id: 1, name: 'Production', color: '#2f9e52', bg: '#e8f5e9', usedBy: 3 },
  { id: 2, name: 'Load balancer', color: '#1197c2', bg: '#dff3fc', usedBy: 1 },
  { id: 3, name: 'Internal', color: '#5c6470', bg: '#eceef0', usedBy: 2 },
  { id: 4, name: 'Staging', color: '#a67c00', bg: '#fcf3d6', usedBy: 1 },
  { id: 5, name: 'Dev', color: '#6b8e00', bg: '#f1f5d6', usedBy: 1 },
  { id: 6, name: 'Mail', color: '#5c6bc0', bg: '#e6e9fc', usedBy: 2 },
  { id: 7, name: 'Backup', color: '#e8590c', bg: '#fdeee0', usedBy: 1 },
  { id: 8, name: 'VPN', color: '#c2255c', bg: '#fbe6f0', usedBy: 1 },
  { id: 9, name: 'CDN', color: '#12967d', bg: '#def7f0', usedBy: 1 },
])
const tagsColumns = [
  { key: '__index', label: '#', width: '32px', dim: true },
  { key: 'name', label: 'Tag Name', width: '28%' },
  { key: 'usedBy', label: 'Used By', width: '24%', align: 'center' },
  { key: 'actions', label: 'Action', width: '32px', align: 'center' },
]
const filteredTags = computed(() => tagsData.value)
function stripTagLabel(row, label) {
  if (row.tags) row.tags = row.tags.filter((t) => t.label !== label)
}
function editTag(row) { openTagDetail(row) }
function deleteTag(row) {
  webapps.value.forEach((w) => stripTagLabel(w, row.name))
  networks.value.forEach((n) => stripTagLabel(n, row.name))
  sourceCodes.value.forEach((s) => stripTagLabel(s, row.name))
  Object.values(networkHostsStore).flat().forEach((h) => stripTagLabel(h, row.name))
  createdTags.value = createdTags.value.filter((t) => t.label !== row.name)
  tagsData.value = tagsData.value.filter((t) => t.id !== row.id)
}
function addTagEntry() { console.info('Add tag') }
const showTagDetailModal = ref(false)
const selectedTag = ref(null)
const tagMenuOpen = ref(false)
const tagRenaming = ref(false)
const tagRenameText = ref('')
const tagColorPickerOpen = ref(false)
function openTagDetail(tag) {
  selectedTag.value = tag
  tagMenuOpen.value = false
  tagRenaming.value = false
  tagColorPickerOpen.value = false
  showTagDetailModal.value = true
}
function closeTagDetail() {
  showTagDetailModal.value = false
  selectedTag.value = null
  tagMenuOpen.value = false
  tagRenaming.value = false
  tagColorPickerOpen.value = false
}
const tagDetailUsage = computed(() => {
  if (!selectedTag.value) return []
  const label = selectedTag.value.name
  const rows = []
  assets.value.forEach((a) => { if ((a.tags || []).some((t) => t.label === label)) rows.push({ name: a.domain, type: 'Domain' }) })
  webapps.value.forEach((w) => { if ((w.tags || []).some((t) => t.label === label)) rows.push({ name: w.appName, type: 'Web Application' }) })
  networks.value.forEach((n) => { if ((n.tags || []).some((t) => t.label === label)) rows.push({ name: n.endpoint, type: 'Network' }) })
  sourceCodes.value.forEach((s) => { if ((s.tags || []).some((t) => t.label === label)) rows.push({ name: s.repoName, type: 'Source Code' }) })
  Object.values(networkHostsStore).flat().forEach((h) => { if ((h.tags || []).some((t) => t.label === label)) rows.push({ name: h.endpoint, type: 'Network Host' }) })
  return rows
})
function typeIcon(type) {
  if (type === 'Domain') return IconWorld
  if (type === 'Source Code') return IconCode
  if (type === 'Web Application') return IconBrowser
  return IconSitemap
}
function typeIconClass(type) {
  if (type === 'Domain') return 'tag-asset__icon--domain'
  if (type === 'Source Code') return 'tag-asset__icon--code'
  if (type === 'Web Application') return 'tag-asset__icon--web'
  return 'tag-asset__icon--net'
}
function startRenameTag() {
  if (!selectedTag.value) return
  tagRenameText.value = selectedTag.value.name
  tagRenaming.value = true
  tagMenuOpen.value = false
}
function renameTagEverywhere(oldLabel, newLabel) {
  const rename = (arr) => arr.forEach((t) => { if (t.label === oldLabel) t.label = newLabel })
  webapps.value.forEach((w) => rename(w.tags || []))
  networks.value.forEach((n) => rename(n.tags || []))
  sourceCodes.value.forEach((s) => rename(s.tags || []))
  Object.values(networkHostsStore).flat().forEach((h) => rename(h.tags || []))
  rename(createdTags.value)
}
function commitRenameTag() {
  if (!selectedTag.value) return
  const newLabel = tagRenameText.value.trim()
  const oldLabel = selectedTag.value.name
  if (newLabel && newLabel !== oldLabel && !tagsData.value.some((t) => t.name === newLabel)) {
    renameTagEverywhere(oldLabel, newLabel)
    selectedTag.value.name = newLabel
  }
  tagRenaming.value = false
}
function toggleTagColorPicker() {
  tagColorPickerOpen.value = !tagColorPickerOpen.value
  tagMenuOpen.value = false
}
function changeTagColor(colorId) {
  if (!selectedTag.value) return
  const c = tagColors[colorId]
  const oldLabel = selectedTag.value.name
  const restyle = (arr) => arr.forEach((t) => { if (t.label === oldLabel) t.colorId = colorId })
  webapps.value.forEach((w) => restyle(w.tags || []))
  networks.value.forEach((n) => restyle(n.tags || []))
  sourceCodes.value.forEach((s) => restyle(s.tags || []))
  Object.values(networkHostsStore).flat().forEach((h) => restyle(h.tags || []))
  restyle(createdTags.value)
  selectedTag.value.color = c.fg
  selectedTag.value.bg = c.bg
  tagColorPickerOpen.value = false
}
function deleteSelectedTag() {
  if (!selectedTag.value) return
  deleteTag(selectedTag.value)
  closeTagDetail()
}
const appNameOptions = [{ value: 'Protergo Website', label: 'Protergo Website' }]
const basicAuthOptions = [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]
const gitProviderFilterOptions = [{ value: 'GitHub', label: 'GitHub' }]
const ownerFilter = ref(null)
const statusFilter = ref(null)
const appNameFilter = ref(null)
const basicAuthFilter = ref(null)
const multiTagFilter = ref(null)
const gitProviderFilter = ref(null)
const search = ref('')

const filtered = computed(() => {
  let list = assets.value
  if (ownerFilter.value) list = list.filter((a) => a.owner === ownerFilter.value)
  if (statusFilter.value) list = list.filter((a) => a.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((a) => a.domain.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q))
  return list
})

const filteredWebapps = computed(() => {
  let list = webapps.value
  if (basicAuthFilter.value) list = list.filter((a) => a.basicAuth === basicAuthFilter.value)
  if (statusFilter.value) list = list.filter((a) => a.status === statusFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((a) => a.appName.toLowerCase().includes(q) || a.url.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q))
  return list
})

const openMenuId = ref(null)
const menuPos = ref({ top: 0, left: 0 })
function toggleMenu(row, e) {
  if (openMenuId.value === row.id) { openMenuId.value = null; return }
  const rect = e.currentTarget.getBoundingClientRect()
  menuPos.value = { top: rect.bottom + 6, left: rect.right - 160 }
  openMenuId.value = row.id
}
function closeMenu() { openMenuId.value = null }
// Single source for the row behind the open action menu — avoids fragile
// `.value.find(...)` chains inside template expressions.
const openMenuRow = computed(() => {
  if (openMenuId.value == null) return null
  const list = activeTab.value === 'webapp' ? webapps.value : activeTab.value === 'network' ? networks.value : activeTab.value === 'source' ? sourceCodes.value : assets.value
  return list.find((a) => a.id === openMenuId.value) ?? null
})
function manageRowTags(row, e) {
  if (!row) return
  closeMenu()
  openManageTagsModal(row)
}

// ── Manage Tags modal (action menu) ─────────────────────────────────────
const showManageTagsModal = ref(false)
const manageTagsRow = ref(null)
const modalPickerOpen = ref(false)
function openManageTagsModal(row) {
  manageTagsRow.value = row
  tagQuery.value = ''
  modalPickerOpen.value = false
  showManageTagsModal.value = true
}
function closeManageTagsModal() {
  showManageTagsModal.value = false
  manageTagsRow.value = null
}
const modalTagManager = computed(() => {
  const row = manageTagsRow.value
  if (!row) return null
  const tags = row.tags || []
  const vocab = new Map()
  Object.values(ips37ByDomain).flat().forEach((x) => x.tags.forEach((t) => vocab.set(t.label, t.colorId)))
  webapps.value.forEach((a) => (a.tags || []).forEach((t) => vocab.set(t.label, t.colorId)))
  networks.value.forEach((a) => (a.tags || []).forEach((t) => vocab.set(t.label, t.colorId)))
  sourceCodes.value.forEach((a) => (a.tags || []).forEach((t) => vocab.set(t.label, t.colorId)))
  createdTags.value.forEach((t) => vocab.set(t.label, t.colorId))
  const used = tags.map((t) => t.label)
  const available = [...vocab.entries()]
  const addTag = (label0, colorId0) => {
    const label = (label0 !== undefined ? label0 : tagQuery.value).trim()
    const colorId = colorId0 !== undefined ? colorId0 : tagNewColor.value
    if (!label || used.includes(label)) return
    const entry = { label, colorId }
    createdTags.value.push(entry)
    row.tags = [...tags, entry]
    tagQuery.value = ''
  }
  const removeTag = (label) => {
    row.tags = tags.filter((t) => t.label !== label)
  }
  return {
    tags: tags.map((t) => ({ label: t.label, bg: tagColors[t.colorId].bg, fg: tagColors[t.colorId].fg })),
    hasTags: tags.length > 0,
    availableTags: available.map(([label, colorId]) => {
      const registered = used.includes(label)
      return {
        label,
        bg: tagColors[colorId].bg,
        fg: tagColors[colorId].fg,
        registered,
        toggle: () => { registered ? removeTag(label) : addTag(label, colorId) },
      }
    }),
    colorSwatches: tagColors.map((c, i) => ({
      swatch: c.swatch,
      ring: tagNewColor.value === i ? 'var(--ice-600)' : 'transparent',
      select: () => { tagNewColor.value = i; modalPickerOpen.value = false },
    })),
    currentColorSwatch: tagColors[tagNewColor.value].swatch,
    commitAdd: () => addTag(),
  }
})
function handleMenuOutside(e) {
  if (!e.target.closest('.action-menu, .action-btn')) closeMenu()
  if (!e.target.closest('.tag-popover, .tag-add')) closeTagPopover()
  if (!e.target.closest('.tag-menu, .tag-head__more')) tagMenuOpen.value = false
}

// ── Multi-Tags picker popover (webapp + network + network-host + source tables) ───
const tagPopoverFor = ref(null) // row id
// Row ids aren't unique across tables (webapp id 1 and network id 1 both
// exist), so remember which list the popover was opened from too.
const tagPopoverSource = ref(null) // 'webapp' | 'network' | 'networkHost' | 'source'
const tagPopoverPos = ref({ top: 0, left: 0 })
const tagQuery = ref('')
const tagNewColor = ref(4)
const createdTags = ref([])
const tagVocab = computed(() => {
  const m = new Map()
  Object.values(ips37ByDomain).flat().forEach((x) => x.tags.forEach((t) => m.set(t.label, t.colorId)))
  assets.value.forEach((a) => (a.tags || []).forEach((t) => m.set(t.label, t.colorId)))
  webapps.value.forEach((a) => (a.tags || []).forEach((t) => m.set(t.label, t.colorId)))
  networks.value.forEach((a) => (a.tags || []).forEach((t) => m.set(t.label, t.colorId)))
  Object.values(networkHostsStore).flat().forEach((h) => (h.tags || []).forEach((t) => m.set(t.label, t.colorId)))
  sourceCodes.value.forEach((s) => (s.tags || []).forEach((t) => m.set(t.label, t.colorId)))
  createdTags.value.forEach((t) => m.set(t.label, t.colorId))
  return [...m.entries()].map(([label, colorId]) => ({ label, colorId, bg: tagColors[colorId].bg, fg: tagColors[colorId].fg }))
})
const filteredTagVocab = computed(() => {
  const q = tagQuery.value.trim().toLowerCase()
  if (!q) return tagVocab.value
  return tagVocab.value.filter((t) => t.label.toLowerCase().includes(q))
})
const tagPopoverRow = computed(() => {
  if (tagPopoverSource.value === 'networkHost') return networkDetailHosts.value.find((h) => h.id === tagPopoverFor.value) || null
  if (tagPopoverSource.value === 'source') return sourceCodes.value.find((a) => a.id === tagPopoverFor.value) || null
  const list = tagPopoverSource.value === 'network' ? networks.value : webapps.value
  return list.find((a) => a.id === tagPopoverFor.value) || null
})
function openTagPopover(row, e, source) {
  tagPopoverFor.value = row.id
  tagPopoverSource.value = source || (activeTab.value === 'network' ? 'network' : 'webapp')
  tagQuery.value = ''
  const rect = e.currentTarget.getBoundingClientRect()
  tagPopoverPos.value = { top: rect.bottom + 6, left: Math.max(8, Math.min(rect.left, window.innerWidth - 288)) }
}
function closeTagPopover() { tagPopoverFor.value = null }
function pickExistingTag(row, tag) {
  if (!row.tags.some((t) => t.label === tag.label)) row.tags.push({ label: tag.label, colorId: tag.colorId })
}
function createRowTag(row) {
  const label = tagQuery.value.trim()
  if (!label || row.tags.some((t) => t.label === label)) return
  const entry = { label, colorId: tagNewColor.value }
  createdTags.value.push(entry)
  row.tags.push(entry)
  tagQuery.value = ''
}
function removeRowTag(row, label) {
  row.tags = row.tags.filter((t) => t.label !== label)
}
onMounted(() => document.addEventListener('mousedown', handleMenuOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleMenuOutside))

// ── Domain detail (37a) ───────────────────────────────────────────────────
const subdomains37List = [
  { name: 'api.protergo.io', dot: 'var(--success)' }, { name: 'admin.protergo.io', dot: 'var(--success)' },
  { name: 'staging.protergo.io', dot: 'var(--gray-300)' }, { name: 'dev.protergo.io', dot: 'var(--gray-300)' },
  { name: 'mail.protergo.io', dot: 'var(--success)' }, { name: 'vpn.protergo.io', dot: 'var(--success)' },
  { name: 'cdn.protergo.io', dot: 'var(--gray-300)' }, { name: 'portal.protergo.io', dot: 'var(--success)' },
  { name: 'shop.protergo.io', dot: 'var(--success)' }, { name: 'blog.protergo.io', dot: 'var(--gray-300)' },
  { name: 'docs.protergo.io', dot: 'var(--gray-300)' }, { name: 'support.protergo.io', dot: 'var(--success)' },
  { name: 'ftp.protergo.io', dot: 'var(--gray-300)' }, { name: 'db.protergo.io', dot: 'var(--success)' },
  { name: 'monitor.protergo.io', dot: 'var(--gray-300)' }, { name: 'auth.protergo.io', dot: 'var(--success)' },
]
const ips37ByDomain = {
  'api.protergo.io': [
    { address: '103.150.24.10', tags: [{ label: 'Production', colorId: 4 }, { label: 'Backup', colorId: 1 }, { label: 'CDN', colorId: 5 }, { label: 'Load balancer', colorId: 6 }, { label: 'Staging', colorId: 2 }, { label: 'Internal', colorId: 10 }] },
    { address: '103.150.24.11', tags: [{ label: 'Load balancer', colorId: 6 }, { label: 'Production', colorId: 4 }] },
    { address: '103.150.24.12', tags: [{ label: 'Production', colorId: 4 }] },
    { address: '103.150.24.13', tags: [{ label: 'Staging', colorId: 2 }, { label: 'Dev', colorId: 3 }] },
    { address: '103.150.24.14', tags: [{ label: 'CDN', colorId: 5 }] },
    { address: '103.150.24.15', tags: [{ label: 'Backup', colorId: 1 }, { label: 'Internal', colorId: 10 }] },
    { address: '103.150.24.16', tags: [{ label: 'VPN', colorId: 8 }] },
    { address: '103.150.24.17', tags: [{ label: 'Mail', colorId: 7 }] },
    { address: '103.150.24.18', tags: [{ label: 'Production', colorId: 4 }, { label: 'CDN', colorId: 5 }] },
    { address: '103.150.24.19', tags: [{ label: 'Dev', colorId: 3 }] },
  ],
  'admin.protergo.io': [{ address: '103.150.24.12', tags: [{ label: 'Internal', colorId: 10 }] }],
  'staging.protergo.io': [{ address: '103.150.24.20', tags: [{ label: 'Staging', colorId: 2 }] }],
  'dev.protergo.io': [{ address: '103.150.24.21', tags: [{ label: 'Dev', colorId: 3 }] }],
  'mail.protergo.io': [{ address: '103.150.24.30', tags: [{ label: 'Mail', colorId: 7 }] }, { address: '103.150.24.31', tags: [{ label: 'Mail', colorId: 7 }, { label: 'Backup', colorId: 1 }] }],
  'vpn.protergo.io': [{ address: '103.150.24.40', tags: [{ label: 'Internal', colorId: 10 }, { label: 'VPN', colorId: 8 }] }],
  'cdn.protergo.io': [{ address: '103.150.24.41', tags: [{ label: 'CDN', colorId: 5 }] }],
  'portal.protergo.io': [{ address: '103.150.24.42', tags: [{ label: 'Production', colorId: 4 }] }],
  'shop.protergo.io': [{ address: '103.150.24.50', tags: [{ label: 'CDN', colorId: 5 }, { label: 'Production', colorId: 4 }] }],
  'blog.protergo.io': [{ address: '103.150.24.51', tags: [{ label: 'CDN', colorId: 5 }] }],
  'docs.protergo.io': [{ address: '103.150.24.52', tags: [{ label: 'Internal', colorId: 10 }] }],
  'support.protergo.io': [{ address: '103.150.24.53', tags: [{ label: 'Production', colorId: 4 }, { label: 'Internal', colorId: 10 }] }],
  'ftp.protergo.io': [{ address: '103.150.24.54', tags: [{ label: 'Backup', colorId: 1 }] }],
  'db.protergo.io': [{ address: '103.150.24.55', tags: [{ label: 'Internal', colorId: 10 }, { label: 'Production', colorId: 4 }] }],
  'monitor.protergo.io': [{ address: '103.150.24.56', tags: [{ label: 'Internal', colorId: 10 }] }],
  'auth.protergo.io': [{ address: '103.150.24.57', tags: [{ label: 'Production', colorId: 4 }, { label: 'VPN', colorId: 8 }] }],
}
const tagColors = [
  { swatch: '#F26D6D', bg: '#FDE8E8', fg: '#E03131' }, { swatch: '#F2994A', bg: '#FDEEE0', fg: '#E8590C' },
  { swatch: '#F2C94C', bg: '#FCF3D6', fg: '#A67C00' }, { swatch: '#A8BD3A', bg: '#F1F5D6', fg: '#6B8E00' },
  { swatch: '#4CAF6D', bg: '#E3F5E8', fg: '#2F9E52' }, { swatch: '#3DBFA8', bg: '#DEF7F0', fg: '#12967D' },
  { swatch: '#3DC6F2', bg: '#DFF3FC', fg: '#1197C2' }, { swatch: '#7C93F0', bg: '#E6E9FC', fg: '#5C6BC0' },
  { swatch: '#E896BB', bg: '#FBE6F0', fg: '#C2255C' }, { swatch: '#B69AE8', bg: '#F0E6FB', fg: '#7C3FC4' },
  { swatch: '#9AA5B1', bg: '#ECEEF0', fg: '#5C6470' },
]
const detailState = reactive({
  activeSubdomain37: 'api.protergo.io',
  ips37TagsOverride: {},
  ips37ConfigFor: null,
  ips37SubTab: {},
  webappTagsOverride: {},
  sourceTagsOverride: {},
  ips37NewTagText: '',
  ips37NewTagColor: 0,
  ips37ColorPickerOpen: false,
  netHostSubTab: {},
  netHostNewTagText: '',
  netHostNewTagColor: 0,
  netHostColorPickerOpen: false,
})
const ports37ByIp = {
  '103.150.24.10': [
    { port: '443', protocol: 'HTTPS', service: 'nginx', technology: 'nginx 1.25' },
    { port: '22', protocol: 'SSH', service: 'sshd', technology: 'OpenSSH 9.3' },
  ],
  '103.150.24.11': [
    { port: '443', protocol: 'HTTPS', service: 'nginx', technology: 'nginx 1.25' },
    { port: '80', protocol: 'HTTP', service: 'nginx', technology: 'nginx 1.25' },
  ],
  '103.150.24.12': [
    { port: '443', protocol: 'HTTPS', service: 'nginx', technology: 'nginx 1.25' },
  ],
  '103.150.24.13': [
    { port: '3000', protocol: 'HTTP', service: 'node', technology: 'Node 20' },
  ],
  '103.150.24.14': [
    { port: '443', protocol: 'HTTPS', service: 'cdn', technology: 'Cache 2.1' },
    { port: '80', protocol: 'HTTP', service: 'cdn', technology: 'Cache 2.1' },
  ],
  '103.150.24.15': [
    { port: '22', protocol: 'SSH', service: 'sshd', technology: 'OpenSSH 9.3' },
  ],
  '103.150.24.16': [
    { port: '1194', protocol: 'UDP', service: 'openvpn', technology: 'OpenVPN 2.6' },
  ],
  '103.150.24.17': [
    { port: '25', protocol: 'SMTP', service: 'postfix', technology: 'Postfix 3.7' },
  ],
  '103.150.24.18': [
    { port: '443', protocol: 'HTTPS', service: 'nginx', technology: 'nginx 1.25' },
  ],
  '103.150.24.19': [
    { port: '3000', protocol: 'HTTP', service: 'node', technology: 'Node 20' },
    { port: '22', protocol: 'SSH', service: 'sshd', technology: 'OpenSSH 9.3' },
  ],
  '103.150.24.12': [
    { port: '22', protocol: 'SSH', service: 'sshd', technology: 'OpenSSH 9.3' },
  ],
  '103.150.24.20': [
    { port: '443', protocol: 'HTTPS', service: 'nginx', technology: 'nginx 1.25' },
    { port: '3000', protocol: 'HTTP', service: 'node', technology: 'Node 20' },
  ],
  '103.150.24.21': [
    { port: '3000', protocol: 'HTTP', service: 'node', technology: 'Node 20' },
  ],
  '103.150.24.30': [
    { port: '25', protocol: 'SMTP', service: 'postfix', technology: 'Postfix 3.7' },
    { port: '993', protocol: 'IMAPS', service: 'dovecot', technology: 'Dovecot 2.3' },
  ],
  '103.150.24.31': [
    { port: '25', protocol: 'SMTP', service: 'postfix', technology: 'Postfix 3.7' },
  ],
  '103.150.24.40': [
    { port: '1194', protocol: 'UDP', service: 'openvpn', technology: 'OpenVPN 2.6' },
  ],
  '103.150.24.41': [
    { port: '443', protocol: 'HTTPS', service: 'cdn', technology: 'Cache 2.1' },
  ],
  '103.150.24.42': [
    { port: '443', protocol: 'HTTPS', service: 'nginx', technology: 'nginx 1.25' },
  ],
}
const showDetailModal = ref(false)
const detailDomain = ref('protergo.io')
const detailLastScanned = ref('—')
function openDetail(row) {
  if (!row) return
  closeMenu()
  detailDomain.value = row.domain || 'protergo.io'
  detailLastScanned.value = row.lastScanned || '—'
  detailState.activeSubdomain37 = 'api.protergo.io'
  detailState.ips37TagsOverride = {}
  detailState.ips37ConfigFor = null
  detailState.ips37SubTab = {}
  detailState.ips37NewTagText = ''
  detailState.ips37NewTagColor = 0
  detailState.ips37ColorPickerOpen = false
  showDetailModal.value = true
}
function closeDetail() { showDetailModal.value = false }

const subdomains37 = computed(() =>
  subdomains37List.map((sd) => {
    const active = sd.name === detailState.activeSubdomain37
    return {
      name: sd.name,
      dot: sd.dot,
      bg: active ? 'var(--coral-50)' : 'transparent',
      color: active ? 'var(--coral-600)' : 'var(--text-2)',
      select: () => {
        detailState.activeSubdomain37 = sd.name
        scrollActiveSubdomainIntoView()
      },
    }
  }),
)
// Scroll logic for the subdomain pane: fade hint shows only while more
// content sits below; selecting a row scrolls it into view.
const subListRef = ref(null)
const canScrollDown = ref(false)
function updateSubScrollState() {
  const el = subListRef.value
  if (!el) return
  canScrollDown.value = el.scrollHeight - el.scrollTop - el.clientHeight > 8
}
function scrollActiveSubdomainIntoView() {
  nextTick(() => {
    updateSubScrollState()
    const el = subListRef.value?.querySelector('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}
watch(showDetailModal, (open) => {
  if (open) {
    canScrollDown.value = false
    nextTick(() => {
      if (subListRef.value) subListRef.value.scrollTop = 0
      updateSubScrollState()
    })
  }
})
const subdomains37Count = computed(() => `${subdomains37List.length} total`)
const hasMoreSubdomains37 = computed(() => subdomains37List.length > 6)
const activeSubdomain37 = computed(() => detailState.activeSubdomain37)
const ips37 = computed(() => {
  const list = ips37ByDomain[detailState.activeSubdomain37] || []
  return list.map((ip) => {
    const tags = detailState.ips37TagsOverride[ip.address] || ip.tags
    const isConfiguring = detailState.ips37ConfigFor === ip.address
    const vocab = new Map()
    Object.values(ips37ByDomain).flat().forEach((x) => x.tags.forEach((t) => vocab.set(t.label, t.colorId)))
    Object.values(detailState.ips37TagsOverride).flat().forEach((t) => vocab.set(t.label, t.colorId))
    const usedLabels = tags.map((t) => t.label)
    const availableTags = [...vocab.entries()]
    const removeTag = (label) => {
      const next = tags.filter((t) => t.label !== label)
      detailState.ips37TagsOverride = { ...detailState.ips37TagsOverride, [ip.address]: next }
    }
    const addTag = (label0, colorId0) => {
      const label = (label0 !== undefined ? label0 : detailState.ips37NewTagText).trim()
      const colorId = colorId0 !== undefined ? colorId0 : detailState.ips37NewTagColor
      if (!label || usedLabels.includes(label)) return
      const next = [...tags, { label, colorId }]
      detailState.ips37TagsOverride = { ...detailState.ips37TagsOverride, [ip.address]: next }
      detailState.ips37NewTagText = ''
    }
    return {
      address: ip.address,
      subTab: detailState.ips37SubTab[ip.address] || 'ports',
      setSubTab: (tab) => {
        detailState.ips37SubTab = { ...detailState.ips37SubTab, [ip.address]: tab }
      },
      ports: ports37ByIp[ip.address] || [],
      tags: tags.map((t, i) => ({
        label: t.label,
        bg: tagColors[t.colorId].bg,
        fg: tagColors[t.colorId].fg,
        remove: () => removeTag(t.label),
      })),
      isConfiguring,
      hasTags: tags.length > 0,
      hasAvailableTags: availableTags.length > 0,
      availableTags: availableTags.map(([label, colorId]) => {
        const registered = usedLabels.includes(label)
        return {
          label,
          bg: tagColors[colorId].bg,
          fg: tagColors[colorId].fg,
          registered,
          toggle: () => { registered ? removeTag(label) : addTag(label, colorId) },
        }
      }),
      colorSwatches: tagColors.map((c, i) => ({
        swatch: c.swatch,
        ring: detailState.ips37NewTagColor === i ? 'var(--ice-600)' : 'transparent',
        select: () => { detailState.ips37NewTagColor = i; detailState.ips37ColorPickerOpen = false },
      })),
      currentColorSwatch: tagColors[detailState.ips37NewTagColor].swatch,
      colorPickerOpen: detailState.ips37ColorPickerOpen,
      toggleColorPicker: () => {
        detailState.ips37ColorPickerOpen = !detailState.ips37ColorPickerOpen
        if (detailState.ips37ColorPickerOpen) {
          nextTick(() => {
            document.querySelector('.dv-ippane .dv-palette')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
          })
        }
      },
      chevron: isConfiguring ? '180deg' : '0deg',
      toggleConfig: () => {
        detailState.ips37ConfigFor = detailState.ips37ConfigFor === ip.address ? null : ip.address
        detailState.ips37NewTagText = ''
        detailState.ips37NewTagColor = 0
        detailState.ips37ColorPickerOpen = false
      },
      newTagText: detailState.ips37NewTagText,
      onNewTagChange: (e) => { detailState.ips37NewTagText = e.target.value },
      onNewTagKeyDown: (e) => { if (e.key === 'Enter') addTag() },
      commitAdd: () => addTag(),
    }
  })
})
const ips37Count = computed(() => String((ips37ByDomain[detailState.activeSubdomain37] || []).length))
function viewDetail(row) {
  if (!row) return
  if (activeTab.value === 'webapp') openWebappDetail(row)
  else if (activeTab.value === 'source') openSourceDetail(row)
  else if (activeTab.value === 'network') openDetail({ ...row, domain: row.endpoint })
  else openDetail(row)
}
function assetName(row) {
  return row?.domain ?? row?.appName ?? row?.url ?? row?.endpoint ?? row?.repoName ?? '—'
}

// ── Network detail (IP list + host detail panel) ──────────────────────────
const showNetworkDetailModal = ref(false)
const networkDetail = ref(null)
const networkDetailActiveHostId = ref(null)
const netHostTagsOpen = ref(false)
// Scroll logic for the IP list pane: fade hint shows only while more
// content sits below; selecting a row scrolls it into view.
const netHostListRef = ref(null)
const netHostCanScrollDown = ref(false)
function updateNetHostScrollState() {
  const el = netHostListRef.value
  if (!el) return
  netHostCanScrollDown.value = el.scrollHeight - el.scrollTop - el.clientHeight > 8
}
function scrollActiveHostIntoView() {
  nextTick(() => {
    updateNetHostScrollState()
    const el = netHostListRef.value?.querySelector('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}
watch(showNetworkDetailModal, (open) => {
  if (open) {
    netHostCanScrollDown.value = false
    nextTick(() => {
      if (netHostListRef.value) netHostListRef.value.scrollTop = 0
      updateNetHostScrollState()
    })
  }
})
// Host lists are generated once per network and kept here so tags added
// through the popover persist for the life of the session (not recreated —
// and lost — on every re-open).
const networkHostsStore = reactive({})
const hostLocationPool = ['Jakarta, ID', 'Singapore, SG', 'Tokyo, JP', 'Frankfurt, DE', 'Amsterdam, NL', 'Sydney, AU', 'Osaka, JP', 'London, UK']
const hostOsPool = ['Ubuntu 22.04 LTS', 'CentOS 7', 'Windows Server 2019', 'Debian 11', 'Ubuntu 20.04 LTS', 'AlmaLinux 9', 'FreeBSD 13.2']
const hostPortPool = [
  { port: '443', protocol: 'HTTPS', service: 'nginx', technology: 'nginx 1.25' },
  { port: '22', protocol: 'SSH', service: 'sshd', technology: 'OpenSSH 9.3' },
  { port: '80', protocol: 'HTTP', service: 'nginx', technology: 'nginx 1.25' },
  { port: '3306', protocol: 'MySQL', service: 'mysqld', technology: 'MySQL 8.0' },
  { port: '53', protocol: 'DNS', service: 'named', technology: 'BIND 9.18' },
  { port: '21', protocol: 'FTP', service: 'vsftpd', technology: 'vsftpd 3.0.5' },
  { port: '25', protocol: 'SMTP', service: 'postfix', technology: 'Postfix 3.7' },
  { port: '8080', protocol: 'HTTP', service: 'tomcat', technology: 'Apache Tomcat 10' },
  { port: '6379', protocol: 'Redis', service: 'redis-server', technology: 'Redis 7.2' },
  { port: '27017', protocol: 'MongoDB', service: 'mongod', technology: 'MongoDB 6.0' },
]
const hostTagPool = [
  { label: 'Production', colorId: 4 },
  { label: 'Internal', colorId: 10 },
  { label: 'Staging', colorId: 2 },
  { label: 'VPN', colorId: 8 },
  { label: 'Backup', colorId: 1 },
  { label: 'Load balancer', colorId: 6 },
]
function buildHost(id, endpoint, i) {
  return {
    id,
    endpoint,
    location: hostLocationPool[i % hostLocationPool.length],
    os: hostOsPool[i % hostOsPool.length],
    tags: [{ ...hostTagPool[i % hostTagPool.length] }],
    ports: hostPortPool.slice(i % 3, (i % 3) + 3),
  }
}
function hostsForNetwork(net) {
  if (!net) return []
  if (networkHostsStore[net.id]) return networkHostsStore[net.id]
  let hosts
  if (net.endpointType === 'IP Single') {
    hosts = [buildHost(net.endpoint, net.endpoint, 0)]
  } else {
    const base = net.endpoint.split('/')[0].split('.').slice(0, 3).join('.')
    hosts = [1, 2, 3, 4, 5, 8, 10, 12, 15, 20, 25, 30].map((n, i) => buildHost(`${base}.${n}`, `${base}.${n}`, i))
  }
  networkHostsStore[net.id] = hosts
  return hosts
}
const networkDetailHosts = computed(() => hostsForNetwork(networkDetail.value))
const networkDetailHostItems = computed(() =>
  networkDetailHosts.value.map((h) => {
    const active = h.id === networkDetailActiveHostId.value
    return {
      id: h.id,
      endpoint: h.endpoint,
      active,
      bg: active ? 'var(--coral-50)' : 'transparent',
      color: active ? 'var(--coral-600)' : 'var(--text-2)',
      select: () => { networkDetailActiveHostId.value = h.id; netHostTagsOpen.value = false; scrollActiveHostIntoView() },
    }
  })
)
const networkDetailActiveHost = computed(() =>
  networkDetailHosts.value.find((h) => h.id === networkDetailActiveHostId.value) || networkDetailHosts.value[0] || null
)
// Same card shape as the Domain modal's ips37 IP cards (header + tags +
// Ports & services / Technology / Manage tags subtabs) — reused here so the
// selected host renders with identical layout/position.
const networkHostCards = computed(() => {
  return networkDetailHosts.value.map((host) => {
    const tags = host.tags
    const usedLabels = tags.map((t) => t.label)
    const vocab = new Map()
    tagVocab.value.forEach((t) => vocab.set(t.label, t.colorId))
    const availableTags = [...vocab.entries()]
    const removeTag = (label) => { host.tags = host.tags.filter((t) => t.label !== label) }
    const addTag = (label0, colorId0) => {
      const label = (label0 !== undefined ? label0 : detailState.netHostNewTagText).trim()
      const colorId = colorId0 !== undefined ? colorId0 : detailState.netHostNewTagColor
      if (!label || usedLabels.includes(label)) return
      host.tags = [...host.tags, { label, colorId }]
      detailState.netHostNewTagText = ''
    }
    return {
      id: host.id,
      address: host.endpoint,
      location: host.location,
      os: host.os,
      subTab: detailState.netHostSubTab[host.id] || 'ports',
      setSubTab: (tab) => { detailState.netHostSubTab = { ...detailState.netHostSubTab, [host.id]: tab } },
      ports: host.ports,
      tags: tags.map((t) => ({ label: t.label, bg: tagColors[t.colorId].bg, fg: tagColors[t.colorId].fg, remove: () => removeTag(t.label) })),
      hasTags: tags.length > 0,
      hasAvailableTags: availableTags.length > 0,
      availableTags: availableTags.map(([label, colorId]) => {
        const registered = usedLabels.includes(label)
        return {
          label,
          bg: tagColors[colorId].bg,
          fg: tagColors[colorId].fg,
          registered,
          toggle: () => { registered ? removeTag(label) : addTag(label, colorId) },
        }
      }),
      colorSwatches: tagColors.map((c, i) => ({
        swatch: c.swatch,
        ring: detailState.netHostNewTagColor === i ? 'var(--ice-600)' : 'transparent',
        select: () => { detailState.netHostNewTagColor = i; detailState.netHostColorPickerOpen = false },
      })),
      currentColorSwatch: tagColors[detailState.netHostNewTagColor].swatch,
      colorPickerOpen: detailState.netHostColorPickerOpen,
      toggleColorPicker: () => { detailState.netHostColorPickerOpen = !detailState.netHostColorPickerOpen },
      newTagText: detailState.netHostNewTagText,
      onNewTagChange: (e) => { detailState.netHostNewTagText = e.target.value },
      onNewTagKeyDown: (e) => { if (e.key === 'Enter') addTag() },
      commitAdd: () => addTag(),
    }
  })
})
const networkHostActiveCard = computed(() =>
  networkHostCards.value.find((c) => c.id === networkDetailActiveHostId.value) || networkHostCards.value[0] || null
)
function openNetworkDetail(row) {
  networkDetail.value = row
  networkDetailActiveHostId.value = hostsForNetwork(row)[0]?.id ?? null
  netHostTagsOpen.value = false
  showNetworkDetailModal.value = true
}
function closeNetworkDetail() {
  showNetworkDetailModal.value = false
}

// ── Web Application detail (branch list) ────────────────────────────────
const showWebappDetailModal = ref(false)
const webappDetail = ref(null)
const webappBranches = ref([])
const branches37ByApp = {
  'https://protergo.id/': [
    'https://protergo.id/',
    'https://protergo.id/malicious-npm-package-steals-claudeai/',
    'https://protergo.id/protergo-cyber-security-is-now-aspi-registered/',
    'https://protergo.id/services/penetration-testing/',
    'https://protergo.id/protergo-cyber-security-is-now-whitelisted-by-bssn/',
    'https://protergo.id/services/vulnerability-assessment/',
    'https://protergo.id/about-us/',
    'https://protergo.id/contact/',
    'https://protergo.id/blog/',
    'https://protergo.id/career/',
    'https://protergo.id/privacy-policy/',
    'https://protergo.id/terms-of-service/',
  ],
}
function branchesForWebapp(app) {
  if (branches37ByApp[app.url]) return branches37ByApp[app.url]
  const origin = String(app.url || '').split('/').slice(0, 3).join('/')
  return ['/', '/dashboard', '/login', '/api/docs', '/settings'].map((p) => origin + p)
}
function openWebappDetail(row) {
  closeMenu()
  webappDetail.value = row
  webappBranches.value = branchesForWebapp(row || {}).map((url, i) => ({ id: i + 1, url }))
  detailState.webappTagsOverride = {}
  detailState.ips37NewTagText = ''
  detailState.ips37NewTagColor = 0
  detailState.ips37ColorPickerOpen = false
  appTagsOpen.value = false
  showWebappDetailModal.value = true
}
function closeWebappDetail() {
  showWebappDetailModal.value = false
  webappDetail.value = null
}

// ── Source Code detail — Branch Discovered (same shell as Web App) ───────
const showSourceDetailModal = ref(false)
const sourceDetail = ref(null)
const sourceSearch = ref('')
const sourceBranchesRaw = ref([
  'master-branch', 'asset-inventory', 'company-management', 'setting',
  'Protergo Cyber Security Rempoa', 'Protergo Cyber Security Rempoa', 'Protergo Cyber Security Rempoa',
  'Protergo Cyber Security Ciputat', 'Protergo Cyber Security Ciputat', 'Protergo Cyber Security Ciputat',
  ...Array.from({ length: 89 }, (_, i) => `branch-${i + 11}`),
])
const filteredSourceBranches = computed(() => {
  const list = sourceBranchesRaw.value.map((name, i) => ({ id: i + 1, name }))
  return list
})
const sourceTagsOpen = ref(false)
const sourceTagManager = computed(() => {
  const url = sourceDetail.value?.domain || sourceDetail.value?.name || 'source'
  const tags = detailState.sourceTagsOverride?.[url] || []
  const vocab = new Map()
  Object.values(ips37ByDomain).flat().forEach((x) => x.tags.forEach((t) => vocab.set(t.label, t.colorId)))
  webapps.value.forEach((a) => (a.tags || []).forEach((t) => vocab.set(t.label, t.colorId)))
  Object.values(detailState.sourceTagsOverride || {}).flat().forEach((t) => vocab.set(t.label, t.colorId))
  const used = tags.map((t) => t.label)
  const available = [...vocab.entries()]
  const addTag = (label0, colorId0) => {
    const label = (label0 !== undefined ? label0 : detailState.ips37NewTagText).trim()
    const colorId = colorId0 !== undefined ? colorId0 : detailState.ips37NewTagColor
    if (!label || used.includes(label)) return
    detailState.sourceTagsOverride = { ...detailState.sourceTagsOverride, [url]: [...tags, { label, colorId }] }
    detailState.ips37NewTagText = ''
  }
  const removeTag = (label) => {
    detailState.sourceTagsOverride = { ...detailState.sourceTagsOverride, [url]: tags.filter((t) => t.label !== label) }
  }
  return {
    tags: tags.map((t) => ({ label: t.label, bg: tagColors[t.colorId].bg, fg: tagColors[t.colorId].fg, remove: () => removeTag(t.label) })),
    hasTags: tags.length > 0,
    hasAvailableTags: available.length > 0,
    availableTags: available.map(([label, colorId]) => {
      const registered = used.includes(label)
      return { label, bg: tagColors[colorId].bg, fg: tagColors[colorId].fg, registered, toggle: () => { registered ? removeTag(label) : addTag(label, colorId) } }
    }),
    colorSwatches: tagColors.map((c, i) => ({ swatch: c.swatch, ring: detailState.ips37NewTagColor === i ? 'var(--ice-600)' : 'transparent', select: () => { detailState.ips37NewTagColor = i; detailState.ips37ColorPickerOpen = false } })),
    currentColorSwatch: tagColors[detailState.ips37NewTagColor].swatch,
    colorPickerOpen: detailState.ips37ColorPickerOpen,
    toggleColorPicker: () => { detailState.ips37ColorPickerOpen = !detailState.ips37ColorPickerOpen },
    newTagText: detailState.ips37NewTagText,
    onNewTagChange: (e) => { detailState.ips37NewTagText = e.target.value },
    onNewTagKeyDown: (e) => { if (e.key === 'Enter') addTag() },
    commitAdd: () => addTag(),
  }
})
const sourceBranchScrollRef = ref(null)
const canScrollSourceDown = ref(false)
function updateSourceScroll() {
  const el = sourceBranchScrollRef.value
  if (!el) return
  canScrollSourceDown.value = el.scrollHeight - el.scrollTop - el.clientHeight > 8
}
function openSourceDetail(row) {
  closeMenu()
  sourceDetail.value = row
  showSourceDetailModal.value = true
  nextTick(() => {
    if (sourceBranchScrollRef.value) sourceBranchScrollRef.value.scrollTop = 0
    updateSourceScroll()
  })
}
function closeSourceDetail() {
  showSourceDetailModal.value = false
  sourceDetail.value = null
}
watch(showSourceDetailModal, (open) => {
  if (open) {
    canScrollSourceDown.value = false
    nextTick(() => {
      if (sourceBranchScrollRef.value) sourceBranchScrollRef.value.scrollTop = 0
      updateSourceScroll()
    })
  }
})
const appTagsOpen = ref(false)
// Manage tags for the app URL itself (modal level, not per branch)
const appDefaultTags = {
  'https://protergo.id/': [{ label: 'Production', colorId: 4 }],
}
function defaultAppTags(url) {
  if (appDefaultTags[url]) return appDefaultTags[url]
  return []
}
const appTagManager = computed(() => {
  const url = webappDetail.value?.url || ''
  const tags = detailState.webappTagsOverride[url] || defaultAppTags(url)
  const vocab = new Map()
  Object.values(ips37ByDomain).flat().forEach((x) => x.tags.forEach((t) => vocab.set(t.label, t.colorId)))
  Object.values(detailState.ips37TagsOverride).flat().forEach((t) => vocab.set(t.label, t.colorId))
  Object.keys(appDefaultTags).forEach((u) => appDefaultTags[u].forEach((t) => vocab.set(t.label, t.colorId)))
  Object.values(detailState.webappTagsOverride).flat().forEach((t) => vocab.set(t.label, t.colorId))
  const used = tags.map((t) => t.label)
  const available = [...vocab.entries()]
  const removeTag = (label) => {
    const next = tags.filter((t) => t.label !== label)
    detailState.webappTagsOverride = { ...detailState.webappTagsOverride, [url]: next }
  }
  const addTag = (label0, colorId0) => {
    const label = (label0 !== undefined ? label0 : detailState.ips37NewTagText).trim()
    const colorId = colorId0 !== undefined ? colorId0 : detailState.ips37NewTagColor
    if (!label || used.includes(label)) return
    detailState.webappTagsOverride = { ...detailState.webappTagsOverride, [url]: [...tags, { label, colorId }] }
    detailState.ips37NewTagText = ''
  }
  return {
    tags: tags.map((t, i) => ({
      label: t.label,
      bg: tagColors[t.colorId].bg,
      fg: tagColors[t.colorId].fg,
      remove: () => removeTag(t.label),
    })),
    hasTags: tags.length > 0,
    hasAvailableTags: available.length > 0,
    availableTags: available.map(([label, colorId]) => {
      const registered = used.includes(label)
      return {
        label,
        bg: tagColors[colorId].bg,
        fg: tagColors[colorId].fg,
        registered,
        toggle: () => { registered ? removeTag(label) : addTag(label, colorId) },
      }
    }),
    colorSwatches: tagColors.map((c, i) => ({
      swatch: c.swatch,
      ring: detailState.ips37NewTagColor === i ? 'var(--ice-600)' : 'transparent',
      select: () => { detailState.ips37NewTagColor = i; detailState.ips37ColorPickerOpen = false },
    })),
    currentColorSwatch: tagColors[detailState.ips37NewTagColor].swatch,
    colorPickerOpen: detailState.ips37ColorPickerOpen,
    toggleColorPicker: () => {
      detailState.ips37ColorPickerOpen = !detailState.ips37ColorPickerOpen
      if (detailState.ips37ColorPickerOpen) {
        nextTick(() => {
          document.querySelector('.dv-app-tags .dv-palette')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        })
      }
    },
    newTagText: detailState.ips37NewTagText,
    onNewTagChange: (e) => { detailState.ips37NewTagText = e.target.value },
    onNewTagKeyDown: (e) => { if (e.key === 'Enter') addTag() },
    commitAdd: () => addTag(),
  }
})
const branchScrollRef = ref(null)
const canScrollBranchDown = ref(false)
function updateBranchScroll() {
  const el = branchScrollRef.value
  if (!el) return
  canScrollBranchDown.value = el.scrollHeight - el.scrollTop - el.clientHeight > 8
}
watch(showWebappDetailModal, (open) => {
  if (open) {
    canScrollBranchDown.value = false
    nextTick(() => {
      if (branchScrollRef.value) branchScrollRef.value.scrollTop = 0
      updateBranchScroll()
    })
  }
})
function rescan(row) {
  closeMenu()
  openRescanModal(row)
}
function deleteAsset(row) {
  closeMenu()
  openDeleteAssetModal(row)
}

// ── Delete Domain confirm ───────────────────────────────────────────────
const showDeleteAssetModal = ref(false)
const deleteAssetTarget = ref(null)
const deleteAssetConfirmed = ref(false)
const deleteAssetState = ref('idle') // 'idle' | 'loading' | 'saved'
function openDeleteAssetModal(row) {
  deleteAssetTarget.value = row
  deleteAssetConfirmed.value = false
  deleteAssetState.value = 'idle'
  showDeleteAssetModal.value = true
}
function closeDeleteAssetModal() {
  showDeleteAssetModal.value = false
  deleteAssetTarget.value = null
}
function confirmDeleteAsset() {
  if (!deleteAssetConfirmed.value || deleteAssetState.value !== 'idle' || !deleteAssetTarget.value) return
  deleteAssetState.value = 'loading'
  setTimeout(() => {
    const id = deleteAssetTarget.value.id
    if (activeTab.value === 'webapp') webapps.value = webapps.value.filter((a) => a.id !== id)
    else if (activeTab.value === 'network') networks.value = networks.value.filter((a) => a.id !== id)
    else if (activeTab.value === 'source') sourceCodes.value = sourceCodes.value.filter((a) => a.id !== id)
    else assets.value = assets.value.filter((a) => a.id !== id)
    deleteAssetState.value = 'saved'
    setTimeout(closeDeleteAssetModal, 700)
  }, 500)
}

// ── Re-scan Domain confirm ──────────────────────────────────────────────
const showRescanModal = ref(false)
const rescanTarget = ref(null)
const rescanState = ref('idle') // 'idle' | 'loading' | 'saved'
function openRescanModal(row) {
  rescanTarget.value = row
  rescanState.value = 'idle'
  showRescanModal.value = true
}
function closeRescanModal() {
  showRescanModal.value = false
  rescanTarget.value = null
}
function confirmRescan() {
  if (rescanState.value !== 'idle' || !rescanTarget.value) return
  rescanState.value = 'loading'
  setTimeout(() => {
    const id = rescanTarget.value.id
    const target = activeTab.value === 'webapp' ? webapps.value : activeTab.value === 'network' ? networks.value : activeTab.value === 'source' ? sourceCodes.value : assets.value
    const item = target.find((a) => a.id === id)
    if (item) item.status = 'Scanning'
    rescanState.value = 'saved'
    setTimeout(closeRescanModal, 700)
  }, 500)
}

// ── Register Domain modal — same pattern as other modals
const showRegisterModal = ref(false)
const registerOwner = ref(null)
const registerDomain = ref('')
const registerField = ref(null)
const registerState = ref('idle') // 'idle' | 'loading' | 'saved'
const canProceedRegister = computed(() => {
  const d = registerDomain.value.trim()
  const domainOk = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d)
  return !!registerOwner.value && domainOk
})
const registerDomainError = computed(() => {
  const d = registerDomain.value.trim()
  if (!d) return ''
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d)) return 'Please enter a valid domain (e.g., example.com)'
  return ''
})
function openRegisterModal() {
  registerOwner.value = null
  registerDomain.value = ''
  registerField.value = null
  registerState.value = 'idle'
  showRegisterModal.value = true
}
function closeRegisterModal() {
  showRegisterModal.value = false
  registerField.value = null
}
function toggleRegisterField(key) {
  registerField.value = registerField.value === key ? null : key
}
function selectRegisterOwner(value) {
  registerOwner.value = value
  registerField.value = null
}
function submitRegister() {
  if (!canProceedRegister.value || registerState.value !== 'idle') return
  registerState.value = 'loading'
  setTimeout(() => {
    const newId = assets.value.length + 1
    assets.value.unshift({
      id: newId,
      domain: registerDomain.value.trim(),
      owner: registerOwner.value,
      lastScanned: '-',
      status: 'Scanning',
    })
    registerState.value = 'saved'
    setTimeout(closeRegisterModal, 700)
  }, 500)
}

// ── Register Web Application modal ──────────────────────────────────────
const showRegisterWebappModal = ref(false)
const regWAOwner = ref(null)
const regWAName = ref('')
const regWAUrl = ref('')
const regWABasic = ref(false)
const regWAUser = ref('')
const regWAPass = ref('')
const regWAField = ref(null)
const regWAState = ref('idle') // 'idle' | 'loading' | 'saved'
const regWAUrlError = computed(() => {
  const u = regWAUrl.value.trim()
  if (!u) return ''
  if (!/^(https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(u)) return 'Please enter a valid URL (e.g., https://example.com)'
  return ''
})
const canRegisterWebapp = computed(() => {
  if (!regWAOwner.value || !regWAName.value.trim() || !regWAUrl.value.trim() || regWAUrlError.value) return false
  if (regWABasic.value && (!regWAUser.value.trim() || !regWAPass.value)) return false
  return true
})
function openRegisterWebappModal() {
  regWAOwner.value = null
  regWAName.value = ''
  regWAUrl.value = ''
  regWABasic.value = false
  regWAUser.value = ''
  regWAPass.value = ''
  regWAField.value = null
  regWAState.value = 'idle'
  showRegisterWebappModal.value = true
}
function closeRegisterWebappModal() {
  showRegisterWebappModal.value = false
  regWAField.value = null
}
function toggleRegWAField(key) {
  regWAField.value = regWAField.value === key ? null : key
}
function selectRegWAOwner(value) {
  regWAOwner.value = value
  regWAField.value = null
}
function submitRegisterWebapp() {
  if (!canRegisterWebapp.value || regWAState.value !== 'idle') return
  regWAState.value = 'loading'
  setTimeout(() => {
    const newId = webapps.value.length + 1
    webapps.value.unshift({
      id: newId,
      appName: regWAName.value.trim(),
      url: regWAUrl.value.trim(),
      owner: regWAOwner.value,
      basicAuth: regWABasic.value ? 'Active' : 'Inactive',
      lastScanned: '-',
      tags: [],
      status: 'Scanning',
    })
    regWAState.value = 'saved'
    setTimeout(closeRegisterWebappModal, 700)
  }, 500)
}
</script>

<template>
  <div class="asset-mgmt">
    <div class="asset-mgmt__head">
      <h1 class="asset-mgmt__title">Asset Inventory Management</h1>
      <p class="asset-mgmt__sub">{{ totalLabel }}: <b>{{ totalCount }}</b></p>
      <p class="asset-mgmt__desc">This is where you store and keep all your assets. All assets are automatically categorized by type including Domain, Web Application, Network, Source Code, and Tags. You can register new assets, track their scan status, monitor last scanned dates, and manage your inventory in one place. This helps you keep your security posture organized, up to date, and ready for scanning at any time.</p>
    </div>
    <div class="asset-tabs">
      <div class="asset-tabs__pill" :class="{ 'asset-tabs__pill--ready': tabPillReady }" :style="tabPillStyle"></div>
      <button
        v-for="t in tabs"
        :key="t.key"
        :ref="(el) => setTabButtonRef(t.key, el)"
        type="button"
        class="asset-tabs__item"
        role="tab"
        :aria-selected="t.key === activeTab"
        :class="{ 'asset-tabs__item--active': t.key === activeTab }"
        @click="activeTab = t.key"
      >
        <span class="asset-tabs__item-inner">
          <component :is="t.icon" :size="14" />
          {{ t.label }}
        </span>
      </button>
    </div>

    <div v-if="activeTab !== 'tags'" class="asset-controls">
      <template v-if="activeTab === 'domain'">
        <div class="asset-controls__left">
          <FilterDropdown v-model="ownerFilter" :options="ownerOptions" placeholder="Asset Owner" />
          <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Scanner Status" />
        </div>
        <div class="asset-controls__right">
          <SearchInput v-model="search" placeholder="Search…" />
          <button type="button" class="btn-register" @click="openRegisterModal"><IconPlus :size="14" /> Register Domain</button>
        </div>
      </template>
      <template v-else-if="activeTab === 'webapp'">
        <div class="asset-controls__left">
          <FilterDropdown v-model="basicAuthFilter" :options="basicAuthOptions" placeholder="Basic Auth" />
          <FilterDropdown v-model="multiTagFilter" :options="[]" placeholder="Multi-Tags" />
          <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Scanner Status" />
        </div>
        <div class="asset-controls__right">
          <SearchInput v-model="search" placeholder="Search…" />
          <button type="button" class="btn-register" @click="openRegisterWebappModal"><IconPlus :size="14" /> Register Web Application</button>
        </div>
      </template>
      <template v-else-if="activeTab === 'network'">
        <div class="asset-controls__left">
          <div class="endpoint-kind endpoint-kind--inline">
            <div class="endpoint-kind__pill" :class="{ 'endpoint-kind__pill--ready': kindPillReady }" :style="kindPillStyle"></div>
            <button
              type="button"
              :ref="(el) => setKindButtonRef('single', el)"
              class="endpoint-kind__item"
              role="tab"
              :aria-selected="networkKind === 'single'"
              :class="{ 'endpoint-kind__item--active': networkKind === 'single' }"
              @click="networkKind = 'single'"
            >
              <IconCircleDot :size="14" /> IP Single
            </button>
            <button
              type="button"
              :ref="(el) => setKindButtonRef('cidr', el)"
              class="endpoint-kind__item"
              role="tab"
              :aria-selected="networkKind === 'cidr'"
              :class="{ 'endpoint-kind__item--active': networkKind === 'cidr' }"
              @click="networkKind = 'cidr'"
            >
              <IconArrowsLeftRight :size="14" /> CIDR
            </button>
          </div>
          <FilterDropdown v-model="ownerFilter" :options="ownerOptions" placeholder="Asset Owner" />
          <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Scanner Status" />
        </div>
        <div class="asset-controls__right">
          <SearchInput v-model="search" placeholder="Search…" />
          <button type="button" class="btn-register" @click="openRegisterNetworkModal"><IconPlus :size="14" /> Register Network</button>
        </div>
      </template>
      <template v-else-if="activeTab === 'source'">
        <div class="asset-controls__left">
          <FilterDropdown v-model="ownerFilter" :options="ownerOptions" placeholder="Asset Owner" />
          <FilterDropdown v-model="gitProviderFilter" :options="gitProviderFilterOptions" placeholder="Git Provider" />
          <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Scanner Status" />
        </div>
        <div class="asset-controls__right">
          <SearchInput v-model="search" placeholder="Search…" />
          <button type="button" class="btn-register" @click="openRegisterSourceModal"><IconPlus :size="14" /> Register Repository</button>
        </div>
      </template>
      <template v-else>
        <div class="asset-controls__left">
          <FilterDropdown v-model="ownerFilter" :options="ownerOptions" placeholder="Asset Owner" />
          <FilterDropdown v-model="statusFilter" :options="statusOptions" placeholder="Scanner Status" />
        </div>
        <div class="asset-controls__right">
          <SearchInput v-model="search" placeholder="Search…" />
          <button type="button" class="btn-register"><IconPlus :size="14" /> Register</button>
        </div>
      </template>
    </div>

    <DataTable
      v-if="activeTab === 'domain'"
      :columns="columns"
      :items="filtered"
      :loading="false"
      empty-text="No assets found."
    >
      <template #cell-status="{ row }">
        <span
          class="status-pill"
          :class="{
            'status-pill--queue': row.status === 'Queue',
            'status-pill--scanning': row.status === 'Scanning',
            'status-pill--completed': row.status === 'Completed',
            'status-pill--failed': row.status === 'Failed',
          }"
        >{{ row.status }}</span>
      </template>
      <template #cell-actions="{ row }">
        <button type="button" class="action-btn" @click.stop="toggleMenu(row, $event)"><IconDotsVertical :size="16" /></button>
      </template>
    </DataTable>

    <DataTable
      v-else-if="activeTab === 'webapp'"
      :columns="webappColumns"
      :items="filteredWebapps"
      :loading="false"
      empty-text="No web applications found."
    >
      <template #cell-tags="{ row }">
        <div class="cell-tags">
          <span v-for="t in row.tags.slice(0, 2)" :key="t.label" class="dv-tag" :style="{ background: tagColors[t.colorId].bg, color: tagColors[t.colorId].fg }">{{ t.label }}</span>
          <span v-if="row.tags.length > 2" class="tag-more">+{{ row.tags.length - 2 }}</span>
          <button v-if="!row.tags.length" type="button" class="tag-add" @click.stop="openTagPopover(row, $event)"><IconPlus :size="12" /> Add tag</button>
        </div>
      </template>
      <template #cell-status="{ row }">
        <span
          class="status-pill"
          :class="{
            'status-pill--queue': row.status === 'Queue',
            'status-pill--scanning': row.status === 'Scanning',
            'status-pill--completed': row.status === 'Completed',
            'status-pill--failed': row.status === 'Failed',
          }"
        >{{ row.status }}</span>
      </template>
      <template #cell-actions="{ row }">
        <button type="button" class="action-btn" @click.stop="toggleMenu(row, $event)"><IconDotsVertical :size="16" /></button>
      </template>
    </DataTable>

    <DataTable
      v-else-if="activeTab === 'network'"
      :columns="networkColumns"
      :items="filteredNetworks"
      :loading="false"
      empty-text="No networks found."
    >
      <template #cell-tags="{ row }">
        <div class="cell-tags">
          <span v-for="t in row.tags.slice(0, 2)" :key="t.label" class="dv-tag" :style="{ background: tagColors[t.colorId].bg, color: tagColors[t.colorId].fg }">{{ t.label }}</span>
          <span v-if="row.tags.length > 2" class="tag-more">+{{ row.tags.length - 2 }}</span>
          <button v-if="!row.tags.length" type="button" class="tag-add" @click.stop="openTagPopover(row, $event)"><IconPlus :size="12" /> Add tag</button>
        </div>
      </template>
      <template #cell-status="{ row }">
        <span
          class="status-pill"
          :class="{
            'status-pill--queue': row.status === 'Queue',
            'status-pill--scanning': row.status === 'Scanning',
            'status-pill--completed': row.status === 'Completed',
            'status-pill--failed': row.status === 'Failed',
          }"
        >{{ row.status }}</span>
      </template>
      <template #cell-actions="{ row }">
        <button type="button" class="action-btn" @click.stop="toggleMenu(row, $event)"><IconDotsVertical :size="16" /></button>
      </template>
    </DataTable>

    <DataTable
      v-else-if="activeTab === 'source'"
      :columns="sourceCodeColumns"
      :items="filteredSourceCodes"
      :loading="false"
      empty-text="No source code repositories found."
    >
      <template #cell-tags="{ row }">
        <div class="cell-tags">
          <span v-for="t in row.tags.slice(0, 2)" :key="t.label" class="dv-tag" :style="{ background: tagColors[t.colorId].bg, color: tagColors[t.colorId].fg }">{{ t.label }}</span>
          <span v-if="row.tags.length > 2" class="tag-more">+{{ row.tags.length - 2 }}</span>
          <button v-if="!row.tags.length" type="button" class="tag-add" @click.stop="openTagPopover(row, $event, 'source')"><IconPlus :size="12" /> Add tag</button>
        </div>
      </template>
      <template #cell-status="{ row }">
        <span
          class="status-pill"
          :class="{
            'status-pill--queue': row.status === 'Queue',
            'status-pill--scanning': row.status === 'Scanning',
            'status-pill--completed': row.status === 'Completed',
            'status-pill--failed': row.status === 'Failed',
          }"
        >{{ row.status }}</span>
      </template>
      <template #cell-actions="{ row }">
        <button type="button" class="action-btn" @click.stop="toggleMenu(row, $event)"><IconDotsVertical :size="16" /></button>
      </template>
    </DataTable>

    <div v-else class="tags-panel">
      <div class="tags-panel__head">
        <h3 class="tags-panel__title">Tags</h3>
        <button type="button" class="btn-register btn-register--red" @click="addTagEntry">Create</button>
      </div>
      <p class="tags-panel__desc">Create and manage tags to categorize your assets. Tags help you filter and organize your inventory quickly. Here are your registered tags. You can see how many assets use each tag, create new tags, or manage existing ones as needed.</p>
      <div v-if="filteredTags.length" class="tags-grid tags-grid--five">
        <div
          v-for="tag in filteredTags"
          :key="tag.id"
          class="tag-card"
          :style="{ background: tag.bg, color: tag.color }"
        >
          <div class="tag-card__info">
            <div class="tag-card__name">{{ tag.name }}</div>
            <div class="tag-card__used">Used by {{ tag.usedBy }} assets</div>
          </div>
          <button type="button" class="tag-card__arrow" @click="openTagDetail(tag)" aria-label="View tag details">
            <IconArrowRight :size="16" />
          </button>
        </div>
      </div>
      <div v-else class="tags-empty">
        <div class="tags-empty__icon"><IconTag :size="26" /></div>
        <div class="tags-empty__title">No tags registered yet</div>
        <p class="tags-empty__desc">Tags help you categorize and quickly filter your assets. Create your first tag to get started.</p>
        <button type="button" class="btn-register btn-register--red" @click="addTagEntry"><IconPlus :size="14" /> Add Tag</button>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="openMenuId" class="action-menu" :style="{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }">
        <template v-if="activeTab === 'tags'">
          <button type="button" class="action-menu__item" @click="editTag(openMenuRow); closeMenu()"><IconPencil :size="14" /> Edit</button>
          <button type="button" class="action-menu__item action-menu__item--danger" @click="deleteTag(openMenuRow); closeMenu()"><IconTrash :size="14" /> Delete</button>
        </template>
        <template v-else>
          <button type="button" class="action-menu__item" @click="viewDetail(openMenuRow)"><IconEye :size="14" /> See Detail</button>
          <button v-if="activeTab === 'webapp' || activeTab === 'network' || activeTab === 'source'" type="button" class="action-menu__item" @click="manageRowTags(openMenuRow, $event)"><IconTag :size="14" /> Manage tag</button>
          <button type="button" class="action-menu__item" @click="rescan(openMenuRow)"><IconRefresh :size="14" /> Re-scan</button>
          <button type="button" class="action-menu__item action-menu__item--danger" @click="deleteAsset(openMenuRow)"><IconTrash :size="14" /> Delete</button>
        </template>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="tagPopoverFor && tagPopoverRow" class="tag-popover" :style="{ top: `${tagPopoverPos.top}px`, left: `${tagPopoverPos.left}px` }">
        <div class="tag-popover__title">Manage Multi Tags</div>
        <div class="tag-popover__current">
          <span v-for="t in tagPopoverRow.tags" :key="t.label" class="dv-tag" :style="{ background: tagColors[t.colorId].bg, color: tagColors[t.colorId].fg }">
            {{ t.label }}
            <button type="button" class="dv-tag__x" @click="removeRowTag(tagPopoverRow, t.label)">×</button>
          </span>
          <span v-if="!tagPopoverRow.tags.length" class="tag-popover__empty">No tags yet.</span>
        </div>
        <input v-model="tagQuery" type="text" class="tag-popover__search" placeholder="Find or create tag..." />
        <div class="tag-popover__list">
          <button
            v-for="t in filteredTagVocab"
            :key="t.label"
            type="button"
            class="tag-popover__item"
            :class="{ 'tag-popover__item--added': tagPopoverRow.tags.some((x) => x.label === t.label) }"
            @click="pickExistingTag(tagPopoverRow, t)"
          >
            <span class="dv-dot" :style="{ background: t.fg }"></span>{{ t.label }}
            <span v-if="tagPopoverRow.tags.some((x) => x.label === t.label)" class="tag-popover__check">✓</span>
          </button>
          <div v-if="!filteredTagVocab.length" class="tag-popover__empty">No matches — create it below.</div>
        </div>
        <div class="tag-popover__create">
          <div class="tag-popover__colors">
            <button
              v-for="(c, i) in tagColors"
              :key="c.swatch"
              type="button"
              class="tag-popover__swatch"
              :class="{ 'tag-popover__swatch--active': tagNewColor === i }"
              :style="{ background: c.swatch }"
              @click="tagNewColor = i"
            ></button>
          </div>
          <button type="button" class="tag-popover__add" :disabled="!tagQuery.trim()" @click="createRowTag(tagPopoverRow)">Add</button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDetailModal" class="modal-backdrop" @mousedown.self="closeDetail">
          <div class="dv-modal">
            <div class="dv-modal__head">
              <div>
                <div class="dv-modal__title">Asset details</div>
                <div class="dv-modal__sub">{{ detailDomain }}</div>
                <div class="dv-modal__meta">Last scanned: {{ detailLastScanned }}</div>
              </div>
              <button type="button" class="dv-modal__close" @click="closeDetail"><IconX :size="18" /></button>
            </div>
            <div class="dv-modal__body">
              <div class="dv-subpane">
                <div class="dv-subpane__head"><span>Subdomains</span><span>{{ subdomains37Count }}</span></div>
                <div ref="subListRef" class="dv-subpane__list" @scroll="updateSubScrollState">
                  <button
                    v-for="sd in subdomains37"
                    :key="sd.name"
                    type="button"
                    class="dv-sub"
                    :data-active="sd.name === activeSubdomain37"
                    :style="{ background: sd.bg }"
                    @click="sd.select"
                  >
                    <span :style="{ color: sd.color, fontFamily: `'JetBrains Mono', 'Fira Code', monospace`, fontSize: '12.5px' }">{{ sd.name }}</span>
                  </button>
                </div>
                <div v-if="hasMoreSubdomains37 && canScrollDown" class="dv-subpane__hint"><IconChevronDown :size="16" class="dv-hint-icon" /></div>
              </div>
              <div class="dv-ippane">
                <div class="dv-ippane__head">
                  <span>IP addresses</span><span class="dv-badge">{{ ips37Count }}</span>
                </div>
                <div class="dv-ippane__sub">for {{ activeSubdomain37 }}</div>
                <div class="dv-ip-list">
                  <div v-for="ip in ips37" :key="ip.address" class="dv-ip">
                    <div class="dv-ip__main dv-ip__main--clickable" @click="ip.toggleConfig">
                      <div class="dv-ip__row">
                        <div class="dv-ip__left">
                          <IconSitemap :size="16" class="dv-icon" />
                          <span class="dv-mono">{{ ip.address }}</span>
                        </div>
                        <button type="button" class="dv-chevron" :style="{ transform: `rotate(${ip.chevron})` }" tabindex="-1">
                          <IconChevronDown :size="16" />
                        </button>
                      </div>
                      <div v-if="ip.hasTags" class="dv-tags">
                        <span v-for="tg in ip.tags" :key="tg.label" class="dv-tag" :style="{ background: tg.bg, color: tg.fg }">{{ tg.label }}</span>
                      </div>
                    </div>
                    <Transition name="dv-expand">
                      <div v-if="ip.isConfiguring" class="dv-config">
                      <div class="dv-subtabs">
                        <button
                          type="button"
                          class="dv-subtab"
                          :class="{ 'dv-subtab--active': ip.subTab === 'ports' }"
                          @click="ip.setSubTab('ports')"
                        >Ports & services</button>
                        <button
                          type="button"
                          class="dv-subtab"
                          :class="{ 'dv-subtab--active': ip.subTab === 'tech' }"
                          @click="ip.setSubTab('tech')"
                        >Technology</button>
                        <button
                          type="button"
                          class="dv-subtab"
                          :class="{ 'dv-subtab--active': ip.subTab === 'tags' }"
                          @click="ip.setSubTab('tags')"
                        >Manage tags</button>
                      </div>
                      <div v-if="ip.subTab === 'ports'" class="dv-ports">
                        <div class="dv-ports__head">
                          <span>Port</span><span>Protocol</span><span>Service</span>
                        </div>
                        <div v-for="p in ip.ports" :key="p.port" class="dv-ports__row dv-ports__row--short">
                          <span class="dv-ports__port">{{ p.port }}</span>
                          <span>{{ p.protocol }}</span>
                          <span>{{ p.service }}</span>
                        </div>
                        <div v-if="!ip.ports.length" class="dv-ports__empty">No open ports detected.</div>
                      </div>
                      <div v-else-if="ip.subTab === 'tech'" class="dv-ports">
                        <div class="dv-ports__head dv-ports__head--tech">
                          <span>Technology</span>
                        </div>
                        <div v-for="p in ip.ports" :key="p.port" class="dv-ports__row dv-ports__row--tech">
                          <span class="dv-ports__tech">{{ p.technology }}</span>
                        </div>
                        <div v-if="!ip.ports.length" class="dv-ports__empty">No technology detected.</div>
                      </div>
                      <template v-else>
                      <div class="dv-config__title">Manage tags</div>
                      <div v-for="tg in ip.tags" :key="tg.label" class="dv-tag-row">
                        <div class="dv-tag-left">
                          <span class="dv-tag-dot" :style="{ background: tg.fg }"></span><span>{{ tg.label }}</span>
                        </div>
                        <button type="button" class="dv-remove" @click="tg.remove">Remove</button>
                      </div>
                      <div v-if="ip.hasAvailableTags" class="dv-avail">
                        <div class="dv-config__title">Existing tags</div>
                        <div class="dv-avail__list">
                          <button
                            v-for="at in ip.availableTags"
                            :key="at.label"
                            type="button"
                            class="dv-avail-tag"
                            :class="{ 'dv-avail-tag--registered': at.registered }"
                            :style="{ background: at.bg, color: at.fg, borderColor: 'var(--gray-100)' }"
                            @click="at.toggle"
                          >
                            <span class="dv-dot" :style="{ background: at.fg }"></span>{{ at.label }}
                          </button>
                        </div>
                      </div>
                      <div class="dv-add">
                        <button type="button" class="dv-color-btn" @click="ip.toggleColorPicker">
                          <span class="dv-color-swatch" :style="{ background: ip.currentColorSwatch }"></span><IconChevronDown :size="16" class="dv-icon" />
                        </button>
                        <input :value="ip.newTagText" @input="ip.onNewTagChange" @keydown="ip.onNewTagKeyDown" placeholder="new tag name…" class="dv-input" />
                        <button type="button" class="dv-add-btn" @click="ip.commitAdd">Add</button>
                      </div>
                      <Transition name="dv-expand">
                        <div v-if="ip.colorPickerOpen" class="dv-palette">
                          <button
                            v-for="cs in ip.colorSwatches"
                            :key="cs.swatch"
                            type="button"
                            class="dv-swatch"
                            :style="{ background: cs.swatch, borderColor: cs.ring }"
                            @click="cs.select"
                          ></button>
                        </div>
                      </Transition>
                      </template>
                      </div>
                    </Transition>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showWebappDetailModal" class="modal-backdrop" @mousedown.self="closeWebappDetail">
          <div class="dv-modal dv-modal--narrow">
            <div class="dv-modal__head">
              <div>
                <div class="dv-modal__title">Asset details</div>
                <div class="dv-modal__sub">{{ webappDetail?.url }}</div>
                <div class="dv-modal__meta">Last scanned: {{ webappDetail?.lastScanned }}</div>
              </div>
              <button type="button" class="dv-modal__close" @click="closeWebappDetail"><IconX :size="18" /></button>
            </div>
            <div class="dv-app-tags">
              <div class="dv-manage">
                <div class="dv-manage__static">
                  <div class="dv-config__title">Multi tag</div>
                  <div v-if="appTagManager.hasTags" class="dv-tags" style="padding-left: 0;">
                    <span v-for="tg in appTagManager.tags" :key="tg.label" class="dv-tag" :style="{ background: tg.bg, color: tg.fg }">{{ tg.label }}</span>
                  </div>
                  <div v-else class="dv-manage__empty">No tags yet.</div>
                </div>
              </div>
              <div class="dv-manage">
                <button type="button" class="dv-manage-toggle" @click="appTagsOpen = !appTagsOpen">
                  <span>Manage tags</span>
                  <span class="dv-manage-toggle__chev" :style="{ transform: appTagsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }"><IconChevronDown :size="16" /></span>
                </button>
                <Transition name="dv-expand">
                  <div v-if="appTagsOpen" class="dv-manage-body">
              <div class="dv-config__title">Manage tags</div>
              <div v-for="tg in appTagManager.tags" :key="tg.label" class="dv-tag-row">
                <div class="dv-tag-left">
                  <span class="dv-tag-dot" :style="{ background: tg.fg }"></span><span>{{ tg.label }}</span>
                </div>
                <button type="button" class="dv-remove" @click="tg.remove">Remove</button>
              </div>
              <div v-if="appTagManager.hasAvailableTags" class="dv-avail">
                <div class="dv-config__title">Existing tags</div>
                <div class="dv-avail__list">
                  <button
                    v-for="at in appTagManager.availableTags"
                    :key="at.label"
                    type="button"
                    class="dv-avail-tag"
                    :class="{ 'dv-avail-tag--registered': at.registered }"
                    :style="{ background: at.bg, color: at.fg, borderColor: 'var(--gray-100)' }"
                    @click="at.toggle"
                  >
                    <span class="dv-dot" :style="{ background: at.fg }"></span>{{ at.label }}
                  </button>
                </div>
              </div>
              <div class="dv-add">
                <button type="button" class="dv-color-btn" @click="appTagManager.toggleColorPicker">
                  <span class="dv-color-swatch" :style="{ background: appTagManager.currentColorSwatch }"></span><IconChevronDown :size="16" class="dv-icon" />
                </button>
                <input :value="appTagManager.newTagText" @input="appTagManager.onNewTagChange" @keydown="appTagManager.onNewTagKeyDown" placeholder="new tag name…" class="dv-input" />
                <button type="button" class="dv-add-btn" @click="appTagManager.commitAdd">Add</button>
              </div>
              <Transition name="dv-expand">
                <div v-if="appTagManager.colorPickerOpen" class="dv-palette">
                  <button
                    v-for="cs in appTagManager.colorSwatches"
                    :key="cs.swatch"
                    type="button"
                    class="dv-swatch"
                    :style="{ background: cs.swatch, borderColor: cs.ring }"
                    @click="cs.select"
                  ></button>
                </div>
              </Transition>
                </div>
              </Transition>
              </div>
            </div>
            <div ref="branchScrollRef" class="dv-webapp-body" @scroll="updateBranchScroll">
              <div class="dv-branch-list">
                <div class="dv-branch-head"><span>Path</span></div>
                <div v-for="b in webappBranches" :key="b.id" class="dv-branch">
                  <div class="dv-branch__row dv-branch__row--static">
                    <span class="dv-branch__url">{{ b.url }}</span>
                  </div>
                </div>
              </div>
              <div v-if="canScrollBranchDown" class="dv-branch-hint"><IconChevronDown :size="16" /></div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showNetworkDetailModal" class="modal-backdrop" @mousedown.self="closeNetworkDetail">
          <div class="dv-modal">
            <div class="dv-modal__head">
              <div>
                <div class="dv-modal__title">Network details</div>
                <div class="dv-modal__sub">{{ networkDetail?.endpoint }}</div>
                <div class="dv-modal__meta">Asset owner: {{ networkDetail?.owner }} · Last scanned: {{ networkDetail?.lastScanned }}</div>
              </div>
              <button type="button" class="dv-modal__close" @click="closeNetworkDetail"><IconX :size="18" /></button>
            </div>
            <div class="dv-modal__body">
              <div v-if="networkDetail?.endpointType !== 'IP Single'" class="dv-subpane">
                <div class="dv-subpane__head"><span>IP Addresses</span><span>{{ networkDetailHosts.length }} Total</span></div>
                <div ref="netHostListRef" class="dv-subpane__list" @scroll="updateNetHostScrollState">
                  <button
                    v-for="h in networkDetailHostItems"
                    :key="h.id"
                    type="button"
                    class="dv-sub dv-sub--host"
                    :data-active="h.active"
                    :style="{ background: h.bg }"
                    @click="h.select"
                  >
                    <IconSitemap :size="15" :style="{ color: h.color }" />
                    <span :style="{ color: h.color, fontFamily: `'JetBrains Mono', 'Fira Code', monospace`, fontSize: '12.5px' }">{{ h.endpoint }}</span>
                  </button>
                </div>
                <div v-if="netHostCanScrollDown" class="dv-subpane__hint"><IconChevronDown :size="16" class="dv-hint-icon" /></div>
              </div>
              <div class="dv-ippane" :class="{ 'dv-ippane--full': networkDetail?.endpointType === 'IP Single' }">
                <template v-if="networkHostActiveCard">
                  <template v-if="networkDetail?.endpointType !== 'IP Single'">
                    <div class="dv-ippane__head"><span>Host details</span></div>
                    <div class="dv-ippane__sub">for {{ networkDetail?.endpoint }}</div>
                  </template>

                  <div class="host-detail__row">
                    <div class="host-detail__col">
                      <div class="dv-config__title">Location</div>
                      <div class="host-detail__value">{{ networkHostActiveCard.location }}</div>
                    </div>
                    <div class="host-detail__col">
                      <div class="dv-config__title">OS Detection</div>
                      <div class="host-detail__value">{{ networkHostActiveCard.os }}</div>
                    </div>
                  </div>

                  <div class="host-detail__tags-stack">
                    <div class="dv-manage">
                      <div class="dv-manage__static">
                        <div class="dv-config__title">Multi tag</div>
                        <div v-if="networkHostActiveCard.hasTags" class="dv-tags" style="padding-left: 0;">
                          <span v-for="tg in networkHostActiveCard.tags" :key="tg.label" class="dv-tag" :style="{ background: tg.bg, color: tg.fg }">{{ tg.label }}</span>
                        </div>
                        <div v-else class="dv-manage__empty">No tags yet.</div>
                      </div>
                    </div>
                    <div v-if="networkDetail?.endpointType !== 'IP Single'" class="dv-manage">
                      <button type="button" class="dv-manage-toggle" @click="netHostTagsOpen = !netHostTagsOpen">
                        <span>Manage tags</span>
                        <span class="dv-manage-toggle__chev" :style="{ transform: netHostTagsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }"><IconChevronDown :size="16" /></span>
                      </button>
                      <Transition name="dv-expand">
                        <div v-if="netHostTagsOpen" class="dv-manage-body">
                          <div class="dv-config__title">Manage tags</div>
                          <div v-for="tg in networkHostActiveCard.tags" :key="tg.label" class="dv-tag-row">
                            <div class="dv-tag-left">
                              <span class="dv-tag-dot" :style="{ background: tg.fg }"></span><span>{{ tg.label }}</span>
                            </div>
                            <button type="button" class="dv-remove" @click="tg.remove">Remove</button>
                          </div>
                          <div v-if="networkHostActiveCard.hasAvailableTags" class="dv-avail">
                            <div class="dv-config__title">Existing tags</div>
                            <div class="dv-avail__list">
                              <button
                                v-for="at in networkHostActiveCard.availableTags"
                                :key="at.label"
                                type="button"
                                class="dv-avail-tag"
                                :class="{ 'dv-avail-tag--registered': at.registered }"
                                :style="{ background: at.bg, color: at.fg, borderColor: 'var(--gray-100)' }"
                                @click="at.toggle"
                              >
                                <span class="dv-dot" :style="{ background: at.fg }"></span>{{ at.label }}
                              </button>
                            </div>
                          </div>
                          <div class="dv-add">
                            <button type="button" class="dv-color-btn" @click="networkHostActiveCard.toggleColorPicker">
                              <span class="dv-color-swatch" :style="{ background: networkHostActiveCard.currentColorSwatch }"></span><IconChevronDown :size="16" class="dv-icon" />
                            </button>
                            <input :value="networkHostActiveCard.newTagText" @input="networkHostActiveCard.onNewTagChange" @keydown="networkHostActiveCard.onNewTagKeyDown" placeholder="new tag name…" class="dv-input" />
                            <button type="button" class="dv-add-btn" @click="networkHostActiveCard.commitAdd">Add</button>
                          </div>
                          <Transition name="dv-expand">
                            <div v-if="networkHostActiveCard.colorPickerOpen" class="dv-palette">
                              <button
                                v-for="cs in networkHostActiveCard.colorSwatches"
                                :key="cs.swatch"
                                type="button"
                                class="dv-swatch"
                                :style="{ background: cs.swatch, borderColor: cs.ring }"
                                @click="cs.select"
                              ></button>
                            </div>
                          </Transition>
                        </div>
                      </Transition>
                    </div>
                  </div>

                  <div class="dv-ip">
                    <div class="dv-config dv-config--flush">
                      <div class="dv-subtabs">
                        <button
                          type="button"
                          class="dv-subtab"
                          :class="{ 'dv-subtab--active': networkHostActiveCard.subTab === 'ports' }"
                          @click="networkHostActiveCard.setSubTab('ports')"
                        >Ports & services</button>
                        <button
                          type="button"
                          class="dv-subtab"
                          :class="{ 'dv-subtab--active': networkHostActiveCard.subTab === 'tech' }"
                          @click="networkHostActiveCard.setSubTab('tech')"
                        >Technology</button>
                      </div>
                      <div v-if="networkHostActiveCard.subTab === 'tech'" class="dv-ports">
                        <div class="dv-ports__head dv-ports__head--tech">
                          <span>Technology</span>
                        </div>
                        <div v-for="p in networkHostActiveCard.ports" :key="p.port" class="dv-ports__row dv-ports__row--tech">
                          <span class="dv-ports__tech">{{ p.technology }}</span>
                        </div>
                        <div v-if="!networkHostActiveCard.ports.length" class="dv-ports__empty">No technology detected.</div>
                      </div>
                      <div v-else class="dv-ports">
                        <div class="dv-ports__head">
                          <span>Port</span><span>Protocol</span><span>Service</span>
                        </div>
                        <div v-for="p in networkHostActiveCard.ports" :key="p.port" class="dv-ports__row dv-ports__row--short">
                          <span class="dv-ports__port">{{ p.port }}</span>
                          <span>{{ p.protocol }}</span>
                          <span>{{ p.service }}</span>
                        </div>
                        <div v-if="!networkHostActiveCard.ports.length" class="dv-ports__empty">No open ports detected.</div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showManageTagsModal && modalTagManager" class="modal-backdrop" @mousedown.self="closeManageTagsModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Manage Tags</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeManageTagsModal">
                <IconX :size="20" />
              </button>
            </div>
            <p class="create-modal__desc">Tags for <b>{{ assetName(manageTagsRow) }}</b></p>

            <div class="create-modal__body">
              <div v-if="modalTagManager.hasTags" class="dv-tags" style="padding-left: 0;">
                <span v-for="tg in modalTagManager.tags" :key="tg.label" class="dv-tag" :style="{ background: tg.bg, color: tg.fg }">{{ tg.label }}</span>
              </div>
              <div v-else class="dv-manage__empty">No tags yet.</div>

              <label class="create-modal__label">Existing tags</label>
              <div class="dv-avail__list">
                <button
                  v-for="at in modalTagManager.availableTags"
                  :key="at.label"
                  type="button"
                  class="dv-avail-tag"
                  :class="{ 'dv-avail-tag--registered': at.registered }"
                  :style="{ background: at.bg, color: at.fg, borderColor: 'var(--gray-100)' }"
                  @click="at.toggle"
                >
                  <span class="dv-dot" :style="{ background: at.fg }"></span>{{ at.label }}
                </button>
              </div>

              <label class="create-modal__label">New tag</label>
              <div class="dv-add">
                <button type="button" class="dv-color-btn" @click="modalPickerOpen = !modalPickerOpen">
                  <span class="dv-color-swatch" :style="{ background: modalTagManager.currentColorSwatch }"></span><IconChevronDown :size="16" class="dv-icon" />
                </button>
                <input v-model="tagQuery" type="text" placeholder="new tag name…" class="dv-input" @keydown.enter="modalTagManager.commitAdd" />
                <button type="button" class="dv-add-btn" :disabled="!tagQuery.trim()" @click="modalTagManager.commitAdd">Add</button>
              </div>
              <p class="dv-enter-hint">Press Enter to add the new tag.</p>
              <Transition name="dv-expand">
                <div v-if="modalPickerOpen" class="dv-palette dv-palette--inline">
                  <button
                    v-for="cs in modalTagManager.colorSwatches"
                    :key="cs.swatch"
                    type="button"
                    class="dv-swatch"
                    :style="{ background: cs.swatch, borderColor: cs.ring }"
                    @click="cs.select"
                  ></button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showSourceDetailModal" class="modal-backdrop" @mousedown.self="closeSourceDetail">
          <div class="dv-modal dv-modal--narrow">
            <div class="dv-modal__head">
              <div>
                <div class="dv-modal__title">Asset details</div>
                <div class="dv-modal__sub">{{ sourceDetail?.repoOwner || 'protergo-cyber-security' }}</div>
                <div class="dv-modal__meta">Last scanned: {{ sourceDetail?.lastScanned || '—' }}</div>
              </div>
              <button type="button" class="dv-modal__close" @click="closeSourceDetail"><IconX :size="18" /></button>
            </div>
            <div class="dv-app-tags">
              <div class="dv-manage">
                <div class="dv-manage__static">
                  <div class="dv-config__title">Multi tag</div>
                  <div v-if="sourceTagManager.hasTags" class="dv-tags" style="padding-left: 0;">
                    <span v-for="tg in sourceTagManager.tags" :key="tg.label" class="dv-tag" :style="{ background: tg.bg, color: tg.fg }">{{ tg.label }}</span>
                  </div>
                  <div v-else class="dv-manage__empty">No tags yet.</div>
                </div>
              </div>
              <div class="dv-manage">
                <button type="button" class="dv-manage-toggle" @click="sourceTagsOpen = !sourceTagsOpen">
                  <span>Manage tags</span>
                  <span class="dv-manage-toggle__chev" :style="{ transform: sourceTagsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }"><IconChevronDown :size="16" /></span>
                </button>
                <Transition name="dv-expand">
                  <div v-if="sourceTagsOpen" class="dv-manage-body">
                    <div class="dv-config__title">Manage tags</div>
                    <div v-for="tg in sourceTagManager.tags" :key="tg.label" class="dv-tag-row">
                      <div class="dv-tag-left">
                        <span class="dv-tag-dot" :style="{ background: tg.fg }"></span><span>{{ tg.label }}</span>
                      </div>
                      <button type="button" class="dv-remove" @click="tg.remove">Remove</button>
                    </div>
                    <div v-if="sourceTagManager.hasAvailableTags" class="dv-avail">
                      <div class="dv-config__title">Existing tags</div>
                      <div class="dv-avail__list">
                        <button
                          v-for="at in sourceTagManager.availableTags"
                          :key="at.label"
                          type="button"
                          class="dv-avail-tag"
                          :class="{ 'dv-avail-tag--registered': at.registered }"
                          :style="{ background: at.bg, color: at.fg, borderColor: 'var(--gray-100)' }"
                          @click="at.toggle"
                        >
                          <span class="dv-dot" :style="{ background: at.fg }"></span>{{ at.label }}
                        </button>
                      </div>
                    </div>
                    <div class="dv-add">
                      <button type="button" class="dv-color-btn" @click="sourceTagManager.toggleColorPicker">
                        <span class="dv-color-swatch" :style="{ background: sourceTagManager.currentColorSwatch }"></span><IconChevronDown :size="16" class="dv-icon" />
                      </button>
                      <input :value="sourceTagManager.newTagText" @input="sourceTagManager.onNewTagChange" @keydown="sourceTagManager.onNewTagKeyDown" placeholder="new tag name…" class="dv-input" />
                      <button type="button" class="dv-add-btn" @click="sourceTagManager.commitAdd">Add</button>
                    </div>
                    <Transition name="dv-expand">
                      <div v-if="sourceTagManager.colorPickerOpen" class="dv-palette dv-palette--inline">
                        <button
                          v-for="cs in sourceTagManager.colorSwatches"
                          :key="cs.swatch"
                          type="button"
                          class="dv-swatch"
                          :style="{ background: cs.swatch, borderColor: cs.ring }"
                          @click="cs.select"
                        ></button>
                      </div>
                    </Transition>
                    <p class="dv-enter-hint">Press Enter to add the new tag.</p>
                  </div>
                </Transition>
              </div>
            </div>
            <div ref="sourceBranchScrollRef" class="dv-webapp-body" @scroll="updateSourceScroll">
              <div class="dv-branch-list">
                <div class="dv-branch-head"><span>Branch</span></div>
                <div v-for="b in filteredSourceBranches" :key="b.id" class="dv-branch">
                  <div class="dv-branch__row dv-branch__row--static">
                    <span class="dv-branch__url">{{ b.name }}</span>
                  </div>
                </div>
              </div>
              <div v-if="canScrollSourceDown" class="dv-branch-hint"><IconChevronDown :size="16" /></div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showRegisterModal" class="modal-backdrop" @mousedown.self="closeRegisterModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Register Domain</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeRegisterModal">
                <IconX :size="20" />
              </button>
            </div>
            <p class="create-modal__desc">Once the domain is registered, it will go through scanning to discover and find all endpoints that are related to the domain.</p>

            <div class="create-modal__body">
              <label class="create-modal__label">Asset Owner<span class="create-modal__required">*</span></label>
              <div class="form-select">
                <button type="button" class="form-select__trigger" @click="toggleRegisterField('owner')">
                  <span :class="{ 'form-select__trigger-text--placeholder': !registerOwner }">
                    {{ ownerOptions.find((o) => o.value === registerOwner)?.label ?? 'Asset Owner' }}
                  </span>
                  <IconChevronDown :size="18" class="form-select__chevron" :class="{ 'form-select__chevron--open': registerField === 'owner' }" />
                </button>
                <div class="select-panel" :class="{ open: registerField === 'owner' }">
                  <div class="form-select__inline-menu select-panel__inner">
                    <button
                      v-for="opt in ownerOptions"
                      :key="opt.value"
                      type="button"
                      class="form-select__inline-item"
                      :class="{ 'form-select__inline-item--active': opt.value === registerOwner }"
                      @click="selectRegisterOwner(opt.value)"
                    >
                      {{ opt.label }}
                    </button>
                  </div>
                </div>
              </div>

              <label class="create-modal__label">Domain<span class="create-modal__required">*</span></label>
              <input
                v-model="registerDomain"
                type="text"
                class="create-modal__input"
                :class="{ 'create-modal__input--error': !!registerDomainError }"
                placeholder="Input Domain"
              />
              <p v-if="registerDomainError" class="field-error">{{ registerDomainError }}</p>
            </div>

            <div class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeRegisterModal">Cancel</button>
              <button
                type="button"
                class="modal-btn"
                :class="canProceedRegister ? { 'modal-btn--save': true, 'modal-btn--saved': registerState === 'saved' } : 'modal-btn--create'"
                :disabled="!canProceedRegister"
                @click="submitRegister"
              >
                <span v-if="registerState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="registerState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Register</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showRegisterWebappModal" class="modal-backdrop" @mousedown.self="closeRegisterWebappModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Register Web Application</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeRegisterWebappModal">
                <IconX :size="20" />
              </button>
            </div>

            <div class="create-modal__body">
              <label class="create-modal__label">Asset Owner<span class="create-modal__required">*</span></label>
              <div class="form-select">
                <button type="button" class="form-select__trigger" @click="toggleRegWAField('owner')">
                  <span :class="{ 'form-select__trigger-text--placeholder': !regWAOwner }">
                    {{ ownerOptions.find((o) => o.value === regWAOwner)?.label ?? 'Asset Owner' }}
                  </span>
                  <IconChevronDown :size="18" class="form-select__chevron" :class="{ 'form-select__chevron--open': regWAField === 'owner' }" />
                </button>
                <div class="select-panel" :class="{ open: regWAField === 'owner' }">
                  <div class="form-select__inline-menu select-panel__inner">
                    <button
                      v-for="opt in ownerOptions"
                      :key="opt.value"
                      type="button"
                      class="form-select__inline-item"
                      :class="{ 'form-select__inline-item--active': opt.value === regWAOwner }"
                      @click="selectRegWAOwner(opt.value)"
                    >
                      {{ opt.label }}
                    </button>
                  </div>
                </div>
              </div>

              <label class="create-modal__label">Application Name<span class="create-modal__required">*</span></label>
              <input v-model="regWAName" type="text" class="create-modal__input" placeholder="Application Name" />

              <label class="create-modal__label">Input URL<span class="create-modal__required">*</span></label>
              <input
                v-model="regWAUrl"
                type="text"
                class="create-modal__input"
                :class="{ 'create-modal__input--error': !!regWAUrlError }"
                placeholder="Input URL"
              />
              <p v-if="regWAUrlError" class="field-error">{{ regWAUrlError }}</p>

              <label class="create-modal__label">Authentication</label>
              <div class="basic-auth-card">
                <div class="basic-auth-card__row">
                  <span class="basic-auth-card__title">Basic Authentication</span>
                  <button
                    type="button"
                    class="toggle-switch"
                    :class="{ 'toggle-switch--on': regWABasic }"
                    role="switch"
                    :aria-checked="regWABasic"
                    @click="regWABasic = !regWABasic"
                  >
                    <span class="toggle-switch__thumb" />
                  </button>
                </div>
                <Transition name="dv-expand">
                  <div v-if="regWABasic" class="basic-auth-card__fields">
                    <label class="create-modal__label">Username<span class="create-modal__required">*</span></label>
                    <input v-model="regWAUser" type="text" class="create-modal__input" placeholder="Username" />
                    <label class="create-modal__label">Password<span class="create-modal__required">*</span></label>
                    <input v-model="regWAPass" type="password" class="create-modal__input" placeholder="Password" />
                  </div>
                </Transition>
              </div>
            </div>

            <div class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeRegisterWebappModal">Cancel</button>
              <button
                type="button"
                class="modal-btn"
                :class="canRegisterWebapp ? { 'modal-btn--save': true, 'modal-btn--saved': regWAState === 'saved' } : 'modal-btn--create'"
                :disabled="!canRegisterWebapp"
                @click="submitRegisterWebapp"
              >
                <span v-if="regWAState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="regWAState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Register</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showRegisterNetworkModal" class="modal-backdrop" @mousedown.self="closeRegisterNetworkModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Register Network</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeRegisterNetworkModal">
                <IconX :size="20" />
              </button>
            </div>

            <div class="create-modal__body">
              <label class="create-modal__label">Asset Owner<span class="create-modal__required">*</span></label>
              <div class="form-select">
                <button type="button" class="form-select__trigger" @click="toggleRegNetField('owner')">
                  <span :class="{ 'form-select__trigger-text--placeholder': !regNetOwner }">
                    {{ ownerOptions.find((o) => o.value === regNetOwner)?.label ?? 'Asset Owner' }}
                  </span>
                  <IconChevronDown :size="18" class="form-select__chevron" :class="{ 'form-select__chevron--open': regNetField === 'owner' }" />
                </button>
                <div class="select-panel" :class="{ open: regNetField === 'owner' }">
                  <div class="form-select__inline-menu select-panel__inner">
                    <button
                      v-for="opt in ownerOptions"
                      :key="opt.value"
                      type="button"
                      class="form-select__inline-item"
                      :class="{ 'form-select__inline-item--active': opt.value === regNetOwner }"
                      @click="selectRegNetOwner(opt.value)"
                    >
                      {{ opt.label }}
                    </button>
                  </div>
                </div>
              </div>

              <label class="create-modal__label">IP Address Type<span class="create-modal__required">*</span></label>
              <div class="form-select">
                <button type="button" class="form-select__trigger" @click="toggleRegNetField('type')">
                  <span :class="{ 'form-select__trigger-text--placeholder': !regNetType }">
                    {{ ipTypeOptions.find((o) => o.value === regNetType)?.label ?? 'IP Address Type' }}
                  </span>
                  <span class="form-select__trigger-icons">
                    <IconX v-if="regNetType" :size="16" class="form-select__clear" @click.stop="clearRegNetType" />
                    <IconChevronDown :size="18" class="form-select__chevron" :class="{ 'form-select__chevron--open': regNetField === 'type' }" />
                  </span>
                </button>
                <div class="select-panel" :class="{ open: regNetField === 'type' }">
                  <div class="form-select__inline-menu select-panel__inner">
                    <button
                      v-for="opt in ipTypeOptions"
                      :key="opt.value"
                      type="button"
                      class="form-select__inline-item"
                      :class="{ 'form-select__inline-item--active': opt.value === regNetType }"
                      @click="selectRegNetType(opt.value)"
                    >
                      {{ opt.label }}
                    </button>
                  </div>
                </div>
              </div>

              <Transition name="dv-expand">
                <div v-if="regNetType === 'single'" class="ip-field-gap">
                  <input
                    :value="regNetIp"
                    @input="onRegNetIpInput"
                    type="text"
                    inputmode="decimal"
                    class="create-modal__input"
                    :class="{ 'create-modal__input--error': !!regNetIpError }"
                    placeholder="Input IP Address*"
                  />
                  <p v-if="regNetIpError" class="field-error">{{ regNetIpError }}</p>
                  <p v-else class="field-hint">Example: 1.xx.34.82</p>
                </div>
                <div v-else-if="regNetType === 'range'" class="ip-range-row ip-field-gap">
                  <div class="ip-range-row__field">
                    <input
                      :value="regNetIp"
                      @input="onRegNetIpInput"
                      type="text"
                      inputmode="decimal"
                      class="create-modal__input"
                      :class="{ 'create-modal__input--error': !!regNetIpError }"
                      placeholder="IP Address*"
                    />
                    <p v-if="regNetIpError" class="field-error">{{ regNetIpError }}</p>
                    <p v-else class="field-hint">Example: 1.xx.34.0</p>
                  </div>
                  <span class="ip-range-row__sep">/</span>
                  <div class="ip-range-row__field">
                    <input
                      :value="regNetRange"
                      @input="onRegNetRangeInput"
                      type="text"
                      inputmode="numeric"
                      class="create-modal__input"
                      :class="{ 'create-modal__input--error': !!regNetRangeError }"
                      placeholder="Range*"
                    />
                    <p v-if="regNetRangeError" class="field-error">{{ regNetRangeError }}</p>
                    <p v-else class="field-hint">Example: 24</p>
                  </div>
                </div>
              </Transition>
            </div>

            <div class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeRegisterNetworkModal">Cancel</button>
              <button
                type="button"
                class="modal-btn"
                :class="canRegisterNetwork ? { 'modal-btn--save': true, 'modal-btn--saved': regNetState === 'saved' } : 'modal-btn--create'"
                :disabled="!canRegisterNetwork"
                @click="submitRegisterNetwork"
              >
                <span v-if="regNetState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="regNetState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Proceed</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showRegisterSourceModal" class="modal-backdrop" @mousedown.self="closeRegisterSourceModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Register Repository</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeRegisterSourceModal">
                <IconX :size="20" />
              </button>
            </div>

            <div class="create-modal__body">
              <label class="create-modal__label">Asset Owner<span class="create-modal__required">*</span></label>
              <div class="form-select">
                <button type="button" class="form-select__trigger" @click="toggleRegSrcField('owner')">
                  <span :class="{ 'form-select__trigger-text--placeholder': !regSrcOwner }">
                    {{ ownerOptions.find((o) => o.value === regSrcOwner)?.label ?? 'Asset Owner' }}
                  </span>
                  <IconChevronDown :size="18" class="form-select__chevron" :class="{ 'form-select__chevron--open': regSrcField === 'owner' }" />
                </button>
                <div class="select-panel" :class="{ open: regSrcField === 'owner' }">
                  <div class="form-select__inline-menu select-panel__inner">
                    <button
                      v-for="opt in ownerOptions"
                      :key="opt.value"
                      type="button"
                      class="form-select__inline-item"
                      :class="{ 'form-select__inline-item--active': opt.value === regSrcOwner }"
                      @click="selectRegSrcOwner(opt.value)"
                    >
                      {{ opt.label }}
                    </button>
                  </div>
                </div>
              </div>

              <label class="create-modal__label">Git Provider<span class="create-modal__required">*</span></label>
              <div class="form-select">
                <button type="button" class="form-select__trigger" @click="toggleRegSrcField('provider')">
                  <span :class="{ 'form-select__trigger-text--placeholder': !regSrcProvider }">
                    {{ gitProviderOptions.find((o) => o.value === regSrcProvider)?.label ?? 'Git Provider' }}
                  </span>
                  <IconChevronDown :size="18" class="form-select__chevron" :class="{ 'form-select__chevron--open': regSrcField === 'provider' }" />
                </button>
                <div class="select-panel" :class="{ open: regSrcField === 'provider' }">
                  <div class="form-select__inline-menu select-panel__inner">
                    <button
                      v-for="opt in gitProviderOptions"
                      :key="opt.value"
                      type="button"
                      class="form-select__inline-item"
                      :class="{ 'form-select__inline-item--active': opt.value === regSrcProvider }"
                      @click="selectRegSrcProvider(opt.value)"
                    >
                      {{ opt.label }}
                    </button>
                  </div>
                </div>
              </div>

              <label class="create-modal__label">URL Repository<span class="create-modal__required">*</span></label>
              <input
                v-model="regSrcRepoUrl"
                type="text"
                class="create-modal__input"
                :class="{ 'create-modal__input--error': !!regSrcRepoUrlError }"
                placeholder="URL Repository"
              />
              <p v-if="regSrcRepoUrlError" class="field-error">{{ regSrcRepoUrlError }}</p>

              <label class="create-modal__label">Repository Visibility<span class="create-modal__required">*</span></label>
              <div class="form-select">
                <button type="button" class="form-select__trigger" @click="toggleRegSrcField('visibility')">
                  <span :class="{ 'form-select__trigger-text--placeholder': !regSrcVisibility }">
                    {{ repoVisibilityOptions.find((o) => o.value === regSrcVisibility)?.label ?? 'Repository Visibility' }}
                  </span>
                  <span class="form-select__trigger-icons">
                    <IconX v-if="regSrcVisibility" :size="16" class="form-select__clear" @click.stop="clearRegSrcVisibility" />
                    <IconChevronDown :size="18" class="form-select__chevron" :class="{ 'form-select__chevron--open': regSrcField === 'visibility' }" />
                  </span>
                </button>
                <div class="select-panel" :class="{ open: regSrcField === 'visibility' }">
                  <div class="form-select__inline-menu select-panel__inner">
                    <button
                      v-for="opt in repoVisibilityOptions"
                      :key="opt.value"
                      type="button"
                      class="form-select__inline-item"
                      :class="{ 'form-select__inline-item--active': opt.value === regSrcVisibility }"
                      @click="selectRegSrcVisibility(opt.value)"
                    >
                      {{ opt.label }}
                    </button>
                  </div>
                </div>
              </div>

              <Transition name="dv-expand">
                <div v-if="regSrcVisibility === 'private'">
                  <label class="create-modal__label">Personal Access Token<span class="create-modal__required">*</span></label>
                  <input v-model="regSrcToken" type="password" class="create-modal__input" placeholder="Personal Access Token" autocomplete="off" />
                </div>
              </Transition>
            </div>

            <div class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeRegisterSourceModal">Cancel</button>
              <button
                type="button"
                class="modal-btn"
                :class="canRegisterSource ? { 'modal-btn--save': true, 'modal-btn--saved': regSrcState === 'saved' } : 'modal-btn--create'"
                :disabled="!canRegisterSource"
                @click="submitRegisterSource"
              >
                <span v-if="regSrcState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="regSrcState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Proceed</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showTagDetailModal" class="modal-backdrop" @mousedown.self="closeTagDetail">
          <div class="tag-modal">
            <div class="tag-modal__clip">
              <header class="tag-head" :style="{ background: selectedTag?.bg }">
                <div class="tag-head__top">
                  <span class="tag-head__eyebrow" :style="{ color: selectedTag?.color }">Tag details</span>
                  <div class="tag-head__actions">
                    <button
                      type="button"
                      class="tag-icon-btn tag-head__more"
                      :style="{ color: selectedTag?.color }"
                      aria-haspopup="menu"
                      :aria-expanded="tagMenuOpen"
                      aria-label="More actions"
                      @click.stop="tagMenuOpen = !tagMenuOpen"
                    >
                      <IconDotsVertical :size="18" />
                    </button>
                    <button type="button" class="tag-icon-btn" :style="{ color: selectedTag?.color }" aria-label="Close" @click="closeTagDetail">
                      <IconX :size="18" />
                    </button>
                  </div>
                </div>
                <div class="tag-head__main">
                  <input
                    v-if="tagRenaming"
                    v-model="tagRenameText"
                    type="text"
                    class="tag-head__rename-input"
                    :style="{ color: selectedTag?.color }"
                    autofocus
                    @keydown.enter="commitRenameTag"
                    @keydown.esc="tagRenaming = false"
                    @blur="commitRenameTag"
                  />
                  <span v-else class="tag-head__name" :style="{ color: selectedTag?.color }">{{ selectedTag?.name }}</span>
                  <span class="tag-head__count" :style="{ color: selectedTag?.color }">{{ tagDetailUsage.length }} asset{{ tagDetailUsage.length === 1 ? '' : 's' }}</span>
                </div>
              </header>

              <div v-if="tagDetailUsage.length" class="tag-asset-list">
                <div v-for="item in tagDetailUsage" :key="item.type + item.name" class="tag-asset">
                  <span class="tag-asset__icon" :class="typeIconClass(item.type)">
                    <component :is="typeIcon(item.type)" :size="16" />
                  </span>
                  <div class="tag-asset__meta">
                    <span class="tag-asset__name" :class="{ 'tag-asset__name--mono': item.type === 'Network' || item.type === 'Network Host' }">{{ item.name }}</span>
                    <span class="tag-asset__type">{{ item.type }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="tag-asset-list__empty">No assets currently use this tag.</div>
            </div>

            <Transition name="dv-expand">
              <div v-if="tagMenuOpen" class="tag-menu is-open" role="menu">
                <button type="button" class="tag-menu__item" role="menuitem" @click="startRenameTag">
                  <IconPencil :size="16" /> Rename
                </button>
                <button type="button" class="tag-menu__item" role="menuitem" @click="toggleTagColorPicker">
                  <IconPalette :size="16" /> Change color
                </button>
                <button type="button" class="tag-menu__item tag-menu__item--danger" role="menuitem" @click="deleteSelectedTag">
                  <IconTrash :size="16" /> Delete tag
                </button>
              </div>
            </Transition>

            <Transition name="dv-expand">
              <div v-if="tagColorPickerOpen" class="tag-color-picker">
                <button
                  v-for="(c, i) in tagColors"
                  :key="c.swatch"
                  type="button"
                  class="dv-swatch"
                  :style="{ background: c.swatch, borderColor: selectedTag?.color === c.fg ? '#0284c7' : 'transparent' }"
                  @click="changeTagColor(i)"
                ></button>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDeleteAssetModal" class="modal-backdrop" @mousedown.self="closeDeleteAssetModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Delete Domain</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeDeleteAssetModal">
                <IconX :size="20" />
              </button>
            </div>
            <p class="create-modal__desc">This asset (<b>{{ assetName(deleteAssetTarget) }}</b>) will be permanently deleted from the system. Once removed, its data cannot be recovered, viewed, or restored under any circumstances. Please make sure you no longer need this asset, or have exported a copy if necessary, before proceeding with this action.</p>
            <label class="delete-ack">
              <input v-model="deleteAssetConfirmed" type="checkbox" class="delete-ack__box" />
              <span>This action is permanent and cannot be undone.</span>
            </label>
            <div class="create-modal__actions">
              <button
                type="button"
                class="modal-btn"
                :class="deleteAssetConfirmed
                  ? { 'modal-btn--save': true, 'modal-btn--saved': deleteAssetState === 'saved' }
                  : 'modal-btn--create'"
                :disabled="!deleteAssetConfirmed || deleteAssetState !== 'idle'"
                @click="confirmDeleteAsset"
              >
                <span v-if="deleteAssetState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="deleteAssetState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Delete</span>
              </button>
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeDeleteAssetModal">Cancel</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showRescanModal" class="modal-backdrop" @mousedown.self="closeRescanModal">
          <div class="create-modal">
            <div class="create-modal__head">
              <h2 class="create-modal__title">Re-scan Domain</h2>
              <button type="button" class="create-modal__close" aria-label="Close" @click="closeRescanModal">
                <IconX :size="20" />
              </button>
            </div>
            <p class="create-modal__desc">This asset (<b>{{ assetName(rescanTarget) }}</b>) will be queued for re-scanning. The scan will re-discover all related endpoints and update the last scanned date once it completes.</p>
            <div class="create-modal__actions">
              <button type="button" class="modal-btn modal-btn--cancel" @click="closeRescanModal">Cancel</button>
              <button
                type="button"
                class="modal-btn"
                :class="{ 'modal-btn--save': true, 'modal-btn--saved': rescanState === 'saved' }"
                :disabled="rescanState !== 'idle'"
                @click="confirmRescan"
              >
                <span v-if="rescanState === 'loading'" class="modal-btn__spinner" />
                <IconCheck v-else-if="rescanState === 'saved'" :size="18" class="modal-btn__check" />
                <span v-else>Re-scan</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.asset-mgmt {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__title { font-family: 'Manrope', 'Inter', sans-serif; font-size: 24px; font-weight: 800; color: var(--glacia-ink); margin: 0; line-height: 1.2; }
  &__sub { font-size: 13px; color: var(--glacia-ink-dim); margin: 8px 0 0; b { color: var(--glacia-ink); font-weight: 700; } }
  &__desc { margin: 12px 0 24px; max-width: 900px; font-size: 13px; line-height: 1.6; color: var(--glacia-ink-dim); }
}

.asset-tabs {
  position: relative;
  display: flex;
  gap: 6px;
  padding: 6px;
  background: var(--glacia-glass-fill-strong);
  border: 1px solid var(--glacia-glass-border);
  border-radius: 999px;
  align-self: flex-start;
  width: max-content;
  max-width: 100%;
  margin-bottom: 16px;

  &__pill {
    position: absolute; z-index: 0; background: #fff; border-radius: 999px;
    box-shadow: 0 2px 8px -2px rgba(16,24,32,0.18);
    &--ready { transition: left 0.42s cubic-bezier(0.3,1.12,0.5,1), top 0.42s cubic-bezier(0.3,1.12,0.5,1), width 0.42s cubic-bezier(0.3,1.12,0.5,1), height 0.42s cubic-bezier(0.3,1.12,0.5,1); }
  }

  &__item {
    position: relative; z-index: 1;
    flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px 16px; border-radius: 999px; border: none;
    background: transparent; font-size: 13px; font-weight: 600; font-family: 'Manrope', 'Inter', sans-serif; color: var(--glacia-ink-dim); cursor: pointer; white-space: nowrap; min-width: 0;
    transition: color 0.2s ease;
    &--active { color: var(--glacia-ink); }
  }

  &__item-inner {
    display: inline-flex; align-items: center; gap: 6px;
    transition: transform 0.32s cubic-bezier(0.34,1.56,0.64,1);
  }
  &__item--active &__item-inner { transform: scale(1.04); }
}

@media (prefers-reduced-motion: reduce) {
  .asset-tabs__pill--ready { transition: none; }
}

.endpoint-kind {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 8px;
  background: var(--glacia-glass-fill-strong);
  border: 1px solid var(--glacia-glass-border);
  align-self: flex-start;
  width: max-content;
  max-width: 100%;

  &--inline {
    align-self: center;
    flex-shrink: 0;
  }

  &__pill {
    position: absolute; z-index: 0; background: var(--glacia-red); border-radius: 8px;
    box-shadow: 0 2px 8px rgba(255,37,41,0.35);
    &--ready { transition: left 0.42s cubic-bezier(0.3,1.12,0.5,1), top 0.42s cubic-bezier(0.3,1.12,0.5,1), width 0.42s cubic-bezier(0.3,1.12,0.5,1), height 0.42s cubic-bezier(0.3,1.12,0.5,1); }
  }

  &__item {
    position: relative;
    z-index: 1;
    flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px 12px; border-radius: 8px; border: none;
    background: transparent; font-size: 13px; font-weight: 600; font-family: 'Manrope', 'Inter', sans-serif;
    color: var(--glacia-ink-dim); cursor: pointer; white-space: nowrap; min-width: 110px;
    transition: color 0.15s;

    &--active { color: #fff; }
  }
}

@media (prefers-reduced-motion: reduce) {
  .endpoint-kind__pill--ready { transition: none; }
}

.asset-controls {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  margin-bottom: 16px;
  &__left { display: flex; gap: 12px; }
  &__right { display: flex; align-items: center; gap: 12px; }
}


.btn-register {
  display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 14px; border-radius: var(--glacia-radius-pill); border: none;
  background: var(--glacia-red); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0;
  box-shadow: 0 6px 20px rgba(255, 37, 41, 0.4); transition: background 0.15s, box-shadow 0.15s;
  &:hover { background: #e01e22; box-shadow: 0 8px 24px rgba(255, 37, 41, 0.5); }
}

.status-pill {
  display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700;
  &--completed { background: #dcfce7; color: #16a34a; }
  &--scanning { background: #fef3c7; color: #F79009; }
  &--queue { background: #e0f2fe; color: #0c4a6e; }
  &--failed { background: #fee2e2; color: #dc2626; }
}

.pill {
  display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
  &--active { background: #dcfce7; color: #16a34a; }
  &--inactive { background: #ECEEF0; color: #5C6470; }
}

.tag-add {
  display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px;
  border: 1px dashed var(--glacia-glass-border); background: #fff; font-size: 12px; font-weight: 500; color: var(--glacia-ink-dim); cursor: pointer;
  &:hover { border-color: var(--glacia-red); color: var(--glacia-red); }

  &--icon {
    width: 22px; height: 22px; padding: 0; justify-content: center; border-radius: 50%; border-style: solid;
  }
}

.cell-tags {
  display: flex; align-items: center; gap: 6px; flex-wrap: nowrap; justify-content: center;
}

.tag-more {
  display: inline-flex; align-items: center; padding: 5px 9px; border-radius: 999px;
  border: none; background: var(--glacia-glass-fill-strong); color: var(--glacia-ink-dim);
  font-size: 11px; font-weight: 700; font-family: 'Manrope', 'Inter', sans-serif;
}

.tag-popover {
  position: fixed; width: 280px; background: #fff; border-radius: 16px;
  box-shadow: 0 16px 40px -8px rgba(16,24,32,0.28); border: 1px solid var(--glacia-glass-border);
  padding: 14px; z-index: 400; display: flex; flex-direction: column; gap: 10px;

  &__title {
    font-size: 12px; font-weight: 700; font-family: 'Manrope', 'Inter', sans-serif;
    color: var(--glacia-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  &__current { display: flex; flex-wrap: wrap; gap: 6px; }

  &__search {
    width: 100%; height: 38px; padding: 0 12px; border-radius: 10px; box-sizing: border-box;
    border: 1px solid var(--glacia-glass-border); font-size: 13px; font-family: 'Manrope', 'Inter', sans-serif;
    outline: none; color: var(--glacia-ink);
    &::placeholder { color: var(--glacia-ink-dim); }
    &:focus { border-color: var(--glacia-red); }
  }

  &__list { display: flex; flex-direction: column; gap: 2px; max-height: 180px; overflow-y: auto; }

  &__item {
    display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 10px;
    border-radius: 8px; border: none; background: transparent; font-size: 13px; font-weight: 500;
    font-family: 'Manrope', 'Inter', sans-serif; color: var(--glacia-ink); cursor: pointer; text-align: left;
    &:hover { background: rgba(255,37,41,0.06); }
    &--added { color: var(--glacia-ink-dim); }
  }

  &__check { margin-left: auto; color: #16a34a; font-weight: 700; }

  &__empty { padding: 8px 10px; font-size: 12px; color: var(--glacia-ink-dim); }

  &__create { display: flex; align-items: center; gap: 8px; }

  &__colors { display: flex; gap: 4px; flex-wrap: wrap; flex: 1; }

  &__swatch {
    width: 18px; height: 18px; border-radius: 50%; border: 2px solid transparent;
    cursor: pointer; padding: 0;
    &--active { border-color: var(--glacia-ink); }
  }

  &__add {
    padding: 8px 14px; border-radius: 9px; border: none; background: var(--glacia-red);
    color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; flex-shrink: 0;
    &:disabled { opacity: 0.4; cursor: default; }
  }
}

.dv-tag__x {
  border: none; background: none; cursor: pointer; color: inherit;
  font-size: 13px; line-height: 1; padding: 0 0 0 2px; opacity: 0.7;
  &:hover { opacity: 1; }
}

.action-btn {
  width: 28px; height: 28px; border-radius: 8px; border: none; background: transparent;
  color: var(--glacia-ink-dim); cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  &:hover { background: rgba(0,0,0,0.05); }
}

.tags-panel {
  background: #fff;
  border: 1px solid var(--glacia-glass-border);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(16,24,32,0.06);

  &__head {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__title {
    font-family: 'Manrope', 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 800;
    color: var(--glacia-ink);
    margin: 0;
  }

  &__desc {
    font-size: 13px;
    line-height: 1.5;
    color: var(--glacia-ink-dim);
    margin: 8px 0 16px;
  }
}
.tags-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;

  @media (max-width: 1100px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 700px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
}
.tags-empty {
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px;
  padding: 48px 24px; border: 1.5px dashed var(--glacia-glass-border); border-radius: 16px;

  &__icon {
    width: 52px; height: 52px; border-radius: 50%; background: var(--glacia-glass-fill-strong);
    color: var(--glacia-ink-dim); display: flex; align-items: center; justify-content: center; margin-bottom: 4px;
  }
  &__title { font-size: 15px; font-weight: 700; color: var(--glacia-ink); }
  &__desc { max-width: 360px; font-size: 13px; color: var(--glacia-ink-dim); margin: 0 0 6px; }
}
.tag-card {
  padding: 16px 18px;
  border-radius: 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 72px;
  cursor: default;
  transition: transform 0.12s, box-shadow 0.12s;
  &:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,24,32,0.08); }

  &__info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  &__name { font-size: 15px; font-weight: 700; line-height: 1.2; }
  &__used { font-size: 13px; font-weight: 400; opacity: 0.85; }
  &__arrow {
    flex: none; width: 30px; height: 30px; border-radius: 50%; border: none; background: rgba(255,255,255,0.55);
    display: flex; align-items: center; justify-content: center; cursor: pointer; color: inherit;
    transition: background 0.15s, transform 0.15s;
    &:hover { background: rgba(255,255,255,0.9); transform: translateX(2px); }
  }
}

.tag-modal {
  position: relative; width: 520px; max-width: 92vw; background: #fff; border-radius: 16px;
  box-shadow: 0 20px 44px -14px rgba(16,24,32,0.28);
}
.tag-modal__clip { border-radius: 16px; overflow: hidden; }

.tag-head { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.tag-head__top { display: flex; align-items: center; justify-content: space-between; }
.tag-head__eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.tag-head__actions { display: flex; align-items: center; gap: 2px; }
.tag-head__main { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.tag-head__name { font-size: 24px; font-weight: 800; line-height: 1.1; }
.tag-head__count { font-size: 13px; font-weight: 600; flex-shrink: 0; }
.tag-head__rename-input {
  font-size: 24px; font-weight: 800; line-height: 1.1; border: none; background: transparent; outline: none;
  border-bottom: 2px solid currentColor; padding: 0; min-width: 0; flex: 1; font-family: inherit;
}

.tag-icon-btn {
  border: none; background: transparent; padding: 6px; border-radius: 999px; cursor: pointer; display: flex;
  transition: background 0.15s;
  &:hover, &[aria-expanded="true"] { background: rgba(0,0,0,0.1); }
}

.tag-asset-list { padding: 16px 20px 20px; display: flex; flex-direction: column; gap: 6px; max-height: 340px; overflow-y: auto; }
.tag-asset-list__empty { padding: 24px 20px; font-size: 13px; color: var(--glacia-ink-dim); text-align: center; }
.tag-asset { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 10px; transition: background 0.12s; &:hover { background: var(--glacia-glass-fill-strong); } }
.tag-asset__icon {
  flex: none; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  &--net { color: #1197C2; }
  &--code { color: var(--glacia-ink-dim); }
  &--web { color: #5C6BC0; }
  &--domain { color: var(--glacia-red); }
}
.tag-asset__meta { display: flex; flex-direction: column; min-width: 0; }
.tag-asset__name { font-size: 13.5px; font-weight: 600; color: var(--glacia-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tag-asset__name--mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-weight: 400; font-size: 13px; }
.tag-asset__type { font-size: 11.5px; color: var(--glacia-ink-dim); }

.tag-menu {
  position: absolute; top: 56px; right: 24px; width: 200px; z-index: 2;
  background: #fff; border: 1px solid var(--glacia-glass-border); border-radius: 12px;
  box-shadow: 0 12px 28px -8px rgba(16,24,32,0.2); padding: 8px; display: flex; flex-direction: column; gap: 2px; overflow: hidden;
}
.tag-menu__item {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: none; background: none; border-radius: 8px;
  font-size: 13px; color: var(--glacia-ink); cursor: pointer; text-align: left; line-height: 1.3;
  transition: background 0.15s ease, transform 0.15s ease, padding-left 0.15s ease;
  &:hover { background: var(--glacia-glass-fill-strong); transform: translateX(2px); }
  &--danger { color: var(--glacia-sev-critical); font-weight: 600; &:hover { background: rgba(220,38,38,0.08); } }
}

.tag-color-picker {
  position: absolute; top: 56px; right: 24px; width: 216px; z-index: 2;
  padding: 16px; background: #fff; border: 1px solid var(--glacia-glass-border); border-radius: 12px;
  box-shadow: 0 12px 28px -8px rgba(16,24,32,0.2); display: flex; flex-wrap: wrap; gap: 12px;

  .dv-swatch { width: 24px; height: 24px; transition: transform 0.15s ease, box-shadow 0.15s ease; &:hover { transform: scale(1.18); box-shadow: 0 2px 8px rgba(16,24,32,0.25); } }
}

.action-menu {
  position: fixed; background: #fff; border-radius: 12px; box-shadow: 0 12px 28px -6px rgba(16,24,32,0.2);
  padding: 6px; z-index: 200; width: 160px;
  &__item { width: 100%; padding: 8px 10px; border-radius: 8px; border: none; background: transparent; text-align: left; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; &:hover { background: rgba(0,0,0,0.05); } &--danger { color: #dc2626; &:hover { background: rgba(220,38,38,0.08); } } }
}

.dv-modal {
  width: 920px; max-width: 94vw; display: flex; flex-direction: column; border-radius: 16px; overflow: hidden; background: #fff; box-shadow: 0 24px 60px -12px rgba(16,24,32,0.32);
  &--narrow { width: 760px; }
  --coral-50: #fff2f2; --coral-600: #e53925; --text-1: #101820; --text-2: #5c6470; --text-3: #9aa5b1; --gray-50: #f7f8f9; --gray-100: #e5e7eb; --gray-200: #d1d5db; --gray-300: #d1d5db; --success: #22c55e; --ice-100: #e0f2fe; --ice-600: #0284c7; --ice-700: #0369a1; --critical: #dc2626; --font-display: 'Manrope', 'Inter', sans-serif; --font-mono: 'JetBrains Mono', monospace;
  &__head { padding: 24px 28px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex: none; border-bottom: 1px solid var(--gray-100); }
  &__title { font-size: 24px; font-weight: 800; font-family: 'Manrope', 'Inter', sans-serif; color: var(--text-1); margin: 0; }
  &__sub { font-size: 12.5px; font-family: 'JetBrains Mono', 'Fira Code', monospace; color: var(--coral-600); }
  &__meta { font-size: 12px; font-family: 'Manrope', 'Inter', sans-serif; color: var(--text-3); margin-top: 8px; }
  &__close { width: 36px; height: 36px; border-radius: 50%; background: rgba(15, 23, 42, 0.06); display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; color: var(--text-3); }
  &__body { display: flex; flex: 1; min-height: 0; }
}
.dv-sub.dv-sub--host { justify-content: flex-start; }
.host-detail__row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 16px 0 20px;
}
.host-detail__value {
  margin-top: 6px; font-size: 14px; color: var(--text-1); font-family: 'Manrope', 'Inter', sans-serif;
}
.host-detail__tags-stack { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.dv-subpane {
  width: 250px; flex: none; position: relative; background: var(--gray-50); border-right: 1px solid var(--gray-100); display: flex; flex-direction: column;
  &__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 20px; margin-top: 20px; font-size: 11px; font-weight: 700; font-family: 'Manrope', 'Inter', sans-serif; color: var(--text-3); letter-spacing: 0.06em; text-transform: uppercase; }
  &__list { padding: 14px 14px 20px; display: flex; flex-direction: column; gap: 8px; max-height: 480px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--gray-200) transparent; }
  &__list::-webkit-scrollbar { width: 5px; }
  &__list::-webkit-scrollbar-thumb { background: var(--gray-200); border-radius: 999px; }
  &__list::-webkit-scrollbar-track { background: transparent; }
  &__hint { position: absolute; left: 0; right: 1px; bottom: 0; height: 44px; background: linear-gradient(to bottom, rgba(247,248,249,0), var(--gray-50) 78%); display: flex; align-items: flex-end; justify-content: center; padding-bottom: 4px; pointer-events: none; }
}
.dv-app-tags {
  padding: 20px 28px 4px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid var(--gray-100);
  padding-bottom: 20px;
}
.dv-manage {
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}
.dv-manage__static {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dv-manage__empty {
  font-size: 13px;
  color: var(--text-3);
}
.dv-manage-toggle {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  width: 100%; padding: 12px 14px; border: none;
  background: #fff; font-size: 13px; font-weight: 600; font-family: 'Manrope', 'Inter', sans-serif;
  color: var(--text-1); cursor: pointer;
}
.dv-manage-toggle__chev { color: var(--text-3); display: flex; transition: transform 0.2s ease; }
.dv-manage-body {
  display: flex; flex-direction: column; gap: 12px; overflow: hidden;
  border-top: 1px solid var(--gray-100); background: var(--gray-50);
  padding: 14px 14px 16px;
}
.dv-webapp-body {
  padding: 22px 28px 28px;
  max-height: 480px;
  overflow-y: auto;
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: var(--gray-200) transparent;
}
.dv-webapp-body::-webkit-scrollbar { width: 5px; }
.dv-webapp-body::-webkit-scrollbar-thumb { background: var(--gray-200); border-radius: 999px; }
.dv-webapp-body::-webkit-scrollbar-track { background: transparent; }
.dv-source-head { padding: 16px 24px 0; }
.dv-source-search { position: relative; width: 260px; }
.dv-source-search__input { width: 100%; height: 38px; padding: 0 38px 0 14px; border-radius: 999px; border: 1px solid var(--gray-100); background: var(--gray-50); font-size: 13px; font-family: 'Manrope', 'Inter', sans-serif; color: var(--text-1); outline: none; }
.dv-source-search__input::placeholder { color: var(--text-3); }
.dv-source-search__input:focus { border-color: var(--coral-600); }
.dv-source-search__icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-3); pointer-events: none; }
.dv-source-list { max-height: 420px; overflow-y: auto; padding: 16px 24px 24px; }
.dv-source-list .vtable { width: 100%; }
.dv-badge--red { background: #fee2e2; color: #dc2626; }
.dv-branch-hint {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: center;
  padding: 10px 0 2px;
  background: linear-gradient(to bottom, transparent, #fff 70%);
  color: var(--text-3);
  pointer-events: none;
}
.dv-branch-hint svg { animation: subdomain-scroll-hint 1.4s ease-in-out infinite; }
.dv-branch-list { display: flex; flex-direction: column; gap: 10px; }
.dv-branch-head {
  display: grid; grid-template-columns: 1fr; gap: 10px; align-items: center;
  padding: 0 14px; font-size: 11px; font-weight: 700; font-family: 'Manrope', 'Inter', sans-serif;
  color: var(--text-3); letter-spacing: 0.05em; text-transform: uppercase;
}
.dv-branch { border: 1px solid var(--gray-100); border-radius: 12px; overflow: hidden; background: #fff; }
.dv-branch__row {
  display: grid; grid-template-columns: 1fr 24px; gap: 10px; align-items: center;
  width: 100%; padding: 12px 14px; background: none; border: none; cursor: pointer; text-align: left;
}
.dv-branch__row--static { grid-template-columns: 1fr; cursor: default; }
.dv-branch__row--static:hover { background: none; }
.dv-branch__row:hover { background: var(--gray-50); }
.dv-branch__no { font-size: 13px; color: var(--text-3); }
.dv-branch__url { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 13px; color: var(--text-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dv-branch__chev { color: var(--text-3); display: flex; transition: transform 0.2s ease; }
.dv-branch__config { background: var(--gray-50); border-top: 1px solid var(--gray-100); padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 12px; overflow: hidden; }
.dv-hint-icon { color: var(--text-3); animation: subdomain-scroll-hint 1.4s ease-in-out infinite; }
.dv-sub {
  display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px; border-radius: 10px; cursor: pointer; border: none; text-align: left; width: 100%;
  span { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 12.5px; }
}
.dv-ippane {
  flex: 1; padding: 26px 30px; max-height: 480px; overflow-y: auto;
  &__head { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 800; font-family: 'Manrope', 'Inter', sans-serif; color: var(--text-1); }
  &__sub { font-size: 12px; font-family: 'Manrope', 'Inter', sans-serif; color: var(--text-3); margin-top: 4px; margin-bottom: 16px; }
  &--full .host-detail__row { margin-top: 0; }
}
.dv-badge { padding: 2px 9px; border-radius: 999px; font-size: 12px; font-weight: 700; font-family: 'Manrope', 'Inter', sans-serif; background: var(--gray-100); color: var(--text-2); }
.dv-ip-list { display: flex; flex-direction: column; gap: 12px; }
.dv-ip { border-radius: 12px; border: 1px solid var(--gray-100); overflow: hidden; }
.dv-ip__main { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; &:hover { background: var(--gray-50); } }
.dv-ip__main--clickable { cursor: pointer; }
.dv-ip__main--clickable .dv-chevron { pointer-events: none; }
.dv-ip__row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.dv-ip__left { display: flex; align-items: center; gap: 10px; min-width: 0; }
.dv-icon { color: var(--text-3); flex: none; }
.dv-mono { font-size: 14px; font-family: 'JetBrains Mono', 'Fira Code', monospace; color: var(--text-1); }
.dv-chevron { flex: none; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-3); border: none; background: transparent; transition: transform 0.2s ease; &:hover { background: var(--gray-100); color: var(--text-1); } }
.dv-tags { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-left: 26px; }
.dv-tag { padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; font-family: 'Manrope', 'Inter', sans-serif; white-space: nowrap; flex-shrink: 0; }
.dv-config { padding: 16px 18px 18px; background: var(--gray-50); border-top: 1px solid var(--gray-100); display: flex; flex-direction: column; gap: 14px; }
.dv-config--flush { border-top: none; }
.dv-expand-enter-active, .dv-expand-leave-active {
  transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease, padding-top 0.3s ease, padding-bottom 0.3s ease;
  overflow: hidden;
}
.dv-expand-enter-from, .dv-expand-leave-to { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; }
.dv-expand-enter-to, .dv-expand-leave-from { max-height: 800px; opacity: 1; }
.dv-subtabs {
  display: inline-flex; align-items: center; gap: 4px; padding: 4px;
  background: #eef0f2; border-radius: 12px; align-self: flex-start;
}
.dv-subtab {
  padding: 8px 16px; border-radius: 9px; border: none; background: transparent;
  font-size: 13px; font-weight: 600; font-family: 'Manrope', 'Inter', sans-serif;
  color: var(--text-3); cursor: pointer; white-space: nowrap;
  &--active { background: #fff; color: var(--text-1); font-weight: 700; box-shadow: 0 1px 4px rgba(16,24,32,0.1); }
}
.dv-ports { display: flex; flex-direction: column; gap: 14px; }
.dv-ports__head {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;
  padding: 0; font-size: 11px; font-weight: 700; font-family: 'Manrope', 'Inter', sans-serif;
  color: var(--text-3); letter-spacing: 0.05em; text-transform: uppercase;
}
.dv-ports__head--tech {
  grid-template-columns: 1fr;
}
.dv-ports__row {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; align-items: center;
  min-height: 44px;
  background: #fff; border: 1px solid var(--gray-100); border-radius: 10px; padding: 10px 14px;
  font-size: 13px; font-family: 'Manrope', 'Inter', sans-serif; color: var(--text-2);
}
.dv-ports__row--tech {
  grid-template-columns: 1fr;
}
.dv-ports__port { font-weight: 400; color: var(--text-2); font-family: 'JetBrains Mono', 'Fira Code', monospace; }
.dv-ports__tech { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 12.5px; }
.dv-ports__empty { font-size: 13px; color: var(--text-3); text-align: center; padding: 12px; }
.dv-config__title { font-size: 11px; font-weight: 700; font-family: 'Manrope', 'Inter', sans-serif; color: var(--text-3); letter-spacing: 0.06em; text-transform: uppercase; }
.dv-tag-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #fff; border: 1px solid var(--gray-100); border-radius: 10px; padding: 10px 14px; font-size: 14px; font-family: 'Manrope', 'Inter', sans-serif; color: var(--text-1); }
.dv-tag-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
.dv-tag-dot { width: 10px; height: 10px; border-radius: 3px; flex: none; }
.dv-remove { font-size: 12px; font-weight: 600; font-family: 'Manrope', 'Inter', sans-serif; color: var(--critical); cursor: pointer; border: none; background: none; &:hover { text-decoration: underline; } }
.dv-avail { display: flex; flex-direction: column; gap: 8px; }
.dv-avail__list { display: flex; flex-wrap: wrap; gap: 8px; }
.dv-avail-tag { display: flex; align-items: center; gap: 8px; padding: 6px 14px 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; font-family: 'Manrope', 'Inter', sans-serif; border: 1px solid var(--gray-100); cursor: pointer; &:hover { filter: brightness(0.97); } }
.dv-avail-tag--registered { box-shadow: 0 0 0 2px #E8590C; }
.dv-dot { width: 9px; height: 9px; border-radius: 50%; flex: none; }
.dv-add { display: flex; align-items: center; gap: 10px; }
.dv-color-btn { flex: none; display: flex; align-items: center; gap: 6px; padding: 9px 11px; border-radius: 10px; border: 1px solid var(--gray-200); background: #fff; cursor: pointer; &:hover { border-color: var(--gray-300); } }
.dv-color-swatch { width: 16px; height: 16px; border-radius: 50%; flex: none; }
.dv-input { flex: 1; min-width: 0; font-size: 14px; font-family: 'Manrope', 'Inter', sans-serif; border: 1px solid var(--gray-200); border-radius: 10px; padding: 10px 12px; outline: none; color: var(--text-1); }
.dv-add-btn { flex: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 700; font-family: 'Manrope', 'Inter', sans-serif; background: var(--coral-600); color: #fff; border: none; cursor: pointer; &:disabled { opacity: 0.4; cursor: default; } }
.dv-enter-hint { margin: 6px 0 0; font-size: 12px; line-height: 1.4; color: var(--text-3); }
.dv-palette { background: #fff; border: 1px solid var(--gray-100); border-radius: 12px; padding: 10px; display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; width: fit-content; }
.dv-palette--inline { display: flex; gap: 8px; width: 100%; }
.dv-swatch { width: 20px; height: 20px; border-radius: 50%; cursor: pointer; box-sizing: border-box; border: 2px solid transparent; }
@keyframes subdomain-scroll-hint { 0%,100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(4px); opacity: 1; } }

.modal-backdrop {
  position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 300; padding: 20px;
}
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.15s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.create-modal {
  width: 100%; max-width: 460px; background: #fff; border-radius: 20px; box-shadow: 0 24px 48px -12px rgba(16,24,32,0.35); padding: 28px; animation: create-modal-bounce 0.28s cubic-bezier(0.34,1.56,0.64,1);
  &__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  &__title { font-family: 'Manrope', 'Inter', sans-serif; font-size: 26px; font-weight: 800; color: var(--glacia-ink); margin: 0; }
  &__close { width: 32px; height: 32px; border-radius: 8px; border: none; background: none; color: var(--glacia-ink-dim); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; &:hover { background: rgba(0,0,0,0.05); color: var(--glacia-ink); } }
  &__body { margin-top: 16px; }
  &__desc { margin: 12px 0 0; font-size: 13px; line-height: 1.6; color: var(--glacia-ink-dim); }
  &__label { display: block; margin: 16px 0 8px; font-size: 14px; font-weight: 700; color: var(--glacia-ink); }
  &__required { color: var(--glacia-red); margin-left: 2px; }
  &__input {
    width: 100%; height: 54px; padding: 0 18px; border-radius: 14px; border: 1px solid var(--glacia-glass-border); background: #fff; color: var(--glacia-ink); font-size: 15px; font-family: 'Manrope', 'Inter', sans-serif; outline: none; box-sizing: border-box; box-shadow: 0 1px 3px rgba(16,24,32,0.08);
    &::placeholder { color: var(--glacia-ink-dim); }
    &:focus { border-color: var(--glacia-red); box-shadow: 0 2px 6px rgba(16,24,32,0.12); }
    &--error { border-color: var(--glacia-sev-critical); box-shadow: 0 2px 6px rgba(220,38,38,0.12); &:focus { border-color: var(--glacia-sev-critical); box-shadow: 0 2px 6px rgba(220,38,38,0.18); } }
  }
  &__actions { display: flex; gap: 14px; margin-top: 20px; }
}

.field-error { margin: 6px 0 0; font-size: 12px; line-height: 1.4; color: var(--glacia-sev-critical); }
.field-hint { margin: 6px 0 0; font-size: 12px; line-height: 1.4; color: var(--glacia-ink-dim); }
.basic-auth-card {
  margin-top: 16px;
  padding: 16px 18px;
  border-radius: 16px;
  border: 0.5px solid var(--glacia-glass-border);
  background: #fff;
  box-shadow: 0 1px 3px rgba(16, 24, 32, 0.08);

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--glacia-ink-dim);
  }

  &__fields {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__fields .create-modal__label:first-child {
    margin-top: 14px;
  }
}
.toggle-switch {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 26px;
  border-radius: 999px;
  border: none;
  background: rgba(15, 23, 42, 0.12);
  cursor: pointer;
  transition: background 0.18s ease;

  &--on {
    background: var(--glacia-red);
  }

  &__thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(16, 24, 32, 0.25);
    transition: transform 0.18s ease;

    .toggle-switch--on & {
      transform: translateX(18px);
    }
  }
}
.field-hint { margin: 6px 0 0; font-size: 12px; line-height: 1.4; color: var(--glacia-ink-dim); }
@keyframes create-modal-bounce {
  0% { opacity: 0; transform: scale(0.92) translateY(10px); }
  60% { opacity: 1; transform: scale(1.01) translateY(0); }
  100% { transform: scale(1); }
}
.form-select {
  position: relative;
  &__trigger {
    width: 100%; height: 54px; padding: 0 18px; border-radius: 14px; border: 1px solid var(--glacia-glass-border); background: #fff; color: var(--glacia-ink); font-size: 15px; font-family: 'Manrope', 'Inter', sans-serif; display: flex; align-items: center; justify-content: space-between; gap: 10px; cursor: pointer; box-shadow: 0 1px 3px rgba(16,24,32,0.08);
    &:hover { border-color: var(--glacia-ink-dim); }
  }
  &__trigger-text--placeholder { color: var(--glacia-ink-dim); }
  &__trigger-icons { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  &__clear { color: var(--glacia-ink-dim); transition: color 0.13s; &:hover { color: var(--glacia-sev-critical); } }
  &__chevron { flex-shrink: 0; color: var(--glacia-ink-dim); transition: transform 0.2s ease; &--open { transform: rotate(180deg); } }
  &__inline-menu { margin-top: 10px; padding: 8px; border-radius: 16px; border: 1px solid var(--glacia-glass-border); background: #fff; max-height: 260px; overflow-y: auto; }
  &__inline-item {
    display: flex; align-items: center; width: 100%; padding: 14px 16px; border-radius: 10px; border: none; background: transparent; color: var(--glacia-ink); font-size: 15px; font-weight: 500; text-align: left; cursor: pointer;
    &--active { background: rgba(255,37,41,0.08); color: var(--glacia-red); font-weight: 700; }
    &:hover:not(&--active) { background: rgba(255,37,41,0.06); }
  }
}
.select-panel {
  overflow: hidden; max-height: 0; opacity: 0; transition: max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease, margin-top 0.32s cubic-bezier(0.4,0,0.2,1);
  &.open { max-height: 300px; opacity: 1; margin-top: 10px; }
  &__inner { margin-top: 0; }
}
.ip-field-gap {
  margin-top: 16px;
}
.ip-range-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;

  &__field {
    flex: 1;
    min-width: 0;
  }

  &__sep {
    flex-shrink: 0;
    height: 54px;
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: var(--glacia-ink-dim);
  }
}
.modal-btn {
  flex: 1; height: 52px; border-radius: 14px; border: none; font-size: 16px; font-weight: 700; font-family: 'Manrope', 'Inter', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.13s, opacity 0.13s;
  &--cancel { background: rgba(220,38,38,0.06); color: var(--glacia-sev-critical); &:hover { background: rgba(220,38,38,0.12); } }
  &--save { background: linear-gradient(135deg, #e53925, #b91c1c); color: #fff; box-shadow: 0 8px 20px -6px rgba(229,57,37,0.4); &:disabled { opacity: 0.5; cursor: default; } }
  &--saved { background: #16a34a; box-shadow: 0 8px 20px -6px rgba(22,163,74,0.4); }
  &--create { background: var(--glacia-glass-fill-strong); color: var(--glacia-ink-dim); border: 1px solid var(--glacia-glass-border); &:disabled { cursor: default; } }
  &__spinner { width: 15px; height: 15px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; animation: modal-btn-spin 0.7s linear infinite; }
  &__check { animation: modal-btn-pop 0.4s ease; }
}
.delete-ack {
  display: flex; align-items: center; gap: 12px; margin: 20px 0 4px; padding: 14px 16px;
  border-radius: 999px; border: 1.5px solid var(--glacia-red); background: #fff; cursor: pointer; user-select: none;
}
.delete-ack__box {
  appearance: none; width: 20px; height: 20px; margin: 0; border-radius: 6px;
  border: 2px solid var(--glacia-red); background: #fff; flex-shrink: 0; cursor: pointer; position: relative;
  &:checked::after { content: ''; position: absolute; inset: 3px; border-radius: 3px; background: var(--glacia-red); }
}
.delete-ack span { font-size: 14px; line-height: 1.5; color: var(--glacia-ink); }
@keyframes modal-btn-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes modal-btn-pop { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); } }
</style>
