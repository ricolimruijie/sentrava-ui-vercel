import { ref } from 'vue'

// "Empty State" demo mode — not a role. When the logged-in demo account has
// `dataMode: 'empty'`, every mock returns no data so each page's no-data
// content can be reviewed. The auth store keeps this in sync with the user.
export const emptyData = ref(false)
