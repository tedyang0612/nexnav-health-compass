# NexNav MVP — Screen Specification

**Version:** v1.0  
**Status:** Locked for Day 3 MVP Development  
**Product:** NexNav  
**Development Mode:** AI Vibe Coding  
**Frontend:** Lovable  
**Backend:** Supabase  
**Scope:** P0 Golden Path; P1/P2 only as explicit boundaries  

## Source-of-Truth Priority

1. `01_Project_Vision.md v1.2`
2. `02_PRD.md v1.0`
3. `User_Flow.md v1.0`
4. `03_Database_Schema.md v1.0`
5. `ER_Diagram.md v1.0`

This document defines detailed screen responsibilities, routes, fields, interactions, states, responsive behavior, and user-facing terminology. It does not modify the locked database structure.

---

## 1. Product and UI Principles

1. NexNav is a health-recording and navigation tool, not a diagnostic service.
2. One Health Event is shown to users as one **狀況追蹤**.
3. The P0 Golden Path is:

   **Account/Profile → Record → Safety Check → Guide → Track → Reassess → Navigate → Prepare → Ready Summary**

4. Safety routing has higher priority than engagement, Guide, or Reassess Trend.
5. Each Event state emphasizes one Primary CTA.
6. Empty, Error, Loading, and Insufficient Data states must not be conflated.
7. Medical content, Safety questions, sources, and specialty mappings must come from approved Seed Content and must never be fabricated.
8. Internal technical terms remain in implementation documents but are translated into Chinese user-facing language.
9. P0 completes at Ready Summary and does not depend on Connect, appointments, Feedback, History, Community, Wearables, or Health Reports.

---

## 2. Screen and Route Inventory

### 2.1 Public Routes

| ID | Screen | Route | Priority |
|---|---|---|---:|
| S01 | Login | `/login` | P0 |
| S02 | Register | `/register` | P0 |

### 2.2 Account Setup and Global Routes

| ID | Screen | Route | Priority |
|---|---|---|---:|
| S03 | Onboarding | `/onboarding` | P0 |
| S04 | Dashboard | `/dashboard` | P0 |
| S05 | New Health Event | `/events/new` | P0 |
| S15 | Health Profile | `/profile` | P0 |

### 2.3 Event Routes

| ID | Screen | Route | Priority |
|---|---|---|---:|
| S06 | Safety Check / Recheck | `/events/:eventId/safety` | P0 |
| S07 | Event Detail | `/events/:eventId` | P0 |
| S08 | Edit Initial Record | `/events/:eventId/edit` | P0 |
| S09 | Guide | `/events/:eventId/guide` | P0 |
| S10 | Today Track | `/events/:eventId/track/today` | P0 |
| S11 | Reassess | `/events/:eventId/reassess` | P0 |
| S12 | Navigate | `/events/:eventId/navigate` | P0 |
| S13 | Summary Builder | `/events/:eventId/summary/new` | P0 |
| S14 | Summary Preview / Ready Summary | `/summaries/:summaryId` | P0 |

### 2.4 Non-page UI

| Type | Item | Priority |
|---|---|---:|
| Step | Onboarding Step 1 / Step 2 | P0 |
| Step | New Event three-step Wizard | P0 |
| Modal | Unsaved Changes Confirmation | P0 |
| Modal | Close Tracking Confirmation | P0 |
| Component | Trusted Source Disclosure | P0 |
| Component | Event Journey Navigation | P0 |
| Component | Safety Priority Banner | P0 |
| Component | Severity Slider | P0 |
| Component | Timeline | P0 |
| Modal / Sheet | Product Feedback | P1 |
| Page Flow | Mock Professional / Appointment | P1 |
| Page | Closed Event History | P2 |

---

## 3. Information Architecture and Navigation

### 3.1 Two-level architecture

- **Global level:** Authentication, Onboarding, Dashboard, New Event, Profile.
- **Event level:** Event Detail, Safety, Guide, Today Track, Reassess, Navigate, Summary.

Dashboard answers: **我目前有哪些狀況需要處理？**  
Event Detail answers: **這一個狀況目前如何，下一步是什麼？**

