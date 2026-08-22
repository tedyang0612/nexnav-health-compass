# NexNav MVP — Product Requirements Document (PRD)

**Version:** v1.0  
**Status:** Locked for Day 1 MVP Development  
**Product:** NexNav  
**Development Mode:** AI Vibe Coding  
**Primary Stack:** ChatGPT (GPT-5.6) + Lovable Pro + Supabase Free  
**AI Strategy:** No OpenAI API in MVP; AI-like outputs use curated content, rule logic, and mock data.

---

## 1. Document Overview

This PRD is the source of truth for the 10-day NexNav MVP. It defines product scope, functional requirements, cross-module rules, acceptance criteria, safety boundaries, data/privacy principles, content strategy, technical constraints, and Definition of Done.

Detailed database tables belong in `03_Database_Schema.md`; detailed UI layouts belong in `04_Screen_Spec.md`; implementation prompts belong in `05_Lovable_Prompt_Library.md`.

## 2. Product Summary

NexNav is a health navigation and tracking platform for adults who have health-management needs or mild discomfort and are accustomed to using digital tools to record or search for health information.

The product helps users record a health concern, pass through a safety check, understand relevant general health information, try practical improvement suggestions, track changes over time, determine when professional support may be appropriate, and prepare a structured summary for communication with healthcare or health professionals.

NexNav is not a diagnostic service and does not replace professional medical evaluation.

## 3. Product Goals & Non-Goals

### 3.1 MVP Goals
- Run the P0 Golden Path end-to-end with real authenticated users and persistent Supabase data.
- Make longitudinal health tracking the core product capability rather than a one-time questionnaire.
- Provide source-backed general health information and navigation while maintaining clear safety boundaries.
- Help users communicate a tracked health situation more clearly when professional support is needed.
- Encourage greater awareness of personal health management through structured recording and follow-up.

### 3.2 Non-Goals
- Medical diagnosis, treatment, prescription, medication adjustment, or clinical decision-making.
- Real OpenAI/API-generated health analysis.
- Real provider availability, telehealth, or medical appointment integration.
- Full community/UGC system.
- Wearable-device integration.
- Automated health-report OCR/clinical interpretation.
- Complex medical rules engine or proprietary clinical scoring system.

## 4. Target User

### Primary Target User
Adults aged **18–55** who:
- have health-management needs and/or mild discomfort;
- are uncertain whether self-observation, lifestyle adjustment, or professional help is appropriate;
- are comfortable using digital tools to record or search for information.

### Important Boundary
NexNav must not assume all users entering the product have mild conditions. Safety Check exists to route potentially concerning situations toward medical evaluation.

## 5. Value Proposition

NexNav turns fragmented health observations into a structured journey:

1. record what is happening;
2. understand relevant general information and possible factors;
3. decide what to do next;
4. act on practical suggestions;
5. track changes;
6. reassess the recorded trend;
7. navigate toward appropriate professional support when needed;
8. prepare a concise summary for communication.

Beyond resolving a single health concern, NexNav aims to increase users' awareness of ongoing health management.

## 6. Product Loop & Golden Path

### 6.1 Product Loop
**Record → Understand/Guide → Decide → Act → Track → Reassess → Navigate → Prepare/Communicate**

Safety Check operates immediately after Record and may redirect the user to Navigate before Guide.

### 6.2 P0 Golden Path
**Account/Profile → Record → Safety Check → Guide → Act → Track → Reassess → Navigate → Prepare**

### 6.3 Safety Route
**Record → Safety Check → Priority Medical Assistance → Navigate → Prepare**

Prepare does not require Reassess. An initial-record-only medical summary is valid.

## 7. User Roles

### 7.1 MVP Role
**Authenticated User**
- owns and manages their own health profile, Health Events, tracks, summaries, and related data.

### 7.2 Future Roles
Healthcare/health professionals, moderators, administrators, and community roles are outside P0 unless represented only by mock content.

