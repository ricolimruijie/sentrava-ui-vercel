# SentraVA — Centralized Vulnerability Assessment

Vue 3 + Vite frontend for centralized vulnerability assessment: dashboards,
service pages (Domain, Network, Web App, Source Code), asset inventory, CI/CD
report log and API keys, tickets, company management, and settings.

> Status: active development. Everything built so far is the **super_admin**
> experience; `admin` and `member` currently see the same UI apart from a few
> gated actions (see [Roles](#roles)). `/scans/:section`, `/vulnerabilities`,
> `/reports` and `/credits` are still `Placeholder` stubs in `src/router/index.js`.

## Tech Stack

- **App:** Vue 3 (`<script setup>`), vue-router 4, Pinia + `pinia-plugin-persistedstate`
- **UI:** PrimeVue 4 (Aura preset, custom `SentraPreset` brand red `#FF2529`), PrimeIcons, Tabler Icons (`@tabler/icons-vue`), Chart.js + vue-chartjs
- **HTTP:** axios (`src/services/api/client.js`)
- **Build:** Vite 6, SCSS (`sass`, modern-compiler), `@` → `./src`
- **Quality:** ESLint 10 + eslint-plugin-vue (`eslint.config.js`), Vitest 5
- **Fonts:** Inter + Manrope (Google Fonts, `index.html`)
- **Theme:** light/dark, toggled via `useTheme` (`sentra_theme` in localStorage, `.dark` class on `<html>`)

## Quickstart

```bash
npm install
npm run dev        # static/mock mode (VITE_IS_STATIC=true from .env)
npm run dev:api    # live API mode (VITE_IS_STATIC=false)
npm run build      # production build → dist/
npm run preview    # preview production build
npm run lint       # ESLint (also enforces: modules must not import each other)
npm test           # Vitest unit tests (src/**/*.test.js, next to the code they test)
```

### Env (`.env`, see `.env.example`)

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
| member | `member@acme.com` | `demo` |

Any other email → `Invalid credentials` from the mock handler.

The Quick demo card also has a **Show every page with no data** switch (see
[No-data demo mode](#no-data-demo-mode)). A **Forgot password** page
(`/forgot-password`) is mocked and always succeeds.

## Project Structure

```
src/
  main.js                 # app boot: Pinia, router, PrimeVue theme, Toast, mock loader, auth hydrate
  App.vue                 # <Toast/> + <RouterView/>
  router/                 # index.js (guard + placeholders), auth.js, dashboard.js
  config/                 # navSections.js (sidebar + breadcrumbs), scanModules.js (dashboard scan modal registry)
  constants/              # ROLES, ASSET_TYPES, SCAN_ENGINES, severity/status maps
  services/api/client.js  # the only HTTP client: axios + mock registry (get/post/put/patch/del)
  stores/                 # global Pinia stores: auth, company
  composables/            # useFetch, usePagination, usePolling, useRole, useCompanyContext, useTheme, useScanTimeline
  utils/                  # helpers.js (formatters etc.), dataMode.js, navOrigin.js
  styles/                 # design-tokens.css, main.scss, _tokens.scss, _variables.scss
  mocks/                  # index.js (registerMock patterns) + per-feature sample data
  components/
    common/               # shared UI used by 2+ modules (DataTable, badges, dialogs, pickers, FindingsReportModal,
                          # HoldToDeleteModal, ScanTimelineCard ...)
    layout/               # AppLayout, Sidebar, AppNavbar
  modules/                # one folder per feature: views/ components/ services/ (store/ when needed)
    domain-inspection/    # Domain list + detail
    network/              # Network list + detail
    web-application/      # Web App list + detail
    source-code/          # Source Code list + detail
    asset-inventory/      # cross-module overview of all four
    scans/                # Report Log (CI/CD) + vulnerability overview
    tickets/              # list, detail, create modal, tickets store
    company/              # company page (tabs/), members, quota + integration modals
    dashboard/            # Client/SuperAdmin dashboards + widgets (scan modal via config/scanModules.js)
    settings/             # Settings (Profile, 2FA), API keys
    auth/                 # login, forgot password
docs/design-references/   # design reference snippets (not part of the build)
```

Rules: modules must not import each other (shared code goes to `components/common`,
`composables` or `utils`); components and views call the API only through a module's
`services/`; check `utils/helpers.js` before adding a formatter. Large components keep their
styles in a sibling `Name.scss` (`<style scoped lang="scss" src="./Name.scss">`).

## Routing & Auth

- Public: `/login` (`name: login`).
- Guarded layout: `/` → `AppLayout` (Sidebar + Navbar), `meta.requiresAuth: true` redirects to `/login?redirect=...`.
- `/` and unknown paths redirect to `/dashboard`.
- Implemented routes:
  - `/dashboard` → `DashboardView.vue` (currently always renders `ClientDashboard`; `SuperAdminDashboard` exists but is not wired in yet)
  - `/assets` → Asset Inventory
  - `/assets/domains|networks|webapps|source-code` → service list pages, each with an `/:id` detail page (Domain and Network details use `?view=` for Endpoint Findings / Domain Reputation)
  - `/scans/history` → Report Log (CI/CD runs); `/scans/history/:runId/vulnerabilities` → findings
  - `/settings` → Settings (open to every role), section via `?section=profile|two-factor`
  - `/settings/api-keys` → API key list/create/edit/revoke
  - `/companies` → Company page, tab via `?tab=` (`overview|list|audit|probe`), breadcrumb reflects tab; `/companies/:id` → sub company members
  - `/tickets` → ticket list; `/tickets/:id` → ticket detail
- Stubbed (`Placeholder`): `/scans/:section?`, `/vulnerabilities`, `/reports`, `/credits`.

Auth flow: `LoginView` → `auth.login()` → `POST /auth/login` → stores `token`/`user`, writes `sentra_token` to localStorage, Pinia persisted as `auth`. Boot calls `hydrateFromStorage()` before first navigation. 401 interceptor clears token and redirects to `/login`. Role-specific UI is gated through `useRole()` only.

## Data Layer

`src/services/api/client.js` exports `request/get/post/put/patch/del`:

- **Live mode:** axios client with `Authorization: Bearer <sentra_token>`, 15s timeout, `res.data` unwrap.
- **Static mode:** `registerMock(/pattern/, handler)` registry with ~80–260ms fake latency. Patterns cover `/dashboard/client`, `/dashboard/super-admin`, `/settings/api-keys`, `/company/info|members|list|audit-log|probes`, `/scans/history`, `/scans/history/:id/vulnerabilities`, `/auth/login`, `/auth/forgot-password`. Asset sample data lives in `src/mocks/assets/`.
- `useFetch(fetchFn)` gives `{ data, loading, error, execute, refresh }` for view-level loading.
- `constants/index.js`: `ROLES`, `ASSET_TYPES` (domain/network/webapp/source_code/url_crawl), `SCAN_ENGINES` (Greenbone/Nuclei/Semgrep/Katana), `SEVERITY` + colors, `STATUS` + colors, activity category colors/labels.
- `helpers.js`: `formatNumber/Date/RelativeTime`, `greeting`, `severityColor/statusColor/activityColor/activityLabel`, `sleep`.

## Key Views

- **Dashboards:** `ClientDashboard` + 20+ widgets (`StatCardRow`, `OverallSeverityTrend`, `TopVulnerabilities`, `RecentlyScanned`, `ScansInProgress`, `ScheduledScans`, `ActivityFeed`, `TicketFeed/Overview`, `CreditsOverview`, `AssetRegisteredTracker`, `VulnerabilityCycleTracker`, etc.). `SuperAdminDashboard` adds `CompanyOverview`, `TopSpendingCompany`, `MostUsedService`, `ScannerToolsChecker`, `IntegrationConnection`.
- **Services / Assets:** Domain Inspection (with reputation modal), Network, Web Application and Source Code list + detail pages, plus the Asset Inventory.
- **Scans:** Report Log (CI/CD runs) → per-run vulnerability overview with severity/status badges and detail modal.
- **Tickets:** list, detail and create-ticket modal.
- **Company:** tabbed management (overview, sub companies, audit log, integration/probe box), members page, quota and credential modals.
- **Settings:** Profile and two-factor sections (persisted on the mock auth user), plus API keys CRUD with confirm/success/failure dialogs.

## Design System

- PrimeVue Aura + `SentraPreset` (red primary scale), `darkModeSelector: '.dark'`, `prefix: 'p'`, `cssLayer: false`.
- Global tokens in `design-tokens.css` (`--color-surface/bg/border/text-*`, `--color-primary*`, `--radius-card/sm`, `--shadow-card/lg`, `--text-*`); SCSS helpers in `_variables.scss` (`below($bp-lg)` etc.).
- `AppLayout` glass style: fixed gradient blobs + sidebar/navbar/content shell, collapsible sidebar.

## Roles

Exactly three roles: `super_admin`, `admin`, `member` (`ROLES` in `src/constants`). The current UI is the super_admin version; per-role looks and restrictions are the next phase. Rules in place so far:

- **Create Ticket** is for admin and member only (`useRole().isClientRole`).
- **Close Ticket** is super_admin only.
- **Settings** is open to every role.

Check roles only through `useRole()` (`src/composables/useRole.js`), not ad-hoc.

## No-data demo mode

To review empty states for any role, turn on **Show every page with no data** in the login page's Quick demo card before choosing a role (mock mode only). It is not a role: the signed-in role's UI is unchanged, but every mock returns no data (see `src/utils/dataMode.js`). New mocks and hard-coded sample data should honour `emptyData.value`.