### 3.2 Desktop global navigation

- NexNav Logo → Dashboard
- 我的狀況 → Dashboard
- 新增狀況追蹤 → New Event
- Personal menu → 健康檔案 / 登出

### 3.3 Event Journey navigation

Desktop uses a horizontal menu; mobile uses a Dropdown/Menu:

1. 狀況總覽
2. 改善方向
3. 今日追蹤
4. 追蹤變化
5. 就醫與專業支持方向
6. 摘要

Safety Check is a workflow gate and is not included in ordinary Event navigation.

### 3.4 Route guards

| Condition | Required behavior |
|---|---|
| No authenticated session | Redirect to `/login` |
| Authenticated but onboarding incomplete | Redirect to `/onboarding` |
| Onboarding complete user enters `/onboarding` | Redirect to `/dashboard` |
| Unauthorized or nonexistent Event | Same secure Not Found state |
| Closed Event enters Today Track/Edit | Block action and return to Event Detail |
| Safety incomplete and user enters Guide | Redirect to Safety Check |
| Priority Care enters Guide | Return to Event Detail or Navigate |
| Reassess has insufficient data | Allow entry and show progress state |
| Zero Track enters Summary Builder | Allow Initial-only Summary |
| Ready Summary enters edit flow | Block edit; allow new draft from current data |

---

## 4. Screen Specifications

## S01 — Login

**Purpose:** Email/Password authentication for existing users.

### Fields

| Field | Required | Validation |
|---|---:|---|
| Email | Yes | Valid email format |
| Password | Yes | Non-empty |

### Actions

- Primary: `登入`
- Secondary: `還沒有帳號？建立帳號`
- Loading: `<登入中>` with spinner; disabled during submission.

### Behavior

- Invalid credentials use one generic message: `Email 或密碼不正確，請重新確認。`
- Success routes by `profiles.onboarding_completed`.
- P0 does not show third-party login buttons. Google Login remains outside the locked P0 UI even if technically available.

## S02 — Register

**Purpose:** Create an Email/Password account.

### Fields

| Field | Required | Validation |
|---|---:|---|
| Email | Yes | Valid email format |
| Password | Yes | Minimum 8 characters |
| Confirm Password | Yes | Must match Password |

### Actions and behavior

- Primary: `建立帳號`
- Loading: `<建立帳號中>` with spinner.
- Auth Trigger creates the Profile. Frontend must not insert a second Profile.
- Demo target: Email Confirmation disabled; successful registration enters Onboarding.
- P1/Release Readiness reminder: re-evaluate Email Verification before production use.

## S03 — Onboarding

**Type:** One route, two steps.

### Step 1 — 基本健康檔案

| Field | Required | Rule |
|---|---:|---|
| 顯示名稱 | Yes | Trimmed UI length 1–20; DB ceiling remains 50 |
| 出生年份 | Yes | Dynamic 18–70 UI range |
| 性別 | Yes | Male, female, non-binary, other, prefer not to say |

### Step 2 — 健康背景

- 慢性健康狀況
- 過敏資訊
- 目前用藥
- 其他健康背景

All fields are optional and the whole step may be skipped.

### Completion

- Save basic profile and background or `{}`.
- Set `onboarding_completed = true` and timestamp.
- Success → Dashboard.
- Failure preserves input and must not mark onboarding complete.

## S04 — Dashboard

**Purpose:** Show active Events and each Event's next action.

### Sections

- Global Header
- Welcome area
- `新增狀況追蹤`
- Active Event Cards
- Empty / Loading / Error states

### Event Card

- 主要不適症狀
- 開始日期
- 已追蹤天數
- 今日是否已追蹤
- Current Safety message
- One Primary next-step CTA

### Ordering

1. Priority Safety
2. Safety incomplete/failed
3. Today Track incomplete
4. Most recently updated

This is an operational order, not a disease-severity ranking.

### Layout

- Desktop: maximum two columns.
- Mobile: one column.
- Closed Events do not appear.

## S05 — New Health Event

**Type:** One route, three-step Wizard.

### Locked step names

1. **主要不適症狀**
2. **相關症狀與生活狀況**
3. **確認初始紀錄**

