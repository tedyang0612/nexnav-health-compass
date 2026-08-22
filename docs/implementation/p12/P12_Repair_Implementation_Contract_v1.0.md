# NexNav P12 Repair Implementation Contract v1.0

**Status:** Frozen for implementation review  
**Module:** P12 Summary / Prepare  
**Date:** 2026-08-22  
**Purpose:** Repair confirmed submission-flow defects and apply the approved Summary information design without changing stored snapshot data or database architecture.

---

## 1. Outcome

P12 is complete only when:

1. One confirmation attempt can create at most one immutable summary version.
2. Successful confirmation navigates directly to the created Ready Summary without an unsaved-change interruption.
3. A stale Preview cannot be confirmed until the user explicitly regenerates it.
4. `priority_care` users cannot create a Professional Summary.
5. Preview and Ready Summary use the approved, readable Desktop and Mobile presentation.
6. Existing Ready Summary versions receive the new renderer without changing their stored snapshot content.

---

## 2. Strict Scope

### 2.1 In scope

- `/events/:eventId/summary/new`
- `/events/:eventId/summary/new?type=medical`
- `/events/:eventId/summary/new?type=professional`
- `/summaries/:summaryId`
- Shared Summary snapshot rendering used by Preview and Ready Summary
- Confirmation state, dirty-state release, duplicate-submit protection and success navigation
- `priority_care` Summary selection restrictions
- Locked P12 wording and responsive presentation

### 2.2 Out of scope

- Supabase schema, migrations, RPC definitions, RLS or permissions
- Stored Summary snapshots or existing Summary rows
- P09 Daily Track success-message styling
- P10 chart markers, card-title spacing or trend calculations
- P04 Dashboard identification and CTA redesign
- P11 Navigate logic, except consuming its existing Safety result for the P12 gate
- PDF, sharing, Summary charts and basic-profile inclusion options
- Global navigation redesign
- Creation, deletion or cleanup of test summaries

No database approval should be requested for this repair.

---

## 3. Non-Negotiable Data Invariants

1. Ready Summary snapshots remain immutable.
2. Existing `v1`, `v2` and later versions remain readable.
3. Version numbering remains independent per `event_id + summary_type`.
4. Medical and Professional Summary types remain separate.
5. Existing source fingerprint and stale-Preview validation remain authoritative.
6. Existing owner-only access behavior remains unchanged.
7. Existing RPC idempotency contract remains unchanged and must be used correctly by the frontend.
8. No existing snapshot may be rewritten merely to adopt the new visual layout.
9. Renderer changes may alter presentation only; they must not alter saved values, dates, selected privacy content, questions, target professional or Safety content.

---

## 4. Functional Repair Contract

### P12-F01 — Stable confirmation session

- Create one confirmation/submission identifier for the current Summary confirmation session.
- Do not regenerate it on button clicks, re-renders, loading-state changes or retry attempts.
- All retries belonging to that confirmation session must send the same identifier.
- Keep the identifier stable if the first request result is uncertain or fails transiently.
- A new identifier may be created only for a clearly new Summary-creation session after the previous one has completed and the user intentionally starts another version.

### P12-F02 — Atomic submit state

When the user clicks `確認正確`:

1. Immediately set the page to submitting state.
2. Disable `確認正確` and all actions that could start another confirmation.
3. Show a clear processing label such as `確認中…`.
4. Call the existing confirmation RPC once using the stable confirmation identifier.
5. Do not allow double-click, Enter-key repeat or repeated event handling to start another request.

### P12-F03 — Success navigation must bypass the dirty guard

After a successful RPC response:

1. Record the returned `summaryId`.
2. Set confirmation success state.
3. Clear the builder dirty state.
4. Remove or bypass `beforeunload` and in-app navigation blockers for this success transition.
5. Navigate directly to `/summaries/:summaryId`.
6. Do not show `尚未儲存變更` during this transition.
7. Do not leave the user on an active confirmation page after a successful write.

The dirty guard remains active only for a user-initiated exit after actual edits and before successful confirmation.

### P12-F04 — Retry behavior

- A retry after a transient error must reuse the same confirmation identifier.
- If the server reports that the identifier already created a Summary, treat the returned existing Summary as success and navigate to it.
- A retry must never create `v2` for the same confirmation intent.
- Error state must re-enable a controlled retry only after the current request has settled.

### P12-F05 — Source-change blocking

Preserve the already-passing behavior:

- A Preview is tied to the source fingerprint the user actually reviewed.
- If the source changes, disable `確認正確`.
- Show: `來源紀錄已更新，請重新產生預覽並再次確認。`
- Provide `重新產生預覽`.
- Regeneration must update the Preview to current source values.
- Style this blocking state as a compact amber/caution callout, not a normal blue information message and not a red urgent alert.