## 8. MVP Scope

### 8.1 P0 — MVP Core
- Email authentication
- Google authentication
- Health Profile onboarding/editing
- Record / Health Event
- Safety Check
- Guide
- Act as a journey stage
- Daily Track
- Reassess
- Navigate
- Prepare / Health Summary

### 8.2 P1 — Demo Plus
- Facebook login
- 14-day inactivity reminder
- Enhanced trend chart
- PDF/summary history UI
- Connect / mock appointment
- Product Feedback

### 8.3 P2 — Future Prototype
- History UI for closed tracking
- Experience Sharing mock prototype
- Wearable-device UI prototype
- Health-report upload UI prototype

### 8.4 Post-MVP
- OpenAI/API-generated analysis
- Advanced medical rules
- Real provider integration
- Real appointment/telehealth integration
- Real community and moderation
- Wearable integration
- Health-report parsing/AI analysis
- FHIR/share links/advanced interoperability
- Advanced feedback analytics

### 8.5 Scope Boundaries
- Three hero symptom groups receive richer demo content; remaining supported symptoms receive minimum viable trusted content.
- `Other` uses safe fallback content rather than guessed causes or specialties.
- No P1/P2 work may block P0 completion.
- **Day 6 Kill Switch:** if P0 Golden Path is not end-to-end functional by the end of Day 6, stop P1/P2 implementation and focus exclusively on P0 integration, defects, and demo readiness.

## 9. Functional Requirements

### 9.1 Account & Health Profile
- Support email/password registration and login.
- Support Google OAuth through Supabase.
- First-time authenticated users without a completed profile enter onboarding.
- Onboarding has two steps:
  1. Basic Health Profile
  2. Health Background (optional)
- Optional background may be skipped.
- Existing profile data can be edited.
- Logout clears the session.
- Completed users return directly to Dashboard.

### 9.2 Record — Health Event
A **Health Event** is the technical entity representing one user-facing **狀況追蹤**.

- One Health Event = one Primary Symptom + zero or more Associated Symptoms.
- Support 5 categories / 7 Primary Symptoms + `Other`.
- Creation uses three steps:
  1. Main discomfort
  2. Related conditions/context
  3. Review and confirm
- Record severity, frequency/duration, associated symptoms, Life Context, and optional supplemental description.
- Life Context includes sleep, diet, activity, and stress and is required at creation.
- Supplemental prompt:
  - 「關於症狀還有其他想補充嗎？例如，常發生時間 / 身體反應，或其他具體描述？」
  - Example: 「通常下午工作到三點左右開始比較明顯，休息後會稍微改善。」
- Multiple active Health Events are allowed.
- Initial Record may be edited, but the original start date remains unchanged.
- After creation, Primary Symptom is locked. If incorrect, close the Event and create a new one.
- Changed fields expose/enable an Update action.
- Relevant updates invalidate downstream Safety/Guide assumptions and trigger required refresh logic.
- Users decide when to close tracking.
- Closing sets the Event to closed; it never deletes historical data.
- Closed Events disappear from the P0 active list.
- Closed-event History UI is P2.

### 9.3 Safety Check
- Safety Check is mandatory after new Health Event creation.
- Use short, point-and-click questions and rule-based logic.
- Internal states:
  - normal
  - attention
  - priority care
- User-facing UI uses natural-language results, not internal labels.
- Normal → Guide is primary.
- Attention → Guide plus Navigate option.
- Priority Care → Navigate is primary.
- Safety results must alter routing, not merely copy.
- Relevant Initial Record updates trigger a new Safety Check.
- Daily Track may trigger a short Safety Recheck when rule conditions are met.
- Safety failure must fail safe: never treat an evaluation error as Normal.
- Priority Care does not close the Event or disable Track.
- Priority medical-assistance messaging remains visible until a newer valid Safety result changes the state.
- Safety Result takes precedence over Reassess Trend.

