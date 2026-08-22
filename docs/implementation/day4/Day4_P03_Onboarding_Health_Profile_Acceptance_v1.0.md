# NexNav Day 4 — P03 Onboarding and Health Profile Acceptance

**Version:** v1.0  
**Final status:** PASS  
**Date:** 2026-08-18

## 1. Delivered Flow

### `/onboarding`

A single-route two-step flow:

1. Basic Health Profile — required
2. Health Background — optional and skippable

### `/profile`

Loads the existing Profile row, supports editing the same fields, and updates only that row.

## 2. Basic Profile Contract

- Display name: trimmed, 1–20 characters.
- Birth year: dynamic range corresponding to ages 18–70 for the current year.
- Gender values:
  - 男性 → `male`
  - 女性 → `female`
  - 非二元性別 → `non_binary`
  - 其他 → `other`
  - 不願透露 → `prefer_not_to_say`

## 3. Health Background Contract

```json
{
  "chronic_conditions": [],
  "allergies": [],
  "medications": [],
  "other_notes": ""
}
```

Each list is built from trimmed non-empty lines. No additional JSON keys are written.

## 4. Database Behavior

- SELECT the authenticated user's existing Profile.
- UPDATE with `eq("id", user.id)` ownership filtering.
- Confirm the update matched an existing row.
- Never insert or upsert a Profile.
- Set `onboarding_completed = true` and `onboarding_completed_at` only when completing Onboarding.
- Profile edits do not change either Onboarding flag.

## 5. Navigation and State

- Step navigation preserves entered values.
- Internal step changes do not trigger Unsaved Changes.
- Leaving the route with edits triggers the responsive Unsaved Changes dialog.
- Successful Onboarding invalidates/refetches Profile state, clears dirty state, and replaces the route with `/dashboard`.
- Completed users manually entering `/onboarding` are returned to `/dashboard`.

## 6. Manual Acceptance Evidence

- Step 1 validation and Step 2 navigation passed.
- Returning to Step 1 preserved values.
- `<儲存中>` appeared and completion redirected to Dashboard.
- Refresh remained on Dashboard.
- Direct `/onboarding` access redirected to Dashboard after completion.
- `/profile` loaded all four Health Background values.
- Editing `other_notes`, saving, and refreshing preserved the updated value and all other values.
- Unsaved Changes behavior passed.
- Mobile layout was manually verified.

## 7. No-change Confirmation

P03 did not modify schema, RLS, triggers, functions, RPCs, migrations, Seed Content, Auth settings, P01 route gates, or Profile creation behavior.
