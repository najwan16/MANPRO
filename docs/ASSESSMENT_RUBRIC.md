# Deterministic Scoring & Rubric Policy

**Rubric version:** `SA-DEMO-2026.1`.

## Scores

- Free task: identify requirement **40**, assign priority **25**, choose validation test **35**.
- Paid T1 Requirements: five fields, **20** each.
- Paid T2 User Story: actor **15**, action **25**, benefit **20**, acceptance criteria **40**. For the latter: +20 each of the two expected options and -10 per unrelated selected option; floor 0. Other fields earn their full weight only if exact expected choice is made.
- Paid T3 Validation: five fields, **20** each.
- All task scores run 0–100. Final V1/V2 weighted score = `round(T1*0.30 + T2*0.40 + T3*0.30)`.
- V2 is judged identically to V1. There is no automatic improvement incentive.
- Per-aspect feedback identifies why the choice is/isn't appropriate.
- Each paid task includes a required authored note (Task 1 memo ≥25 characters; Task 2 user story ≥30; Task 3 stakeholder clarification ≥25), stored in V1/V2 evidence and export **but not auto-scored**. Structured-choice score does not claim to evaluate its writing quality.

## Minimum completion / certificate criteria

All three tasks require **V1 and V2** submission; report/portfolio become available then, irrespective of score. Certificate is issued only when all six snapshots exist **and final weighted V2 ≥ 70/100**. A user who falls short keeps the work product and may begin a new attempt. Certificate contains demo-only non-verifiable identifier.

## What this does NOT claim

- One mini free task cannot diagnose overall readiness.
- Scenario-based accuracy does not establish professional competence or employment suitability.
- Changed answers in the same scenario are not proof of transfer learning to unfamiliar cases.
- To validate impact, test a **new parallel case** after intervention and ask practitioners to check rubric relevance.

## Security

Browser scoring is inspectable/manipulable, acceptable **only for academic demo**. Production: server-side rubric definitions and submission grading via Edge Function; input schema validation, idempotent submissions, immutable V1/V2, rate limiting, test case calibration, and examiner review.