### 9.4 Guide
Guide contains four required layers:
1. Health Context Summary
2. General Health Information / Possible Factors
3. 2–3 Improvement Suggestions
4. Observation Guidance

Rules:
- Guide uses Primary Symptom template plus user context.
- It must not merely repeat Life Context as generic advice.
- Possible factors must be framed as general/source-backed information, not diagnosis.
- Trusted sources must be real and traceable.
- Sources use progressive disclosure (e.g. 「查看資訊來源」).
- All 7 supported Primary Symptoms have a valid Guide route.
- Three hero groups receive deeper demo content.
- `Other` uses a safe generic fallback and does not guess causes.
- Guide refreshes after relevant Record changes and successful Safety re-evaluation.

### 9.5 Act
Act remains a Product Loop stage, not an independent module.
- Guide invites users to try 2–3 suggestions.
- Completion is not mandatory.
- No habit tracker, streak, task manager, or reminder entity is required.
- Guide Suggestions flow into Daily Track as Suggestions Execution.

### 9.6 Track
- One Daily Track per Health Event per calendar day.
- Different active Health Events can each have their own Daily Track on the same day.
- Track captures:
  - severity;
  - frequency;
  - subjective change;
  - sleep/diet/activity/stress context;
  - execution of current Guide Suggestions;
  - optional notes.
- Current-day Track is editable.
- Historical Track is read-only in P0.
- Updating today edits the existing row rather than inserting another.
- Closed Events cannot receive new Tracks.
- Historical Track retains the Suggestion snapshot/reference applicable when that Track was created.
- Track may trigger Safety Recheck.
- Successful Track updates Event Detail, Timeline, tracking duration, and Reassess.

### 9.7 Reassess
- Full Reassess requires Initial Record + at least 2 Daily Tracks.
- Before eligibility, show an explicit data-insufficient/progress state.
- Baseline = Initial Record.
- Current = latest valid Daily Track.
- Overall Trend is a record-based UI classification, not a clinical judgment.
- MVP severity rule:
  - Current − Baseline ≤ -2 → improvement
  - -1 to +1 → no clear change
  - ≥ +2 → worse
- Frequency is shown separately and is not combined into a weighted score.
- Overview includes:
  - directional interpretation;
  - baseline → current severity;
  - frequency change;
  - tracking duration;
  - record count where useful.
- Timeline shows the chronological Event history using real stored data.
- Subjective Change remains separate from computed recorded trend.
- No causal claim between actions/context and symptom change.
- Navigate remains available for all trends; worsening increases CTA prominence.
- Safety rules override trend-based CTA priority.

### 9.8 Navigate
P0 entry points:
- Safety Route
- Reassess
- user-initiated navigation

Structure:
- Medical Care
- Other Professional Support

Rules:
- Priority Safety route shows Medical Care only; Professional Support is hidden.
- Primary Symptom selects the base navigation template.
- Associated Symptoms add context; they do not create disease prediction.
- Existing tracking history may provide navigation context.
- Direction is shown before mock professional resources.
- Medical-direction templates require trusted sources.
- Mock professionals must be clearly labeled as demonstration data.
- Professional Support uses curated context, not automatic symptom-to-provider mapping.
- Medication-related content must never recommend stopping/changing medication or dosage.
- `Other` or missing template uses safe general medical-evaluation fallback and does not guess a specialty.

### 9.9 Prepare
Two user-facing outputs:
- **產生就醫摘要** for Medical Care
- **產生諮詢摘要** for Professional Support

Rules:
- Both use one shared Core Health Summary model.
- Entry from Navigate or Health Event Detail.
- Summary is bound to one Health Event.
- Summary may be generated with zero Tracks; unavailable trend fields explicitly state insufficient data.
- Core sections:
  1. Main condition
  2. Tracking change
  3. Context and supplemental notes
  4. Life Context
  5. Actions tried
  6. user-selected Health Background
  7. up to 3 questions for the professional