### P12-F06 — `priority_care` restriction

- At `/events/:eventId/summary/new` without `type`, a `priority_care` Event shows only the Medical Summary option.
- Do not render the Professional Summary card or CTA.
- Direct access to `?type=professional` remains blocked by the existing client and server rules.
- Existing historical Professional Summary versions remain readable.
- Normal Events continue to show both Summary options.

---

## 5. Locked Wording Contract

Apply consistently to Medical and Professional Preview and Ready Summary:

| Current | Required |
|---|---|
| `平台安全確認` | `安全確認` |
| `於 YYYY/MM/DD 完成平台安全確認…` | `於 YYYY/MM/DD 完成安全確認…` |

Additional rules:

- Keep the title `醫療溝通摘要` for the Medical type.
- Keep the title `其他健康專業諮詢摘要` for the Professional type.
- When no associated symptoms exist, hide the entire `一併出現的狀況` row. Do not render an empty label, colon or placeholder-only row.
- Preserve the locked `priority_care` Medical wording and 119 instruction.
- Preserve existing Medical and Professional disclaimers.

---

## 6. Shared Renderer Contract

Use one shared presentation system for:

- Medical Preview
- Professional Preview
- Medical Ready Summary
- Professional Ready Summary
- Existing historical Ready Summary versions

Do not build separate divergent Desktop/Ready renderers. The same snapshot values must produce the same information hierarchy in Preview and Ready states; only page-level actions and status messaging differ.

The renderer must tolerate older snapshots with missing optional fields. Missing optional content is hidden gracefully and must not crash the page.

---

## 7. Approved Summary Information Design

### P12-UI01 — Summary header

- Display the complete Summary type title.
- Preview shows a compact `這只是預覽` notice.
- Ready Summary shows confirmation date and version.
- On Mobile, the back action occupies a separate row below the title/status area.
- Do not truncate `其他健康專業諮詢摘要`.
- Confirmation date and version must wrap as a unit without awkward single-character line breaks.

### P12-UI02 — `狀況重點`

Desktop uses four compact key-information cells:

1. 主要不適
2. 追蹤期間與共 N 筆紀錄
3. 困擾程度：初始 → 最新
4. 每日追蹤出現頻率：最早 → 最新

Also show the latest subjective change as a clearly labeled value without burying it in dense body text.

Mobile uses a responsive 2 × 2 key-information grid where practical and stacks safely at narrow widths.

Severity remains numeric (`N/10`) or uses the existing accessible progress treatment. Do not render ten decorative dots.

### P12-UI03 — Mismatch caution

When numeric direction and subjective feeling differ:

- Keep the existing mismatch logic.
- Show the locked message in a compact amber/caution callout.
- Do not use red urgent styling.

### P12-UI04 — `生活狀況` Desktop

Use a compact comparison table:

- Rows: 飲食、睡眠、壓力、活動
- Columns: 初始紀錄 followed by each recorded Daily Track date
- Clearly label the initial data as `初始紀錄`.
- Never render an unlabeled initial row.
- If the number of dates exceeds available width, scrolling is contained inside the comparison region; the page itself must not overflow horizontally.

Each five-level value shows:

- Five circular markers
- Filled teal markers for the recorded level
- Neutral empty markers for remaining levels
- Visible numeric text such as `2/5`

Dots represent the recorded five-level position, not a universal good/bad judgment. Do not use stars.

### P12-UI05 — `生活狀況` Mobile

- Group by source/date: `初始紀錄`, then each Daily Track date.
- Use a compact 2 × 2 grid for 飲食、睡眠、壓力、活動.
- Each factor retains the five dots and visible `N/5`.
- No horizontal page scrolling.

### P12-UI06 — Frequency display

Frequency always uses the original wording as the primary meaning, for example:

- `反覆出現`
- `偶爾出現`

Five dots and `N/5` are secondary visual aids. Never show dots without the wording and numeric value.

### P12-UI07 — `每日追蹤變化`

Each Daily Track entry shows only:

- Date
- Severity (`N/10`)
- Frequency wording + five dots + `N/5`
- Subjective change
- Tried adjustment, when present

Do not repeat the four life-factor values inside every Daily Track entry; they belong in the dedicated `生活狀況` section.

Desktop may use aligned rows/cards. Mobile uses vertically stacked cards with clear labels and spacing.

### P12-UI08 — Safety section

- Heading: `安全確認`.
- Normal result uses calm confirmation styling.
- `priority_care` retains the existing prominent urgent treatment and checked warning items.
- Safety wording and urgency must not be inferred or altered by the visual redesign.

### P12-UI09 — Professional ordering

Professional Summary retains this order:

1. Consultation target
2. Selected private information, when present
3. Life context
4. Tried adjustments
5. Safety confirmation
6. Tracking changes
7. User questions, when present
8. Disclaimer

Medical Summary retains its existing medically oriented content order while adopting the same visual components.

### P12-UI10 — Empty optional content

Hide optional sections or rows when they contain no meaningful value. Do not render:

- Empty headings
- Labels followed by a blank colon
- Standalone em dashes as whole sections
- Empty cards created only to preserve spacing

---

## 8. Responsive and Accessibility Requirements

Verify at minimum:

- Desktop width
- Mobile widths from 375px to 430px
- Light mode
- Dark mode if currently supported

Requirements:

- No horizontal page overflow
- No clipped Summary title
- No overlapping back action
- No clipped markers, dates or values
- Five-level dots must include visible `N/5` text and accessible labels; meaning must not rely on color alone
- Buttons retain visible focus and disabled states
- Loading, caution, success and urgent states remain semantically distinct
- Existing navigation remains functional

---

## 9. State Requirements

### Loading

- Show an existing project-compatible loading state while source data or a Ready Summary is loading.
- Do not briefly render incorrect empty content.

### Empty

- If a required source record is genuinely unavailable, show a clear empty-state explanation and a safe return action.
- Do not create a Summary.

### Error

- Query or confirmation failure shows a readable inline error.
- Preserve the user's selections and questions.
- Retry uses the same confirmation identifier for the current attempt.

### Submitting

- Disable repeated confirmation.
- Show `確認中…`.
- Do not allow navigation that can race the confirmation request.

### Success

- Clear the dirty guard.
- Navigate once to the returned Ready Summary.
- Do not display an unsaved-change modal.

---

## 10. Acceptance Criteria

The repair is complete only when all items pass:

1. One confirmation click creates exactly one Summary version.
2. Rapid double-click cannot create a second request or version.
3. A retry of the same attempt returns the same Summary.
4. Successful confirmation navigates directly to `/summaries/:summaryId`.
5. No dirty-warning modal appears after successful confirmation.
6. User-initiated exit after actual edits still shows the dirty-warning modal.
7. Stale Preview remains blocked until regenerated.
8. Regenerated Preview displays current source values.
9. `priority_care` no-type selection shows only Medical.
10. `priority_care` Professional direct access remains blocked.
11. Existing historical Professional Summaries remain readable.
12. All Safety headings use `安全確認`.
13. Empty associated-symptom rows are hidden.
14. Desktop `狀況重點` uses the approved compact hierarchy.
15. Desktop life context uses the approved date comparison.
16. Mobile life context uses date groups and a 2 × 2 factor grid.
17. Five-level values use dots plus visible `N/5`, not stars.
18. Frequency retains wording plus dots and `N/5`.
19. Daily Track entries no longer duplicate life-factor values.
20. Daily Track entries retain date, severity, frequency, subjective change and tried adjustment.
21. Mobile Summary titles are not truncated.
22. Mobile back action does not compete with the title.
23. Existing Ready Summary versions use the new renderer without stored-data changes.
24. Medical and Professional disclaimers remain correct.
25. No schema, migration, RPC, RLS or stored snapshot is changed.
26. No unrelated module is modified.

---

## 11. Likely Frontend Touchpoints

Modify only files necessary to satisfy this contract. Expected touchpoints include:

- `src/routes/_app.events.$eventId.summary.new.tsx`
- `src/components/summary/SummarySnapshotView.tsx`
- `src/routes/_app.summaries.$summaryId.tsx`
- `src/lib/summary.ts`

Use existing shared components and semantic theme tokens. Additional small Summary-only components are allowed when they reduce duplication, for example:

- `SummaryKeyMetrics`
- `FiveLevelDots`
- `LifeContextComparison`
- `DailyTrackSummaryList`

Do not perform unrelated cleanup or architectural refactoring.

---

## 12. Validation Contract

Before reporting completion:

1. Run the project typecheck.
2. Run the existing development build validation.
3. Verify no schema, migration, RPC or RLS files changed.
4. Verify no test Summary rows were created during automated validation.
5. Report changed files.
6. Map every Acceptance Criterion to its implementation.
7. Explicitly report any criterion that could not be verified instead of claiming success.

Manual QA will follow with one screen and one action at a time. No additional implementation iteration is authorized until the full QA result is consolidated.

---

## 13. Implementation Stop Conditions

Stop and report before proceeding if implementation appears to require:

- A database migration
- An RPC signature change
- RLS or permission changes
- Rewriting existing Summary snapshots
- Deleting the test-created Professional `v2`
- Redesigning P09, P10, P11, Dashboard or global navigation
- Any behavior that conflicts with immutable version history

Do not improvise around these boundaries.