### Step 1 fields

| Field | Required | Rule |
|---|---:|---|
| Category | Yes | Approved active Seed Content only |
| 主要不適症狀 | Yes | 7 supported symptoms + Other |
| Other custom text | Conditional | 1–100 characters; no disease/specialty inference |
| 不適開始日期 | Yes | Defaults today; past/today allowed; future denied |
| 目前困擾程度 | Yes | 1–10 Severity Slider |
| 最近的發生頻率 | Yes | Shared 1–5 scale |
| Frequency description | No | Supplemental text |
| Duration value/unit | Yes | Positive value + supported unit |

`created_at` is system creation time. `started_on` stores the user-reported approximate condition start date and remains immutable after creation.

### Frequency scale

1. 過去7天約發生1次
2. 過去7天約發生2–3次
3. 過去7天約發生4–6次
4. 平均每天約發生1次
5. 平均每天2次以上，或幾乎持續出現

If the condition has lasted less than seven days, the user chooses the closest option based on current observation.

### Step 2 fields

- Associated Symptoms: optional multi-select/custom text.
- Sleep, diet, activity, and stress: all required.
- Supplemental Description: optional, maximum 1,000 characters.

Prompt:

> 關於症狀還有其他想補充嗎？例如，經常發生的時間、身體反應，或其他具體描述？

### Life Context options

#### 睡眠狀況

1. 睡得很差，明顯影響白天精神
2. 睡得不太好，比平常疲倦一點
3. 和平常差不多
4. 睡得還不錯，精神比平常好一些
5. 睡得很好，精神狀況很好

#### 飲食狀況

1. 很不規律，經常少吃一餐或用餐時間差很多
2. 有些不規律，偶爾少吃一餐或延後用餐
3. 和平常差不多
4. 大致規律，多數時間正常用餐
5. 很規律，三餐時間與份量都相對穩定

#### 活動狀況

1. 活動量比平常少很多
2. 活動量比平常少一些
3. 和平常差不多
4. 活動量比平常多一些
5. 活動量比平常多很多

#### 壓力感受

1. 目前沒有什麼壓力
2. 有一點壓力，但不太受影響
3. 有些壓力，偶爾會受影響
4. 壓力偏高，已明顯影響生活
5. 壓力非常高，經常感到難以負荷

### Step 3 and creation

- Read-only review with `返回修改` per section.
- Primary: `建立狀況追蹤`; Loading: `<建立中>`.
- Create Event + Initial Record atomically.
- Success → Safety route.
- Failure rolls back both and preserves form input.

## S06 — Safety Check / Recheck

**Purpose:** Use approved point-and-click questions and conservative rules to decide whether medical evaluation should be prioritized.

### User-facing copy status

- Initial page title: **TBD — Copy Review after Lovable adjacent screens are visible.**
- Temporary wording: `先確認目前狀況`.
- Recheck temporary wording: `再次確認目前狀況`.
- Internal term `Safety Check` is not shown to users.

### Structure

- Event Context Header
- Purpose explanation
- Short required questions
- Progress
- Submission
- Result and next CTA

Exact questions/rules require approved Seed Content.

### Results

| Internal result | User direction | Primary CTA |
|---|---|---|
| normal | May first view general improvement/observation direction | `查看改善方向` |
| attention | Improvement direction plus medical direction option | `查看改善方向` |
| priority_care | Prioritize medical evaluation | `查看就醫與專業支持方向` |

Priority Care Navigate must show Medical Care only.

### Failure

- Internal state: Safety Processing Failure.
- User title: `目前無法判斷下一步方向`.
- Explanation: the result could not be completed, so the Event is not treated as a general state.
- Primary: `重新嘗試`.
- Secondary: `先查看就醫方向`.
- Never fail open to Normal.
- Loading: `<狀況確認中>`; wording may change with final Safety page title.

## S07 — Event Detail

**User-facing name:** 狀況總覽.

### Sections

- Event Header
- Current Safety Banner
- One Next-Step Card
- Initial Record Summary
- Today Track Card
- Tracking Progress
- Timeline Preview
- Summary Status
- Close Tracking

