# API Contract (Proposed Backend Handoff)

The active service in code is `src/services/mockAdapter.js`. `src/services/supabaseAdapter.js` is a deliberate stub, not a working Supabase connection. Both should adhere to a stable logical contract when integrating backend.

## Frontend-friendly async service contract

```ts
type RubricPart = { fieldId:string; label:string; earned:number; max:number; correct:boolean; feedback:string };
type Assessment = { score:number; breakdown:RubricPart[]; rubricVersion:string; gradedAt:string };
type Submission = { answers:Record<string,string|string[]>; assessment:Assessment; submittedAt:string };
type TaskProgress = { draft:Record<string,string|string[]>; v1?:Submission; v2?:Submission };
type Attempt = { id:string; owner:string; simulationId:string; tasks:Record<string,TaskProgress> };

type SiMagangService = {
 listSimulations(filters): Promise<Simulation[]>;
 getSimulation(slug): Promise<Simulation>;
 submitFree(challengeId,answers): Promise<{assessment:Assessment; answers:object}>;
 getCurrentSession(): Promise<Profile|null>;
 signIn(credentials): Promise<Profile>;
 signOut(): Promise<void>;
 createOrder(simulationId,method): Promise<{orderId:string;status:'pending'}>;
 getEntitlement(simulationId): Promise<{active:boolean}>;
 startAttempt(simulationId): Promise<Attempt>;
 saveDraft(attemptId,taskId,answers): Promise<void>;
 submitTask(attemptId,taskId,version): Promise<Submission>;
 getReport(attemptId): Promise<PerformanceReport>;
 getPortfolio(attemptId): Promise<Portfolio>;
 getCertificate(attemptId): Promise<Certificate|null>;
};
```

Existing demo adapter uses synchronous calls and simple names (`state`, `submitFree`, `login`, `checkout`, `startAttempt`, `saveDraft`, `submitTask`); **adapt a service facade and await calls before switching to production**. The UI should not import Supabase directly from pages. For explicit migration steps see `BACKEND_HANDOFF.md`.

## Endpoint-equivalent mapping

| Client intent | Recommended secure implementation | Auth |
|---|---|---|
| Catalog / role | `supabase.from('simulations').select(...)` public RLS | Public |
| Auth | Supabase Auth | User |
| Free challenge | Public / anonymous Edge Function with rate limiting | Guest token |
| Checkout | Create order via Edge Function; payment gateway session | User |
| Confirm purchase | Gateway verified webhook → writes entitlement | Service role |
| Start attempt | Edge Function enforces active entitlement | User |
| Save draft | Own draft row guarded by RLS / API | User |
| Grade submission | Edge Function validates rubric + writes submission & score atomically | User |
| Report / portfolio | Select own rows with access checks | User |
| Issue certificate | Secure server after checking all V1/V2 and threshold | User |

## Error classes

`UNAUTHENTICATED`, `NO_ENTITLEMENT`, `SIMULATION_NOT_READY`, `TASK_LOCKED`, `INCOMPLETE_INPUT`, `ALREADY_SUBMITTED`, `GRADE_FAILED`, `RATE_LIMITED`, `PAYMENT_PENDING`, `NETWORK_ERROR`. Show readable, non-deceptive user messages. Never claim success before response from server.

## Versioning and invariants

Rubric version frozen for V1 and V2 of an attempt; use versioned rubric definitions server-side. Decisions and scores persisted as immutable snapshots; checks must not trust `user_id` supplied from browser. Demo purchase is explicitly NOT equivalent to a production paid order.