- Initial supplemental description is included by default when present.
- Daily Track notes are user-selectable.
- Health Background inclusion is user-controlled.
- Preview asks: **「這份摘要是否正確？」**
- Confirmation CTA: **「確認正確」**
- Source health data cannot be edited directly in the summary; user returns to the source record.
- Summary is a snapshot. Later source changes never mutate an old summary.
- If relevant source data changes, old summary remains available but can be identified as not latest; user may generate a new summary.
- MVP statuses: `draft`, `ready`.
- Summary does not make causal or diagnostic claims.
- Existing summaries remain stored when an Event is closed.

### 9.10 Connect — P1
- Mock professional detail
- Mock appointment flow
- online/in-person mock mode
- mock time slots
- appointment persistence
- cancellation
- optional summary attachment
- upcoming appointment display
- Completing Connect does not close tracking and does not trigger Product Feedback.

### 9.11 Product Feedback — P1
Trigger only after user confirms closing a Health Event.
- 5-level helpfulness response
- optional comment
- may be skipped
- private product feedback
- never automatically becomes public Experience Sharing content

### 9.12 Future Prototype
#### History
P2 read-only History UI for closed Health Events.

#### Experience Sharing
P2 mock content only; no real posting/comments/likes/follow/report/moderation in the 10-day MVP.

#### Wearables
P2 prototype/Coming Soon UI only.

#### Health Report
P2 upload prototype/Coming Soon UI only; no OCR or medical interpretation.

## 10. Cross-Module Business Rules

1. Primary Symptom is immutable after Health Event creation.
2. Initial Record edits do not change Event start date.
3. Relevant Record edits require Safety re-evaluation before refreshed Guide assumptions are treated as valid.
4. Safety Result has higher routing priority than Reassess Trend.
5. Priority Care does not disable Track.
6. Reassess worsening does not automatically equal Priority Safety.
7. Guide Suggestion changes do not rewrite historical Track execution; historical Track preserves the applicable suggestion snapshot/reference.
8. Summary is immutable snapshot content once generated; source updates require a new summary version/snapshot.
9. Reassess requires sufficient longitudinal data; Prepare does not.
10. Closed Event means no new Track, not data deletion.
11. User data ownership applies across Profile, Event, Track, Safety, Summary, and related records.
12. `Other` never causes guessed medical causes or specialty mapping.

## 11. Acceptance Criteria

Acceptance Criteria use **Given → When → Then + Edge Cases**. P0 is Done only when Functional, Data, UX, and minimum Error/Edge behavior all pass.

### 11.1 Account & Profile
- **AC-AC-01 Email Account:** Given unauthenticated user, when valid credentials are submitted, then Supabase Auth creates/authenticates the user and a valid session exists.
- **AC-AC-02 Google Login:** Google OAuth authenticates/identifies the user without duplicate profile creation.
- **AC-AC-03 First Login:** authenticated user without completed profile is routed to onboarding.
- **AC-AC-04 Basic Profile:** required fields block progression until valid.
- **AC-AC-05 Optional Background:** background can be completed or skipped.
- **AC-AC-06 Onboarding Complete:** profile persists and later login routes to Dashboard.
- **AC-AC-07 Edit Profile:** edits update existing profile rather than inserting duplicates.
- **AC-AC-08 Logout:** session clears and protected routes redirect to Login.

### 11.2 Record
- **AC-RC-01:** authenticated/profile-complete user can start a new tracking flow.
- **AC-RC-02:** Step 1 required main-condition fields must validate.
- **AC-RC-03:** `Other` requires custom Primary Symptom text and must not crash downstream flow.
- **AC-RC-04:** Associated Symptoms may be zero; all four Life Context fields are required.
- **AC-RC-05:** supplemental description is optional.
- **AC-RC-06:** review step displays entered data and supports return/edit before creation.
- **AC-RC-07:** confirmed creation persists Event + Initial Record, links user, sets active status, and enters Safety Check.
- **AC-RC-08:** Dashboard active card is read from Supabase, not hard-coded.
- **AC-RC-09:** multiple active Events remain independent.
- **AC-RC-10:** editable Initial Record preserves original start date.
- **AC-RC-11:** changed data enables Update and updates the existing Event.
- **AC-RC-12:** closing sets closed status and preserves data.
- **AC-RC-13:** closed Event disappears from active list; read-only History UI is P2.

