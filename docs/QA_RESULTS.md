# QA Execution Summary — SiMagang MVP v3

Date: 18 October 2026. Preparation environment: Node.js 22.16.0.

## Executed and passing

- `npm run check` — PASS: required source/docs, JavaScript syntax, critical route/workflow markers.
- `npm test` — **6/6 PASS**:
  1. Free task truthful grading, incomplete answers rejected.
  2. Demo checkout and owner-scoped entitlement, V1/V2 immutable assessment snapshots.
  3. No automatic scoring improvement simply for submitting a revision.
  4. Landing, catalog, four role detail pages generate content.
  5. Public free task accessible; protected checkout leads to auth.
  6. Report/portfolio/certificate content guarded until valid paid task completion.
- Static HTTP demo server `scripts/dev-server.mjs` — returns **HTTP 200** for `index.html`, `src/main.js`, `src/styles.css`, and Tailwind offline CSS fallback.

## Not executed in preparation environment

- `npm install` / `npm run build`: npm registry DNS returned `EAI_AGAIN` in sandbox. **Vite production build not verified**. Build should be run on machine with package registry access.
- Automated Playwright/browser screenshot E2E: managed Chromium policy returned `ERR_BLOCKED_BY_ADMINISTRATOR` for local test page. Therefore visual and mobile UX should be manually validated in Chrome/Edge outside this restricted environment.
- Live payments, Supabase production Auth/DB/RLS, email verification, public certificate verification: **not integrated** by design.

## Suggested next manual validation

Open via `npm run demo`, verify 1440px and 390px widths, try one complete realistic V1→V2 per task, verify Markdown downloads and SVG certificate, test logout/login and browser refresh. Use `docs/TESTING.md` 20-scenario checklist.

Do not represent the 6 unit/UI route smoke tests as evidence of user adoption, payment willingness, professional competence, or production readiness.