### Primary CTA priority

| State | Primary CTA |
|---|---|
| Safety incomplete | Complete current-status questions |
| Safety failed | `重新嘗試` |
| Priority Care | `查看就醫與專業支持方向` |
| Normal/Attention without current Guide | `查看改善方向` |
| Guide current, no Today Track | `新增今日追蹤` |
| At least two Tracks | `查看追蹤變化` |
| Recorded severity increased | `查看就醫與專業支持方向` unless Safety overrides |

### Close Tracking

- Confirmation Modal required.
- `確認結束` sets status/closed timestamp and preserves all history.
- Closed Event cannot Track or edit Initial Record.
- Success → Dashboard.
- Product Feedback is not part of P0.

## S08 — Edit Initial Record

### Read-only fields

- Primary Symptom
- Other custom Primary Symptom
- Start Date

### Editable fields

- Severity
- Frequency and description
- Duration
- Associated Symptoms
- Life Context
- Supplemental Description

### Rules

- Update enabled only after actual change.
- Actual relevant change increments revision once.
- Old Safety/Guide/Track/Summary records remain.
- Success → Safety Recheck.
- Closed Event is read-only.

## S09 — Guide

**User-facing name:** 改善方向.

### Four required layers

1. Health Context Summary
2. General Health Information / Possible Factors
3. 2–3 Improvement Suggestions
4. Observation Guidance

### Rules

- Requires current valid Safety for the current revision.
- Trusted Sources use progressive disclosure.
- Act is not an independent page/task system.
- Suggestions are optional to try.
- Other/template-missing uses a safe fallback.
- Missing Seed Content must not be replaced with fabricated medical copy.

### Actions

- Primary: `新增今日追蹤`
- Secondary: `查看就醫與專業支持方向`
- Timeline wording: `已提供本次改善方向` or `改善方向已更新`; never `Guide 已建立`.

## S10 — Today Track

### Modes

- New today record
- View/update existing today record

### Fields

- Severity Slider
- 最近的發生頻率 using the same 1–5 scale
- Subjective Change
- Four required Life Context inputs
- Suggestion Execution, when a valid Guide exists
- Optional Notes, maximum 1,000 characters

Subjective Change options:

- 好很多
- 好一些
- 沒有明顯變化
- 差一些
- 差很多

### Rules

- Asia/Taipei determines today; user cannot select Track date.
- One row per Event/day; repeat saves update the same row.
- Today is editable; history is read-only.
- Suggestion execution may be all unchecked.
- Priority Care can Track without Guide.
- Recheck trigger is user-visible and never silently invents a result.

## S11 — Reassess

**User-facing name:** 追蹤變化.

### Eligibility

- Initial Record + at least two Daily Tracks.
- Before eligibility, show progress and remaining required Track count.

### P0 content

- Safety Banner first
- Recorded Trend
- Baseline → Current Severity
- Frequency Change
- Latest Subjective Change separately
- Tracking duration/count
- Timeline
- Medical boundary statement

### Trend wording

| Delta | User-facing wording |
|---:|---|
| ≤ -2 | 紀錄顯示困擾程度下降 |
| -1 to +1 | 紀錄顯示變化不明顯 |
| ≥ +2 | 紀錄顯示困擾程度上升 |

This is a record comparison, not a clinical result. P0 does not create a composite health score. Enhanced charts remain P1.

### Timeline

- Newest record always appears at the top.
- Use Chinese user-facing event names.
- Do not expose Guide versions, revisions, table names, or internal logs.

## S12 — Navigate

**User-facing name:** 就醫與專業支持方向.

### Structure

1. Event Context
2. Direction First
3. Medical Care
4. Other Professional Support, when allowed
5. Mock Professional Cards, optional and secondary
6. Trusted Sources

### Rules

- Priority Care shows Medical Care only.
- Direction precedes professional cards.
- Other/missing mapping uses general medical-evaluation fallback.
- Associated Symptoms add context only.
- Medication content never advises cessation or dosage changes.
- Mock Professionals must be labeled `示範資料`.
- No Provider table or true availability is implied.

### Actions

