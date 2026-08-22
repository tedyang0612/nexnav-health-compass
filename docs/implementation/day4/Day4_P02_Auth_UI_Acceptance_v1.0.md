# NexNav Day 4 — P02 Existing Auth UI Acceptance

**Version:** v1.0  
**Final status:** PASS  
**Date:** 2026-08-18

## 1. Scope

P02 refined the existing `/login` and `/register` pages. It did not replace the Auth architecture or add a second Supabase client.

## 2. Validation and Accessibility

- Email required and format validation.
- Password required on Login.
- Registration password minimum: 8 characters.
- Password confirmation must match.
- Blur and submit validation.
- First invalid field receives focus.
- Labels, `htmlFor`, autocomplete, input type, and input mode are present.
- Errors use icon plus text, `aria-invalid`, and `aria-describedby`.
- Submission controls are disabled while pending and guarded against duplicate submission.

## 3. User-facing States

- Login pending text: `<登入中>`
- Registration pending text: `<建立帳號中>`
- Incorrect credentials: `Email 或密碼不正確，請重新確認。`
- Raw Supabase error details are not exposed.

## 4. Supabase Usage

- `supabase.auth.signInWithPassword`
- `supabase.auth.signUp`
- Profile `onboarding_completed` SELECT after login for destination selection

No Profile insert/upsert, RPC, view, service-role key, or third-party login UI was added.

## 5. Email Confirmation Decision and Test

The P0 Demo target requires registration to proceed directly to Onboarding. Supabase `Confirm email` was therefore confirmed disabled by the project owner.

Verified behavior with a new email:

- Registration returned a session.
- The user entered `/onboarding` directly.
- No verification-email screen was required after the setting was disabled.

The frontend safely retains both possible branches: session returned → Onboarding; no session → verification guidance.

## 6. Manual Acceptance

- Correct registration entered Onboarding.
- Correct login entered Onboarding or Dashboard according to Profile completion.
- Incorrect credentials displayed the unified safe error.
- Google/third-party login UI was absent.
- P01 route foundation and logout sequence were preserved.

## 7. No-change Confirmation

P02 did not modify schema, RLS, triggers, functions, RPCs, migrations, Seed Content, or the database Profile trigger. The Auth setting change was performed manually by the project owner and not by Lovable.
