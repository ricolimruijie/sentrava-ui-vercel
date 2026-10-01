// Data seam for this module: views import from here, never from @/mocks.
// These are still backed by the sample data; swap the bodies for request() calls
// (and make the views async) when the real endpoints exist.
export { getNetworks, getNetworkScans, getNetworkEndpoints, getNetworkVulns } from '@/mocks/assets/network.js'