- Medical: `產生就醫摘要`
- Professional Support: `產生諮詢摘要`
- Secondary: `繼續追蹤`

## S13 — Summary Builder

**User-facing name:** 建立健康摘要.

### Summary types

- 就醫摘要
- 諮詢摘要

### System-generated core content

- Main condition
- Start date and Initial Record
- Latest valid tracking comparison or insufficient-data wording
- Associated Symptoms and supplemental description
- Life Context
- Actions tried without effectiveness claims
- Current Safety context
- Non-diagnostic disclaimer

Source data cannot be edited inside Summary.

### User-controlled inclusion

- Health Background categories, default unchecked
- Daily Track Notes, default unchecked
- 0–3 questions for the professional

### Actions

- Primary: `產生摘要預覽`; Loading: `<產生摘要中>`.
- Success creates/updates the one draft for Event/type and enters Preview.
- Generation failure leaves no incomplete draft and preserves selections.

## S14 — Summary Preview / Ready Summary

### Draft Preview

Show the complete Snapshot and ask:

> **這份摘要是否正確？**

Actions:

- Primary: `確認正確`; Loading: `<確認中>`.
- Secondary: `調整摘要內容`.
- Link: `返回修改原始紀錄`.

Adjustment changes inclusion/questions. Source correction occurs at the source screen.

### Ready Summary

- Confirmation changes draft → ready and stores confirmation time.
- Ready content is immutable and cannot be deleted in P0.
- No extra blocking Modal is required before confirmation.
- Later source changes do not mutate Ready content.
- Not-latest message: `這份摘要不是依最新紀錄產生，原內容仍會保留。`
- CTA: `依最新紀錄產生新摘要`.

P0 excludes PDF export, public links, email sending, and centralized Summary History.

## S15 — Health Profile

**User-facing name:** 健康檔案.

### Fields

- Display Name: required, trimmed 1–20 UI characters
- Birth Year: required
- Gender: required
- Chronic conditions: optional
- Allergies: optional
- Medications: optional
- Other health background: optional

### Rules

- Update the existing Profile; never insert a duplicate.
- Save enabled only after actual change.
- Ready Summaries never update when Profile changes.
- P0 excludes Email/Password changes, account deletion, notification settings, and provider management.
- Email Verification is a P1/Release Readiness item.

---

## 5. Shared Components

### 5.1 Severity Slider

Used consistently in Initial Record, Edit Initial Record, and Today Track.

- Label: `目前困擾程度（1–10）`
- Selected track: NexNav primary color
- Unselected track: neutral light color
- Thumb: solid primary color, not white
- Live value: e.g. `4／10`
- No dynamic severity badge
- Anchors only:
  - `1｜幾乎不影響日常`
  - `5｜已有明顯影響`
  - `10｜嚴重影響日常`
- High Severity must not automatically use Safety warning red.

### 5.2 Life Context

The exact same four categories and five-point option wording are reused in creation, edit, and Daily Track.

### 5.3 Timeline

- Newest first.
- Date + Chinese event title + concise evidence-backed detail.
- Derived from stored Event history; no separate Timeline table.

### 5.4 Primary CTA

- One emphasized Primary CTA per state.
- At most one Secondary CTA in the main Next-Step area.
- Safety state overrides Trend and engagement prompts.

---

## 6. UI States and Error Handling

### 6.1 State types

- Loading
- Empty
- Success
- Validation Error
- Recoverable Error
- Blocking Error
- Warning
- Informational

### 6.2 Loading

- Page loads use layout-specific Skeletons.
- Submission reuses the original button position, shows Spinner, becomes disabled, and prevents duplicate submission.
- Literal visible Loading strings include angle brackets:

| Operation | Visible text |
|---|---|
| Login | `<登入中>` |
| Register | `<建立帳號中>` |
| Save | `<儲存中>` |
| Create Event | `<建立中>` |
| Safety | `<狀況確認中>` |
| Generate Summary | `<產生摘要中>` |
| Confirm Summary | `<確認中>` |

Lovable/HTML implementation must escape angle brackets so they render as visible characters.

### 6.3 Empty versus Error

