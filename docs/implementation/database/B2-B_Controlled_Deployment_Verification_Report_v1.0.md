# NexNav B2-B — Controlled Deployment Verification Report

**Date:** 2026-08-18  
**Outcome:** RESOLVED  
**RPC:** `public.create_health_event(uuid, date, integer, integer, integer, text, jsonb, text, text, jsonb, text)`

## Deployment

- Function deployed successfully in one `BEGIN` / `COMMIT` transaction.
- Return type: `TABLE(health_event_id uuid, initial_record_id uuid)`.
- Security mode: `SECURITY INVOKER`.
- Owner: `postgres`.
- Search path: `public, pg_temp`.
- Overload count: 1.

## Final EXECUTE privileges

| Role | EXECUTE |
|---|---:|
| `anon` | false |
| `authenticated` | true |
| `service_role` | false |
| PUBLIC | revoked |

Supabase initially applied an explicit `service_role` EXECUTE grant. A controlled corrective `REVOKE` was applied and verified.

## Seed integrity

| Check | Result |
|---|---:|
| Active rows | 8 |
| Supported Primary Symptoms excluding Other | 7 |
| Hero rows | 3 |
| Active Other rows | 1 |
| Health categories excluding Other | 5 |

Original B1 catalog fingerprint remained unchanged:

`4554a4b0788a11e78927aa7993b418ac`

## Authenticated transaction test

Using an onboarding-complete authenticated test profile:

- RPC returned one `health_event_id` and one `initial_record_id`.
- Both INSERT operations passed RLS, FK, CHECK, and function validation.
- The outer transaction was rolled back.
- Post-rollback counts: Health Events 0, Initial Records 0, orphan Events 0.
- Both returned test IDs were confirmed absent after rollback.

## Negative onboarding test

Using an onboarding-incomplete authenticated profile:

- RPC rejected the request with SQLSTATE `P0001`.
- Message: `Completed onboarding is required`.
- Post-error counts: Health Events 0, Initial Records 0, orphan Events 0.

## Final status

- B1 Seed Content: **RESOLVED**
- B2 Atomic Event Creation RPC: **RESOLVED**
- P05 New Health Event Wizard: **READY TO IMPLEMENT**

No test Event or Initial Record remains in the database. No table, column, RLS policy, trigger, constraint, index, Auth setting, or Seed Content was changed during B2-B.