### 11.3 Safety Check
- **AC-SF-01:** new Event must pass through Safety Check before normal Guide route.
- **AC-SF-02:** required safety questions must be answered before result.
- **AC-SF-03:** Normal routes primarily to Guide.
- **AC-SF-04:** Attention exposes Guide and Navigate.
- **AC-SF-05:** Priority Care routes primarily to Navigate.
- **AC-SF-06:** states must alter flow.
- **AC-SF-07:** valid result persists against the Event.
- **AC-SF-08:** relevant Initial Record edits invalidate old assumptions and require Safety recheck.
- **AC-SF-09:** qualifying Track can trigger short Safety Recheck.
- **AC-SF-10:** rule/data failure never defaults to Normal; show retry and medical-navigation option.

### 11.4 Guide
- **AC-GD-01:** eligible Event loads Guide using latest valid context.
- **AC-GD-02:** all four Guide layers render.
- **AC-GD-03:** Guide includes symptom-specific general information, not Life-Context-only generic advice.
- **AC-GD-04:** sources are expandable/traceable.
- **AC-GD-05:** medical-information sources are real, never invented mock sources.
- **AC-GD-06:** all supported Primary Symptoms have a non-empty Guide path.
- **AC-GD-07:** `Other` uses safe fallback without guessed causes.
- **AC-GD-08:** 2–3 primary suggestions are shown.
- **AC-GD-09:** Guide avoids diagnostic claims.
- **AC-GD-10:** relevant Record update refreshes Guide only after required Safety flow.

### 11.5 Act
- **AC-ACT-01:** Guide clearly invites practical action followed by tracking.
- **AC-ACT-02:** action completion is not mandatory to continue.
- **AC-ACT-03:** Guide Suggestions map into Track Suggestions Execution.
- **AC-ACT-04:** no independent Act entity/task system is required.

### 11.6 Track
- **AC-TR-01:** active Event can create today's Track.
- **AC-TR-02:** same Event cannot have two Tracks for the same date.
- **AC-TR-03:** separate Events can each have a Track on the same date.
- **AC-TR-04:** all required Track fields persist.
- **AC-TR-05:** execution items correspond to applicable Guide Suggestions.
- **AC-TR-06:** unexecuted suggestions do not block submission.
- **AC-TR-07:** today's edit updates existing Track.
- **AC-TR-08:** historical Track is read-only in P0.
- **AC-TR-09:** successful Track refreshes Event Detail/Timeline/Reassess.
- **AC-TR-10:** closed Event cannot add Track.
- **AC-TR-11:** qualifying data triggers Safety Recheck.

### 11.7 Reassess
- **AC-RA-01:** full Reassess begins at Initial + 2 Tracks.
- **AC-RA-02:** insufficient data shows explicit progress state.
- **AC-RA-03:** baseline uses Initial Record.
- **AC-RA-04:** current uses latest Track.
- **AC-RA-05:** trend wording describes recorded change, not clinical status.
- **AC-RA-06:** overview combines direction, severity, frequency, and duration rather than numbers alone.
- **AC-RA-07:** Timeline presents chronological tracking history.
- **AC-RA-08:** Timeline uses stored Event data.
- **AC-RA-09:** new Track automatically refreshes Reassess.
- **AC-RA-10:** subjective change and computed trend remain distinct.
- **AC-RA-11:** no causal inference.
- **AC-RA-12:** Navigate CTA remains available; Safety has priority.
- **AC-RA-13:** tracking duration uses elapsed Event time, not Track count.

