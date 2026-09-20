# SentraVA — Centralized Vulnerability Assessment

Vue 3 + Vite frontend for centralized vulnerability assessment: dashboards,
CI/CD scan history, vulnerability overviews, company management, and API keys.

> Status: active development. Several nav routes (`/assets`, `/scans`,
> `/vulnerabilities`, `/reports`, `/credits`, `/tickets`) are still
> `Placeholder` stubs in `src/router/index.js`.

## Tech Stack

- **App:** Vue 3 (`<script setup>`), vue-router 4, Pinia + `pinia-plugin-persistedstate`
- **UI:** PrimeVue 4 (Aura preset, custom `SentraPreset` brand red `#FF2529`), PrimeIcons, Tabler Icons (`@tabler/icons-vue`), Chart.js + vue-chartjs
- **HTTP:** axios (`src/utils/request.js`)
- **Build:** Vite 6, SCSS (`sass`, modern-compiler), `@` → `./src`
- **Fonts:** Inter + Manrope (Google Fonts, `index.html`)

## Quickstart

```bash
npm install
npm run dev        # static/mock mode (VITE_IS_STATIC=true from .env)
npm run dev:api    # live API mode (VITE_IS_STATIC=false)
npm run build      # production build → dist/
npm run preview    # preview production build
```

### Env (`.env`)

| Var | Example | Meaning |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | axios `baseURL` for live mode |
| `VITE_IS_STATIC` | `true` | `true` = mock registry, `false` = real HTTP |

Static mode lazy-loads `src/mocks/index.js` in `src/main.js` before mount.

### Demo login (static mode only)

Login page shows Quick demo shortcuts when `VITE_IS_STATIC=true`:

| Role | Email | Password |
| --- | --- | --- |
| super_admin | `superadmin@sentra.io` | `demo` |
| admin | `admin@acme.com` | `demo` |
| analyst | `analyst@acme.com` | `demo` |
| member | `member@acme.com` | `demo` |

Any other email → `Invalid credentials` from the mock handler.

## Project Structure

```
src/
  main.js                 # app boot: Pinia, router, PrimeVue theme, Toast, mock loader, auth hydrate
  App.vue                 # <Toast/> + <RouterView/>
  router/                 # index.js (guard + placeholders), auth.js (/login), dashboard.js (/dashboard)
  config/navSections.js   # sidebar + breadcrumb source of truth (Menu/Services/Logs/Manage)
  components/
    layout/               # AppLayout.vue, Sidebar.vue, AppSidebar.vue, AppNavbar.vue
    reusable/             # StatCard, SeverityBadge, StatusBadge, ActivityBadge, EmptyState,
                          # SkeletonCard, ConfirmDialog, SuccessDialog, FailureDialog
    table/                # DataTable.vue
    filter/               # FilterDropdown.vue
    vulnerabilities/      # VulnerabilityDetailModal.vue
  views/
    Auth/LoginView.vue
    Dashboard/            # DashboardView.vue → ClientDashboard.vue, SuperAdminDashboard.vue + 20+ widgets
    Scans/                # CiCdView.vue (/scans/history), VulnerabilityOverviewView.vue
    Company/              # CompanyView.vue + tabs/ (CompanyList, AuditLog, ProbeBox)
    Settings/             # ApiKeysView.vue
  store/                  # auth.js (login/logout/hydrate, persisted), company.js (activeCompany)
  composables/            # useFetch, usePagination, usePolling, useRole, useCompanyContext
  utils/                  # request.js (axios + mock registry), constants.js, helpers.js
  mocks/                  # index.js (registerMock patterns) + dashboard/, scans/, company/, settings/
  styles/                 # design-tokens.css, main.scss, _tokens.scss, _variables.scss
```

## Routing & Auth

- Public: `/login` (`name: login`).
- Guarded layout: `/` → `AppLayout` (Sidebar + Navbar), `meta.requiresAuth: true` redirects to `/login?redirect=...`.
- `/` and unknown paths redirect to `/dashboard`.
- Implemented routes:
  - `/dashboard` → `DashboardView.vue` (currently renders `ClientDashboard`; `SuperAdminDashboard` exists for `super_admin` role)
  - `/scans/history` → CI/CD runs; `/scans/history/:runId/vulnerabilities` → findings
  - `/settings/api-keys` → API key list/create/edit/revoke
  - `/companies` → Company page, tab via `?tab=` (`overview|list|audit|probe`), breadcrumb reflects tab
- Stubbed (`Placeholder`): `/assets/:type?`, `/scans/:section?`, `/vulnerabilities`, `/reports`, `/settings`, `/credits`, `/tickets`.

Auth flow: `LoginView` → `auth.login()` → `POST /auth/login` → stores `token`/`user`, writes `sentra_token` to localStorage, Pinia persisted as `auth`. Boot calls `hydrateFromStorage()` before first navigation. 401 interceptor clears token and redirects to `/login`. `useRole` / `isSuperAdmin` gate role-specific UI.

## Data Layer

`src/utils/request.js` exports `request/get/post/put/patch/del`:

- **Live mode:** axios client with `Authorization: Bearer <sentra_token>`, 15s timeout, `res.data` unwrap.
- **Static mode:** `registerMock(/pattern/, handler)` registry with ~80–260ms fake latency. Patterns cover `/dashboard/client`, `/dashboard/super-admin`, `/settings/api-keys`, `/company/info|members|list|audit-log|probes`, `/scans/history`, `/scans/history/:id/vulnerabilities`, `/auth/login`.
- `useFetch(fetchFn)` gives `{ data, loading, error, execute, refresh }` for view-level loading.
- `constants.js`: `ROLES`, `ASSET_TYPES` (domain/network/webapp/source_code/url_crawl), `SCAN_ENGINES` (Greenbone/Nuclei/Semgrep/Katana), `SEVERITY` + colors, `STATUS` + colors, activity category colors/labels.
- `helpers.js`: `formatNumber/Date/RelativeTime`, `greeting`, `severityColor/statusColor/activityColor/activityLabel`, `sleep`.

## Key Views

- **Dashboards:** `ClientDashboard` + 20+ widgets (`StatCardRow`, `OverallSeverityTrend`, `TopVulnerabilities`, `RecentlyScanned`, `ScansInProgress`, `ScheduledScans`, `ActivityFeed`, `TicketFeed/Overview`, `CreditsOverview`, `AssetRegisteredTracker`, `VulnerabilityCycleTracker`, etc.). `SuperAdminDashboard` adds `CompanyOverview`, `TopSpendingCompany`, `MostUsedService`, `ScannerToolsChecker`, `IntegrationConnection`.
- **Scans:** CI/CD run list → per-run vulnerability overview with severity/status badges and detail modal.
- **Company:** tabbed management (overview, company list, audit log, probe box).
- **Settings:** API keys CRUD with confirm/success/failure dialogs.

## Design System

- PrimeVue Aura + `SentraPreset` (red primary scale), `darkModeSelector: '.dark'`, `prefix: 'p'`, `cssLayer: false`.
- Global tokens in `design-tokens.css` (`--color-surface/bg/border/text-*`, `--color-primary*`, `--radius-card/sm`, `--shadow-card/lg`, `--text-*`); SCSS helpers in `_variables.scss` (`below($bp-lg)` etc.).
- `AppLayout` glass style: fixed gradient blobs + sidebar/navbar/content shell, collapsible sidebar.

## Working Agreement

I'm set up as your orchestrator for this repo: I'll map context first, then plan/delegate/verify changes. I won't commit unless you ask, and I'll keep `lsp_diagnostics` + build/test evidence for edits.
