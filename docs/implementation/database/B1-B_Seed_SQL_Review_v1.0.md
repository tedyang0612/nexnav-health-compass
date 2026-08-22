# NexNav B1-B — Seed SQL Review

**Version:** v1.0  
**Status:** Reviewed; awaiting explicit deployment approval  
**Reviewed file:** `B1-B_Symptom_Catalog_Seed_v1.0.sql`  
**Content source:** `B1-A_Seed_Content_Definition_v1.0.md`  
**Review date:** 2026-08-18  

## 1. Outcome

The SQL is suitable for controlled execution in the existing NexNav Supabase project after explicit approval. It has not been executed.

It changes data rows in `public.symptom_catalog` only. It does not create, alter, or drop any schema object and does not change RLS, triggers, constraints, indexes, functions, RPCs, grants, Auth, profiles, user records, or unrelated Seed Content.

## 2. Compatibility Check

| Existing database rule | Review result |
|---|---|
| `code` is unique and matches `^[a-z0-9_]+$` | PASS |
| Category code length is 1–50 | PASS |
| Category name length is 1–50 | PASS |
| Display name length is 1–100 | PASS |
| Description maximum is 500 characters | PASS |
| Display order is non-negative | PASS |
| Exactly one active `Other` enforced by partial unique index | PASS |
| `set_updated_at` trigger exists | Compatible |
| Authenticated role has SELECT only on catalog | Preserved |
| Active-row RLS policy remains unchanged | Preserved |

## 3. Safety Properties

### Transactional load

The entire operation runs inside `begin` / `commit`. A failed preflight, constraint, unique index, upsert, or verification assertion rolls back the full load.

### Stable IDs

The script does not supply UUIDs. New rows use the table default. On rerun, `ON CONFLICT (code)` updates the existing row and preserves its UUID, `created_at`, and future foreign-key references.

### No-op rerun

The conflict update includes a row-level `IS DISTINCT FROM` condition. If an approved row already matches, it is not updated and its `updated_at` is not changed. A rerun therefore creates no duplicate rows and does not churn timestamps.

### Unexpected taxonomy protection

If an active row exists with a code outside the approved eight codes, the script aborts. It never silently deactivates, deletes, or overwrites unexpected active content.

### Other-row protection

The existing partial unique index allows only one active `Other`. The script also aborts before mutation if a different active row is already marked as `Other`.

## 4. Known Assumptions

1. The P05 readiness audit reported `symptom_catalog = 0`, so the expected first execution is eight inserts.
2. The script is designed for the existing schema from `Supabase_Migration.sql v1.0`.
3. Execution must use the NexNav Supabase SQL Editor or another project-owner-controlled database channel. It must not be run from the browser client or exposed to authenticated users.
4. This resolves B1 only. It does not create the B2 atomic Event + Initial Record RPC.
5. It does not provide Safety, Guide, or Navigate medical content.

## 5. Post-deployment Verification Required

After execution, collect evidence for:

1. SQL Editor success with the final ordered eight-row result.
2. `count(*) = 8` for active catalog rows.
3. Exactly one active `Other` row.
4. Exactly three Hero rows: `headache`, `fatigue`, `sleep_difficulty`.
5. Exactly five non-Other category codes.
6. All eight active rows are primary-enabled.
7. A real authenticated application session can SELECT the eight active rows.
8. An ordinary authenticated client cannot INSERT, UPDATE, or DELETE catalog rows.
9. A second controlled execution produces no duplicates and retains the same row IDs.
10. No unrelated table, policy, function, trigger, index, Auth setting, or user record changed.

## 6. Decision

**Review result:** PASS FOR CONTROLLED DEPLOYMENT  
**Deployment status:** NOT EXECUTED  
**B1 status:** Not resolved until deployment and post-deployment verification pass.