### 11.8 Navigate
- **AC-NV-01:** Safety, Reassess, and user action can enter Navigate.
- **AC-NV-02:** Medical Care and Professional Support are distinct.
- **AC-NV-03:** Priority Safety hides Professional Support.
- **AC-NV-04:** Primary Symptom selects a curated/source-backed base direction.
- **AC-NV-05:** Associated Symptoms provide context, not disease prediction.
- **AC-NV-06:** available tracking history may be shown as context.
- **AC-NV-07:** direction precedes provider cards.
- **AC-NV-08:** medical navigation sources are traceable.
- **AC-NV-09:** mock professionals are labeled demonstration data.
- **AC-NV-10:** Professional Support uses curated context.
- **AC-NV-11:** no medication stopping/dose-changing advice.
- **AC-NV-12:** `Other` uses general-evaluation fallback.
- **AC-NV-13:** missing template fails safely and never invents specialty mapping.

### 11.9 Prepare
- **AC-PR-01:** medical and professional-support contexts expose the correct summary CTA.
- **AC-PR-02:** Navigate and Event Detail can enter Prepare.
- **AC-PR-03:** Summary contains data from one Event only.
- **AC-PR-04:** required summary architecture is present.
- **AC-PR-05:** user chooses which Health Background data is included.
- **AC-PR-06:** initial supplemental description is included by default when present.
- **AC-PR-07:** Daily Track notes are user-selectable.
- **AC-PR-08:** 0–3 user questions are allowed.
- **AC-PR-09:** generation leads to Preview before ready status.
- **AC-PR-10:** Preview asks 「這份摘要是否正確？」 and supports 「確認正確」.
- **AC-PR-11:** source data is corrected at source, not edited inside Summary.
- **AC-PR-12:** Summary remains a snapshot after future Track changes.
- **AC-PR-13:** changed source data permits generating a latest summary without overwriting the old one.
- **AC-PR-14:** statuses are draft/ready.
- **AC-PR-15:** no Life Context causal inference.
- **AC-PR-16:** Actions Tried do not claim effectiveness.
- **AC-PR-17:** summary includes non-diagnostic reference disclaimer.
- **AC-PR-18:** existing summary data survives Event closure.

## 12. Safety & Medical Boundaries

- NexNav provides health information/navigation, not diagnosis.
- Safety routing is conservative and rule-based for MVP.
- Never infer that a Safety processing error means the user is safe.
- Never fabricate medical sources, conditions, or specialty recommendations.
- Never advise medication cessation or dosage changes.
- Trend thresholds are UI organization rules only, not clinical thresholds.
- Improvement suggestions are general and cannot be represented as treatment.
- Priority Safety takes precedence over product-engagement goals.
- User may always seek professional help regardless of NexNav result.

## 13. Data & Privacy Principles

- Every user-owned record is scoped to the authenticated user.
- Supabase Row Level Security is required for user health data.
- Data stored in NexNav is not automatically data shared in a summary.
- Summary Health Background is explicitly user-selected.
- Closing an Event is a status transition, not deletion.
- Historical records and summaries remain internally available for future History UI.
- Summary snapshots must remain historically stable.
- P0 should minimize sensitive data collection to fields required by the defined product flow.

## 14. Content Strategy

### 14.1 Supported Content
- 5 categories / 7 Primary Symptoms + Other.
- 3 hero symptom groups receive deeper content:
  - headache/dizziness
  - fatigue/sleep difficulty
  - gastrointestinal discomfort
- Remaining supported symptoms receive minimum viable trusted content.
- `Other` receives safe fallback.

### 14.2 Source Policy
- Guide and Navigate health/medical claims require trustworthy, real sources.
- Sources are displayed through progressive disclosure.
- Mock data may simulate personalization/provider listings, but not source authority.

### 14.3 Content Boundary
Do not turn the 10-day MVP into a health encyclopedia. Content exists to demonstrate the Product Loop safely and credibly.

