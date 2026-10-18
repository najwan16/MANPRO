# Supabase Backend Handoff — Implementation Roadmap

## Current situation

The ZIP is a **functional client-side demo**. Source imports `api` from `src/services/index.js` which currently binds to the `mockAdapter`. This state is persisted in `localStorage` and can be edited by anyone with local browser access. **Supabase is not connected, and payment is not live.** The purpose of the adapter pattern is to enable a secure replacement later.

## Implementation sequence

1. Provision Supabase project and create tables/migrations from `DATABASE_SCHEMA.md`. Prefer migration files managed by Supabase CLI.
2. Enable Supabase Auth (email/password, magic link, or OAuth) with verified identity; replace demo-name/email login. Never keep passwords in localStorage.
3. Implement RLS on private tables; confirm Alice cannot read Bob's attempts, orders, certificates, or artifacts. Verify with real Supabase auth tokens.
4. Move rubric answer keys to server-side private source. Implement `gradeSubmission` Edge Function validating schema, task sequence, entitlement, immutable V1/V2 and versioned rules. Atomically insert submission+assessment.
5. Implement payment provider: create order, show hosted checkout, verify signature of webhook, grant entitlement only on provider confirmation. Support pending, failed, chargeback/refund/revocation. **Do not rely on checkout-return query params**.
6. Implement functions for start attempt, check completeness, issue signed/verifiable certificate ID, export report. Add rate limits, idempotency keys and audit trail.
7. Create `supabaseAdapter` implementing API contract; make service facade asynchronous and add pending/loading/error states. The existing demo code is intentionally synchronous and requires this refactor.
8. Move user assets to Supabase Storage with per-user object access rules. Optional diagrams.net upload would require file validation and manual evaluation support.
9. Run staging E2E tests: authorization, webhook callback, duplicate submissions, user A/B isolation, spoofed scores, empty/free answers, interrupted network, expired sessions and accessibility.

## Suggested frontend environment

```
VITE_APP_MODE=production
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-anon-key>
```

Only **anon/publishable** key on client. Server `service_role` keys belong exclusively in secret backend environment variables. Never publish the private rubric expected answers in the client bundle for a real assessment.

## Important design decisions

- `purchaseService.createOrder` must return `pending`; frontend only displays "berhasil" once server confirms payment.
- `getEntitlement` must check actual server entitlement, not cached local boolean.
- Identity/auth must be derived from verified session, not a form field.
- Postpaid certificate should carry verifiable ID and public checker with safe, minimal metadata; current SVG certificate is only a sample.
- If backend unavailable, show error/disabled operation; **never silently fall back to paid demo mode** on public production website.

## UI migration touchpoints

At present `main.js` invokes `api.*` synchronously and uses hash navigation. When implementing live service, make handlers async, disable submit while awaiting, and show loading/failed states. Keep all copy changes explicit; remove global DEMO banner only after payments and identity are genuinely deployed and tested.
