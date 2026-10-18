# Testing & Quality Assurance

## Automated tests

Run `npm run check` and `npm test`. No third-party dependencies required for these tests.

Checks cover scoring free good/bad, rejecting incomplete input, gated entitlement, blocking unbuilt products, owner-scoped purchase, sequential task gating, V1 snapshot immutability, V2 same rubric and potentially no improvement, weighted report and certificate threshold, account isolation/resumption, reset.

## Manual end-to-end acceptance scenarios

| ID | Test steps | Expected result |
|---|---|---|
| M01 | Open landing, catalog, four role details as guest | All accessible; only System Analyst has buy CTA |
| M02 | Open Free Task, try submit with missing field | Browser prevents incomplete submission |
| M03 | Answer free task deliberately wrong | Real score below 100 with field-specific feedback; offer optional |
| M04 | Answer free task all correctly | Score 100; no forced "not ready" message |
| M05 | Open checkout logged out | Redirect to demo login, return to checkout after submit |
| M06 | Choose QRIS demo, activate | No payment request; local entitlement active; landing at briefing |
| M07 | Start project, visit Task 2 before Task 1 V2 | Locked task, no progression |
| M08 | Fill task 1, submit V1 | Feedback from choices; V1 frozen |
| M09 | Leave/reload during V2 editing | Draft persists; no submission loss |
| M10 | Submit V2 unchanged | Score equal; change count 0; no fake improvement |
| M11 | Submit V2 improved | Score compares truthfully; changed fields count reflects input |
| M12 | Repeat Tasks 2 and 3 | Report/portfolio only after all 3 V1 & V2 |
| M13 | Weighted V2 >=70 | Certificate demo available, SVG download & print |
| M14 | Weighted V2 <70 | Report/portfolio remain; certificate blocked and retry offered |
| M15 | Download portfolio, report, task draft | Markdown files contain actual submitted choices |
| M16 | Sign out, sign in same demo email | Entitlement and active attempt resume |
| M17 | Sign in a different demo email | No inherited paid entitlement or attempts |
| M18 | Reset dashboard | All demo data cleared after confirmation |
| M19 | Try purchase unbuilt project | No active checkout, status explicitly "Segera hadir" |
| M20 | Test 1440, 1024, 768, 390 widths | No severe overflow, usable forms and navigation |

## Known limitations

- Vite build depends on package downloads; package registry was not reachable in build environment used to prepare this ZIP. Static demo can run with built-in Node server and was designed to work without npm install.
- An automated actual-browser Playwright test could not be completed in the build environment because centrally managed Chromium policy blocks opening test URLs. Run visual smoke tests on local developer machine.
- All scoring keys and entitlements are client-side demo and not secure; backend service integration is not shipped.
- Code review and unit test are not a substitute for usability testing with target users and industry reviewers.