- Empty means a successful read with no records.
- Error means data could not be loaded.
- Error must never be rendered as an Empty State.

### 6.4 Validation

- Validate on field blur and again on submission.
- Focus the first invalid field.
- Remove error promptly after correction.
- Do not rely on border color alone.

Core messages:

- `請完成此欄位`
- `請輸入有效的 Email`
- `密碼至少需要8個字元`
- `兩次輸入的密碼不一致`
- `顯示名稱最多20個字元`
- `請輸入主要不適症狀`
- `請選擇目前困擾程度`
- `請選擇最近的發生頻率`
- `請完成四項生活狀況`
- `開始日期不能晚於今天`
- `最多可填寫3個問題`

### 6.5 Unsaved changes

Applicable to Onboarding, New Event, Edit Record, Today Track, Summary Builder, and Profile.

- Title: `尚未儲存變更`
- Primary: `繼續編輯`
- Secondary: `放棄變更並離開`
- Show only after actual change.

### 6.6 Network/persistence failure

- Preserve form input.
- Never expose SQL, RLS, Supabase, keys, IDs, or technical traces.
- Provide Retry.
- Duplicate Today Track safely updates the same row.
- Event + Initial Record creation remains atomic.

### 6.7 Authentication and ownership

- Session expired: `登入狀態已失效，請重新登入。`
- After login, return to the original legal route when safe.
- Unauthorized/nonexistent Event: `找不到這筆狀況追蹤，或你沒有權限查看。`
- Do not reveal whether another user owns the ID.

### 6.8 Safety fail-safe

- Unanswered required questions block submission.
- Processing failure never produces Normal.
- User title: `目前無法判斷下一步方向`.
- Retry + medical-direction option.
- If Safety needs recheck, old Guide is not presented as current.

### 6.9 Reassess insufficient data

This is Informational, not Error:

- Title: `還需要更多追蹤紀錄`
- Show current count and remaining count.
- CTA: `新增今日追蹤`.

### 6.10 Summary freshness

- Ready Summary remains stable.
- Not-latest status is Informational.
- Generate a new Summary instead of changing the old one.

---

## 7. Responsive and Accessibility Specification

### 7.1 Responsive levels

- Mobile
- Tablet
- Desktop

Exact pixel breakpoints may follow the Lovable design system, but layout behavior is locked.

### 7.2 Layout rules

- Desktop Dashboard: maximum two columns.
- Mobile Dashboard: one column.
- Forms are primarily single-column.
- Related short controls such as Duration value/unit may share a row on wider screens.
- Mobile Primary CTA is generally full-width.
- No global Bottom Navigation in P0.
- Mobile Modals may become Bottom Sheets.

### 7.3 Accessibility

- Minimum touch target approximately 44×44 px.
- Visible labels for every form control.
- Keyboard-operable Slider, Dropdown, Checkbox, and Radio.
- Do not remove Focus State.
- Error text is programmatically associated with its field.
- Color is always paired with text and/or icon.
- Severity and Trend colors must not impersonate Safety results.

---

## 8. User-facing Terminology

| Internal term | User-facing term |
|---|---|
| Health Event | 狀況追蹤 |
| Primary Symptom | 主要不適症狀 |
| Associated Symptoms | 相關症狀 |
| Initial Record | 初始紀錄 |
| Safety Check | TBD; temporary `先確認目前狀況` |
| Safety Recheck | Temporary `再次確認目前狀況` |
| Guide | 改善方向 |
| Daily Track | 今日追蹤 |
| Reassess | 追蹤變化 |
| Navigate | 就醫與專業支持方向 |
| Health Summary | 就醫摘要 / 諮詢摘要 |
| Priority Care | 建議優先尋求醫療評估 |

Decorative copy, spacing, typography, and minor tone may be refined in Lovable. Any copy change that alters data meaning, Safety routing, action results, or medical boundaries requires specification review.

---

## 9. Database and Screen Mapping

