# NexNav Day 4 — P05 New Health Event Wizard Acceptance

**Version:** v1.0  
**Final status:** PASS  
**Date:** 2026-08-18

## 1. Delivered Flow

`/events/new` is a single-route three-step Wizard:

1. 主要不適症狀
2. 相關症狀與生活狀況
3. 確認初始紀錄

Step changes preserve one shared form state and do not write to the database. Leaving with unsaved data triggers the existing responsive Unsaved Changes guard.

## 2. Step 1

- Seed-driven Hero symptoms and full catalog.
- Category filter derived from Seed category fields.
- Other is detected with `is_other`, never by hardcoded symptom text.
- Other requires 1–100 characters of custom Primary Symptom text.
- Started date defaults to Asia/Taipei today and rejects future dates.
- Severity: integer 1–10, displayed numerically without interpretive anchor labels.
- Frequency: required 1–5 locked scale.
- Optional frequency description: maximum 200 characters.
- Duration: positive integer and one of minutes/hours/days/weeks/months.

Desktop uses two columns for the complete symptom list; Mobile uses one. Other follows the final normal symptom in the same Desktop row.

## 3. Step 2

- Associated catalog symptoms exclude the selected Primary Symptom and Other.
- Custom related-symptom UI label: `其他症狀（選填）`.
- Associated symptom payload preserves order, removes duplicates, and normalizes each item to a catalog ID or custom text.
- Required Life Context values:
  - 睡眠狀況
  - 飲食狀況
  - 活動狀況
  - 壓力感受
- Each Life Context value is an integer 1–5.
- Optional supplemental description: maximum 1,000 characters.
- Life Context headings use a consistent stronger visual hierarchy without changing their wording.

## 4. Step 3

- Read-only review of both previous steps.
- Each section provides a return-to-edit action.
- Empty optional values display `未填寫`.
- Visible dates use `YYYY/MM/DD`.
- RPC dates remain `YYYY-MM-DD`.
- No UUID, internal code, enum, or database implementation detail is displayed.

## 5. Supabase Contract

The frontend uses:

- `symptom_catalog` SELECT
- Exactly one `supabase.rpc("create_health_event", payload)` call

It does not directly insert into `health_events` or `initial_records`, does not perform compensating deletes, and does not use a service-role key.

The generated Database type is the source for RPC Args and Returns. No `any`, `as any`, `as never`, `as unknown`, `@ts-ignore`, or forged RPC interface remains in P05 files.

The response must contain exactly one row with both `health_event_id` and `initial_record_id` before navigation succeeds.

## 6. Pending and Error Behavior

- Submit text: `<建立中>` with visible angle brackets.
- Spinner, disabled controls, and `submittingRef` prevent duplicate submission.
- A minimal double-animation-frame render yield allows the pending state to paint before a fast RPC response.
- Seed loading, error, and empty states are separated.
- Empty Seed disables progression and never uses hardcoded fallback symptoms.
- Database failures are mapped to safe Traditional Chinese messages.
- On invalid input, the first invalid field receives focus; selecting Other with empty custom text focuses that custom field before Frequency or Duration.

The successful real RPC completed too quickly for the user to visually capture `<建立中>`. This is recorded as a non-blocking observation because the render-yield, spinner, disabled state, duplicate guard, single RPC call, and successful database result were verified at implementation/behavior level.

## 7. Golden Path Evidence

Test Event:

`280ed19b-5dbd-4adb-92b0-e2ef28fd09a1`

Verified values:

| Field | Result |
|---|---|
| Primary Symptom | 頭痛 |
| Status | `active` |
| Started date | `2026-08-18` |
| Severity | 5 |
| Frequency level | 2 |
| Frequency description | NULL |
| Duration | 2 days |
| Initial Record revision | 1 |
| Life Context | sleep 3, diet 4, activity 2, stress 3 |
| Supplemental description | NULL |
| Event/Record owner match | true |

Associated Symptoms contained the two selected Seed symptoms and one user-entered custom item.

Atomicity verification:

| Check | Result |
|---|---:|
| Event rows for returned Event ID | 1 |
| Initial Record rows for returned Event ID | 1 |
| Orphan Events | 0 |

Successful completion redirected to:

`/events/280ed19b-5dbd-4adb-92b0-e2ef28fd09a1/safety`

The Safety page remained a placeholder because P06 was not part of P05.

## 8. Responsive and Accessibility Acceptance

- Desktop horizontal Global Navigation passed.
- Desktop symptom grid and Other placement passed.
- Mobile hamburger/Sheet menu passed.
- Mobile Wizard and options rendered in one column without horizontal overflow.
- Mobile Sheet contained 我的狀況、新增狀況追蹤、健康檔案、登出.
- Mobile Step 2 label and Life Context heading hierarchy passed.
- Other-empty validation automatically scrolled/focused the correct field.
- Typecheck passed with zero errors and no JavaScript console error was reported.

## 9. No-change Confirmation

P05 did not modify schema, RLS, triggers, constraints, indexes, migrations, Seed Content, the deployed RPC, or Auth settings. It did not start Safety, Guide, Dashboard, Edit, Track, Reassess, Navigate, or Summary implementation.