## 15. MVP Success Metrics

Given the 10-day delivery window and prior user discovery, MVP validation focuses on functional usability rather than statistically meaningful product-market validation.

Minimum validation:
- P0 Golden Path can be completed end-to-end.
- No critical data isolation or Safety routing defects.
- A small number of available classmates/familiar testers may perform usability walkthroughs.
- Testers can understand:
  - how to create a tracking Event;
  - what the Guide is communicating;
  - how to add Daily Track;
  - what Reassess means;
  - how to find professional direction;
  - how to generate a usable summary.
- Qualitative friction and comprehension issues are recorded for iteration.

No requirement for large-sample user testing during the 10-day sprint.

## 16. Technical Constraints

- Frontend/app generation: Lovable Pro.
- Backend/database/authentication: Supabase Free.
- Product/specification/review: ChatGPT (GPT-5.6).
- No OpenAI API in v1.0.
- AI-like analysis uses curated templates, rule logic, and mock data.
- P0 must function with persistent Supabase data rather than hard-coded user records.
- RLS is mandatory for user-owned health data.
- Keep architecture simple enough for a non-programmer Vibe Coding workflow.
- Avoid scheduled jobs, complex background services, clinical scoring engines, or unnecessary integrations in P0.

## 17. Definition of Done

A P0 capability is Done only when:

### Functional
The intended user action can be completed end-to-end.

### Data
The expected data is correctly persisted/retrieved and associated with the correct authenticated user/Event.

### UX
The user receives clear state, success/error feedback, and a sensible next action.

### Error / Edge
Required-field, missing-data, persistence-failure, duplicate-action, and key route exceptions fail gracefully.

### P0 Release Gate
- Account/Profile works.
- P0 Golden Path works end-to-end.
- Safety routing does not fail open.
- User A cannot access User B health records.
- Closed Event and Summary snapshot rules are preserved.
- No P1/P2 dependency is required for P0 completion.

## 18. Open Items / Deferred Decisions

The following are intentionally deferred to later documents or future versions:

- Exact Supabase table/column/type/index/RLS definitions → `03_Database_Schema.md`
- Exact supported category/symptom content taxonomy and source library
- Exact Safety question/rule content
- Exact specialty/source mapping
- Detailed page/component/copy specification → `04_Screen_Spec.md`
- Lovable implementation sequence/prompts → `05_Lovable_Prompt_Library.md`
- P1 Connect implementation if P0 is complete
- P2 History/Experience Sharing/Wearables/Health Report prototype depth
- Post-MVP real AI, provider, telehealth, wearable, report-analysis integrations

---

# Glossary

| Technical Term | User-facing Copy | Definition |
|---|---|---|
| Health Event | 狀況追蹤 | One complete tracking cycle for a primary health concern |
| Primary Symptom | 主要不適 | Main symptom/concern anchoring a Health Event |
| Associated Symptom | 相關狀況 | Additional symptoms occurring with the main concern |
| Initial Record | 初始紀錄 | Information captured when the Health Event is created |
| Daily Track | 今日追蹤 | Maximum one tracking record per Event per calendar day |
| Life Context | 生活狀況 | Sleep, diet, activity, and stress context |
| Safety Check | Natural-language safety UI | Rule-based check that determines whether medical help should be prioritized |
| Guide | 改善方向 | Source-backed general information, possible factors, suggestions, and observation guidance |
| Act | — | Product Loop stage in which the user tries Guide suggestions |
| Reassess | 追蹤變化 | Record-based view of changes over the tracking period |
| Navigate | 就醫方向 | Navigation toward medical care or other professional support |
| Prepare | — | Product stage for preparing professional communication |
| Health Summary | 就醫摘要 / 諮詢摘要 | Snapshot of selected Event data prepared for communication |
| Connect | 預約／諮詢銜接 | P1 mock service-connection flow |
| Product Feedback | 使用者反饋 | Private product feedback requested after tracking closure |
