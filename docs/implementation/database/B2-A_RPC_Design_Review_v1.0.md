# NexNav B2-A — Atomic Event Creation RPC Design Review

**Version:** v1.0  
**Status:** Reviewed; awaiting explicit deployment approval  
**Reviewed file:** `B2-A_Create_Health_Event_RPC_v1.0.sql`  
**Review date:** 2026-08-18  

## 1. Outcome

The proposed `public.create_health_event` RPC satisfies the Source-of-Truth requirement to create one `health_events` row and its one `initial_records` row atomically. It has not been deployed or executed.

**Review result:** PASS FOR CONTROLLED DEPLOYMENT, followed by mandatory rollback and ownership tests.

## 2. RPC Contract

### Function

`public.create_health_event`

### Required parameters

| Parameter | Type | Contract |
|---|---|---|
| `p_primary_symptom_id` | uuid | Active, primary-enabled approved catalog row |
| `p_started_on` | date | Today or past date using Asia/Taipei |
| `p_severity` | integer | 1–10 |
| `p_frequency_level` | integer | 1–5 |
| `p_duration_value` | integer | Positive integer |
| `p_duration_unit` | text | minutes/hours/days/weeks/months |
| `p_life_context` | jsonb | sleep/diet/activity/stress, each 1–5 |

### Optional parameters

| Parameter | Type | Contract |
|---|---|---|
| `p_custom_primary_symptom` | text | Required only for Other; trimmed 1–100 |
| `p_frequency_description` | text | Trimmed; maximum 200 |
| `p_associated_symptoms` | jsonb | Array; defaults to `[]` |
| `p_supplemental_description` | text | Trimmed; maximum 1,000 |

### Return

Exactly one row containing:

- `health_event_id`
- `initial_record_id`

## 3. Associated Symptoms Contract

Each array item is normalized to:

```json
{
  "symptom_id": "uuid-or-null",
  "custom_text": "text-or-null"
}
```

Rules:

- Exactly one of `symptom_id` or `custom_text` is present.
- Catalog IDs must be active, primary-enabled, non-Other, and different from the selected Primary Symptom.
- Duplicate catalog IDs are rejected.
- Custom text is trimmed and limited to 1–100 characters.
- Unknown extra JSON keys are discarded during normalization.

The 100-character custom-associated-symptom limit is an API hardening decision aligned with the existing 100-character custom Primary Symptom boundary. It does not change the database schema.

## 4. Security Review

| Control | Result |
|---|---|
| `security invoker` | PASS; caller permissions and RLS remain active |
| Owner source | `auth.uid()` only; no caller-supplied user ID |
| Onboarding gate | Requires caller's own completed Profile |
| Symptom gate | Requires active, primary-enabled catalog row |
| Service role | Not used or exposed |
| Anonymous access | Revoked |
| Default PUBLIC execute | Revoked |
| Authenticated execute | Explicitly granted |
| Search path | Fixed to `public, pg_temp` |
| Cross-user IDs | No user or Event ID accepted from caller |

`security definer` is intentionally not used. The existing authenticated INSERT grants and RLS policies remain the enforcement layer for both tables.

## 5. Atomicity Review

PostgreSQL functions execute within the transaction of the calling statement. The RPC contains both INSERT statements without an internal exception handler that could swallow an insert failure.

Therefore:

1. Event insert succeeds.
2. Initial Record insert succeeds → both commit.
3. Initial Record insert or any later statement fails → the function call fails and the Event insert rolls back.

This is a real database transaction, not a compensating action and not two browser-side writes.

## 6. Data Mapping Review

| RPC input | Database destination |
|---|---|
| authenticated caller | both tables' `user_id` |
| `p_primary_symptom_id` | `health_events.primary_symptom_id` |
| normalized custom Primary | `health_events.custom_primary_symptom` |
| `active` constant | `health_events.status` |
| `p_started_on` | `health_events.started_on` |
| severity/frequency/duration | corresponding `initial_records` fields |
| normalized associated symptoms | `initial_records.associated_symptoms` |
| normalized four-value context | `initial_records.life_context` |
| normalized supplemental text | `initial_records.supplemental_description` |
| `1` constant | `initial_records.revision` |

## 7. Compatibility with Existing Database

- Uses only existing tables and columns.
- Respects existing length, range, JSON-shape, FK, unique, and owner constraints.
- Uses existing authenticated INSERT grants and RLS policies.
- Does not change the immutable Event trigger.
- Does not create a Safety row. P05 redirects to Safety only after a successful commit.
- Does not modify Seed Content or Profile data.

## 8. Deployment and Test Requirements

B2 may be marked resolved only after all tests pass:

1. Function exists with the exact signature and return columns.
2. `PUBLIC` and `anon` have no EXECUTE privilege; `authenticated` does.
3. Unauthenticated invocation is rejected.
4. Onboarding-incomplete invocation is rejected with zero new rows.
5. Inactive/unsupported symptom is rejected with zero new rows.
6. Other without custom text is rejected with zero new rows.
7. Non-Other with custom text is rejected with zero new rows.
8. Future `started_on` is rejected with zero new rows.
9. Invalid severity/frequency/duration/life-context/associated input is rejected with zero new rows.
10. Valid call creates exactly one owned Event and one owned Initial Record and returns both IDs.
11. Confirm transaction semantics and verify that every Event created by the RPC has exactly one Initial Record; do not add a production test trigger or weaken validation merely to force the second INSERT to fail. Any explicit failure-injection test requires a separately approved, reversible test plan.
12. User A cannot create for, read, or affect User B through the RPC.
13. The created Event has `status = active`, the Initial Record has `revision = 1`, and owner IDs match.
14. The function is callable through the generated Supabase client after database types are refreshed.

## 9. Known Implementation Note

The RPC raises internal English exception messages. P05 must map failures to safe Traditional Chinese user-facing messages and must not expose raw SQLSTATE, table names, stack traces, or database details.

Because all invalid caller inputs are rejected before the first INSERT, safely forcing only the second INSERT to fail is not naturally available through the public contract. PostgreSQL still guarantees statement-level rollback for an unhandled function error; deployment verification must additionally run an orphan check after negative and positive tests.

## 10. Decision

**Design review:** PASS  
**Deployment status:** NOT DEPLOYED  
**B2 status:** Not resolved until controlled deployment and tests pass.
