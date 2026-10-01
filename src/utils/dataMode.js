import { ref } from 'vue'

// "No data" demo mode — not a role. When the logged-in user has
// `dataMode: 'empty'` (set by the login page's "Show every page with no data"
// switch, for any role), every mock returns no data so each page's no-data
// content can be reviewed. The auth store keeps this in sync with the user.
export const emptyData = ref(false)