| Screen capability | Database support |
|---|---|
| Auth / registration | Supabase Auth |
| Onboarding / Profile | `profiles` |
| Symptom selection | `symptom_catalog` |
| Event lifecycle | `health_events` |
| Initial Record | `initial_records` |
| Safety Check/Recheck | `safety_assessments` |
| Guide | `guides` |
| Today Track | `daily_tracks` |
| Navigate | `navigation_templates` |
| Summary | `health_summaries` |
| Reassess / Timeline / Current Safety / Current Guide | Derived, not new tables |

No new P0 table is required by this Screen Specification.

---

## 10. P1 / P2 Boundaries

### P1 / Release Readiness

- Re-evaluate Email Verification.
- Third-party login UI, including Google, remains outside locked P0 UI.
- Enhanced Trend charts.
- Summary export/history enhancements.
- Connect / Mock Professional Detail / Mock Appointment.
- Product Feedback after Event closure.
- 14-day inactivity reminder.

### P2

- Closed Event History UI.
- Experience Sharing mock prototype.
- Wearable-device prototype.
- Health-report upload prototype.

No P1/P2 screen is required for P0 completion.

---

## 11. Final Consistency Audit

### 11.1 Confirmed alignment

| Rule | Screen treatment |
|---|---|
| Onboarding gate | Protected routes require completed Profile |
| Multiple active Events | Dashboard supports independent Event Cards |
| One Primary Symptom | New Event locks one Primary Symptom |
| Other safe fallback | No cause/specialty inference |
| Primary/start date immutable | Edit screen renders them read-only |
| Safety mandatory/fail-safe | Route gate; failure never Normal |
| Guide has four layers | S09 implements all four |
| Act is not a module | No Act route/table |
| One Track per Event/day | Same route supports create/update today |
| Today editable/history read-only | S10 and lifecycle errors enforce this |
| Reassess needs two Tracks | Informational progress before eligibility |
| Safety overrides Trend | Banner/CTA priority across Event/Reassess |
| Navigate direction first | S12 direction precedes Mock Professionals |
| Prepare can use zero Tracks | Initial-only Summary supported |
| Ready Summary immutable | S14 has no edit/delete action |
| Event close preserves data | Confirmation changes status only |
| History UI deferred | Closed Events absent from P0 Dashboard |

### 11.2 Resolved interpretations

1. `started_on` is shown as the user-reported approximate condition start date; `created_at` remains the technical Event creation time. This requires no new column or migration.
2. UI Display Name uses a stricter 20-character limit while the database retains its 50-character ceiling. This requires no Schema change.
3. Google/third-party login is not shown in the locked P0 screen even if the underlying Supabase capability exists.
4. Safety user-facing page title remains a Lovable Copy Review item; internal route, result states, database behavior, and fail-safe logic are locked.
5. Loading angle brackets are intentional literal UI characters and must be escaped during implementation.

### 11.3 Remaining non-blocking dependencies

- Exact 5-category / 7-symptom taxonomy and associated symptom options.
- Exact Safety questions and medically reviewed rules.
- Exact Guide content, suggestions, and trustworthy sources.
- Exact Navigate mappings and trustworthy sources.
- Final Safety page title after adjacent Lovable screens are visible.
- Purely decorative copy and visual polish.

These dependencies do not require a database redesign, but approved Seed Content is required before the health-information Golden Path can be considered complete.

---

## 12. Screen Specification Definition of Done

The Day 3 specification is complete when:

1. All P0 screens have routes, purposes, entry conditions, components, actions, and completion behavior.
2. Protected-route, ownership, closed-state, and Safety gates are explicit.
3. Every write has Loading, Success, Validation, and Failure behavior.
4. Empty and Error states are distinct.
5. Safety failure cannot produce Normal routing.
6. Today Track uniqueness/editability and historical read-only behavior are reflected in UI.
7. Reassess insufficient-data and Ready Summary immutability are represented.
8. Mobile and Desktop navigation behavior is defined.
9. User-facing terminology avoids internal technical names.
10. P0 has no dependency on P1/P2 features.
11. Screen fields map to the nine-table P0 Schema without a new table.
12. Remaining Seed Content and Lovable Copy Review dependencies are clearly labeled.

---

**Day 3 — UI / Screen Specification: CLOSED**  
**Next:** `05_Lovable_Prompt_Library.md` and modular Lovable implementation.
