# NexNav MVP — Lovable Prompt Library

**Version:** v0.4  
**Status:** Day 7 Sync through P11  
**Product:** NexNav  
**Target:** Lovable + existing Supabase project  
**Scope:** P0 Golden Path only  
**Companion specification:** `04_Screen_Spec.md v1.0`

## 1. Purpose

This library converts the locked NexNav screen specification into small, sequential prompts that can be pasted into Lovable. It is designed for incremental implementation and review; it is not permission to rebuild the project, change the database, or invent health content.

The recommended workflow is:

1. Paste **P00 — Project Preflight** first.
2. Review Lovable's audit report before allowing implementation.
3. Run P01–P14 one prompt at a time, in order.
4. Preview and verify each module before continuing.
5. If Lovable reports a blocker, resolve it explicitly; do not ask it to guess.

## 2. Source-of-Truth Priority

When documents conflict, follow this order:

1. `01_Project_Vision.md v1.2`
2. `02_PRD.md v1.0`
3. `User_Flow.md v1.0`
4. `03_Database_Schema.md v1.0`
5. `ER_Diagram.md v1.0`
6. `04_Screen_Spec.md v1.0` for locked screen-level interpretation and UI behavior

If a prompt conflicts with a higher-priority source, stop and report the conflict before editing.

## 3. Global Guardrails

These rules apply to every prompt in this library:

- Inspect the current code before editing. Extend the existing Lovable application; do not recreate it.
- Preserve the connected NexNav Supabase project, current environment configuration, Auth integration, and working routes.
- Do not create, drop, rename, or alter database tables, columns, enums, constraints, indexes, triggers, RLS policies, functions, RPCs, migrations, or Seed Content.
- Do not insert a Profile during registration; the tested Auth Trigger already creates it.
- Never use or expose a Supabase service-role key in the frontend.
- Use the authenticated Supabase client and existing RLS. Do not bypass ownership checks.
- Do not fabricate medical questions, Safety rules, Guide content, sources, specialties, provider availability, or navigation mappings.
- If approved Seed Content, an expected database capability, or an RPC is absent, build only a clearly identified non-medical shell where allowed, then report the blocker. Do not change the database to unblock yourself.
- Do not hardcode private user records. Empty-state/demo layout may use non-medical placeholders only when clearly isolated from persistence.
- Keep P1 and P2 features out of P0. Do not add Google Login UI, appointment booking, PDF export, sharing, feedback, closed-event history, community, wearables, or health-report upload.
- Keep user-facing language in Traditional Chinese. Do not expose internal terms, table names, UUIDs, SQL, RLS, stack traces, or Supabase error details.
- Preserve form input after recoverable failures and prevent duplicate submissions.
- Keep existing unrelated files and behavior intact.
- After each prompt: preview, test the listed acceptance criteria, and report changed files, routes, data calls, tests performed, and unresolved blockers.

## 4. Shared Completion Report

Every implementation prompt asks Lovable to finish with this report:

```text
完成後請回報：
1. 本次完成項目
2. 修改或新增的檔案
3. 影響的 routes
4. 使用的 Supabase tables／views／RPCs（只列名稱，不顯示敏感資訊）
5. 已實測的成功、Loading、Empty、Error 與權限情境
6. 尚未完成或被阻擋的項目與原因
7. 是否發現規格衝突、缺少 Seed Content 或缺少既有 DB capability
未經確認不要接著實作下一個 Prompt。
```

---

## P00 — Project Preflight and No-Destruction Audit

**Goal:** Establish the actual current state before any UI implementation.  
**Mutations:** None; audit only.

```text
請先對現有 NexNav 專案進行唯讀 Preflight Audit，不要修改任何檔案、Lovable 設定或 Supabase 資料庫。

Source of Truth 優先順序：
1. 01_Project_Vision.md v1.2
2. 02_PRD.md v1.0
3. User_Flow.md v1.0
4. 03_Database_Schema.md v1.0
5. ER_Diagram.md v1.0
6. 04_Screen_Spec.md v1.0（畫面層的鎖定解讀）

已知 Day 2 現況：
- Supabase Database 已部署，9 張 P0 核心表、Constraints、Indexes、RLS Policies 已完成。
- Auth User 建立時自動建立 Profile 的 Trigger 已實測成功。
- Email／Password 登入已實測成功。
- 未完成 Onboarding 的使用者登入後會導向 /onboarding。
- 已有 /login、/register、/onboarding、/dashboard placeholder routes。
- Lovable 已連接既有 NexNav Supabase。
- Google 登入為 P1，P0 不顯示。
- Seed Content 尚未載入，不得編造醫療內容或來源。

請檢查並回報：
1. 現有 routes、route guards、layout、components、forms 與 Supabase client 結構。
2. Auth session 與 profiles.onboarding_completed 的目前實作。
3. 現有 Database types、9 張 P0 tables，以及前端目前實際可呼叫的 views／functions／RPCs；只做查核，不修改。
4. 現有設計系統、色彩、字型、spacing、breakpoints、元件庫與 responsive 狀態。
5. placeholder route 中哪些可延伸、哪些功能尚未存在。
6. 與 04_Screen_Spec.md 的差距，依 P01–P14 模組分類。
7. 任何可能造成資料不一致的現況，例如前端重複建立 Profile、繞過 RLS、hardcoded user data 或非原子 Event 建立。

禁止事項：
- 不要建立或修改 migration。
- 不要建立、刪除或修改任何資料庫物件或 Seed Content。
- 不要重新連接或替換 Supabase project。
- 不要重做已可運作的 Auth。
- 不要開始實作畫面。

輸出一份具體 audit report，並列出建議執行順序、依賴與 blocker。完成後停止，等我確認。
```

**Acceptance:** No code/database changes; report distinguishes confirmed facts from assumptions.

---

## P01 — App Shell, Design Foundation, and Navigation

**Goal:** Establish reusable P0 layout and navigation without building feature screens.

```text
請在現有 NexNav 專案上建立 P0 App Shell、共用版型與導覽基礎。先閱讀並遵守 04_Screen_Spec.md；不要重建專案，也不要修改 Supabase schema。

實作範圍：
- Public Layout：/login、/register。
- Protected Global Layout：/onboarding、/dashboard、/profile、/events/new。
- Protected Event Layout：/events/:eventId 及其子流程 routes。
- Desktop global navigation：NexNav Logo→/dashboard、我的狀況→/dashboard、新增狀況追蹤→/events/new、個人選單→健康檔案／登出。
- Mobile 不建立 global bottom navigation；使用清楚的 header/menu。
- Event Journey：Desktop 使用水平選單；Mobile 使用 Dropdown/Menu，項目依序為：狀況總覽、改善方向、今日追蹤、追蹤變化、就醫與專業支持方向、摘要。
- Safety 是 workflow gate，不放入一般 Event Journey。
- 建立共用 Page Container、Page Header、Section/Card、Primary CTA、Status Banner、Skeleton、Empty State、Error State、Form Field、Modal/Bottom Sheet 外框。

視覺原則：
- 健康資訊工具感受要平靜、清楚、可信任，不做診斷式或警報式視覺。
- Desktop Dashboard 未來最多兩欄；Mobile 一欄。
- 表單以單欄為主。
- Mobile 主要 CTA 通常滿寬。
- touch target 約 44×44 px；保留 focus state；不能只靠顏色表達狀態。
- 不要因 severity 高就自動使用紅色；Safety 狀態與困擾程度必須視覺上分開。

只建立導覽與共用基礎，不要填造醫療內容、Safety 題目、Guide 或 Navigate 資料。保留現有可運作功能。

請完成 responsive preview，至少檢查 Mobile、Tablet、Desktop。最後使用「Shared Completion Report」格式回報並停止。
```

**Acceptance:** Correct two-level IA; no bottom nav; Event Journey works responsively; no feature data invented.

---

## P02 — Authentication UI Verification and Polish

**Goal:** Polish existing Login/Register while preserving tested Auth behavior.

```text
請延伸現有 /login 與 /register，不要重做 Supabase Auth，也不要建立新的 Profile insert。

/login：
- Email 必填且格式有效。
- Password 必填。
- Primary：登入。
- Loading 按鈕必須實際顯示包含角括號的「<登入中>」並加 spinner；提交時 disabled，防止重複送出。HTML/JSX 必須正確 escape，不能讓角括號消失。
- 登入失敗統一顯示：Email 或密碼不正確，請重新確認。
- 成功後依 profiles.onboarding_completed 導向 /onboarding 或 /dashboard。
- Secondary：還沒有帳號？建立帳號。

/register：
- Email 必填且格式有效。
- Password 至少 8 個字元。
- Confirm Password 必須一致。
- Primary：建立帳號。
- Loading 顯示「<建立帳號中>」與 spinner，正確 escape、disabled。
- 使用既有 Auth sign-up；Profile 由既有 Trigger 建立，前端禁止額外 insert profiles。
- Demo 目前以 Email Confirmation disabled 為目標：成功後建立 session 並到 /onboarding。若實際 Supabase 設定不同，不要改設定；顯示差異並回報 blocker。
- 不顯示 Google 或其他第三方登入。

共通：
- field blur 與 submit 時驗證；錯誤訊息與欄位程式化關聯；修正後即時移除。
- 不顯示 Supabase 原始錯誤。
- 保留現有 session、redirect 與 route guard 行為。

測試：正確登入、錯誤帳密、格式錯誤、密碼不一致、重複提交、已完成與未完成 onboarding 的導向。最後依 Shared Completion Report 回報並停止。
```

**Acceptance:** Existing Auth remains intact; Trigger is not duplicated; literal angle brackets render.

---

## P03 — Onboarding and Health Profile

**Goal:** Implement account setup and later profile editing against the existing `profiles` row.

```text
請實作 /onboarding 與 /profile，使用既有 profiles 資料列；禁止 insert 第二筆 Profile，禁止修改 schema。

/onboarding 是單一路由兩步驟：
Step 1「基本健康檔案」：
- 顯示名稱：必填，trim 後 UI 1–20 字元；DB 上限仍為 50，不修改 DB constraint。
- 出生年份：必填，依當年動態提供 18–70 歲範圍。
- 性別：必填；選項 male、female、non-binary、other、prefer not to say，以合適繁中顯示。

Step 2「健康背景」：
- 慢性健康狀況、過敏資訊、目前用藥、其他健康背景。
- 全部 optional，整步可略過；略過時依既有 schema 儲存空物件或既有合法空值。

完成規則：
- 更新既有 Profile 與 health background。
- 成功後才設定 onboarding_completed=true 與既有 timestamp 欄位，然後到 /dashboard。
- 任一寫入失敗時保留輸入，不得標示 onboarding 完成。
- 完整處理 Loading「<儲存中>」、Validation、Error、Unsaved Changes。

/profile「健康檔案」：
- 載入並更新同一組欄位。
- 只有實際變更後才能儲存。
- Profile 更新不得回寫或改變任何已 Ready Summary。
- P0 不做 Email/Password 修改、刪除帳號、通知設定或 provider 管理。

Route behavior：
- 未登入→/login。
- 已登入但 onboarding 未完成，受保護 route→/onboarding。
- 已完成者進 /onboarding→/dashboard。

測試成功、略過背景、驗證失敗、寫入失敗、離頁未儲存、直接輸入 routes。最後依 Shared Completion Report 回報並停止。
```

**Acceptance:** One Profile per Auth user; completion flag is written only after valid save.

---

## P04 — Dashboard and Active Event Cards

**Goal:** Turn `/dashboard` into the operational home for active events.

```text
請實作 /dashboard，讀取目前登入使用者可見的 active health_events 與畫面所需的既有關聯資料，完全依 RLS；不要新增 view、RPC、table 或 hardcoded private records。

畫面：
- Global Header、歡迎區、Primary「新增狀況追蹤」→/events/new。
- Active Event Cards：主要不適症狀、開始日期、已追蹤天數、今日是否已追蹤、目前 Safety 訊息、唯一 Primary next-step CTA。
- Desktop 最多兩欄；Mobile 一欄。
- Closed Events 不顯示，P0 不建立 History 頁。

排序優先順序：
1. Priority Safety
2. Safety incomplete／failed
3. 今日尚未追蹤
4. 最近更新
請將它呈現為操作優先順序，不能暗示疾病嚴重度排序。

每張卡只突出一個 next-step CTA，依 Event 狀態導向 Safety、Navigate、Guide、Today Track、Reassess 或 Event Detail。Safety 永遠優先於 Guide／Trend。

狀態：
- Loading：卡片 Skeleton。
- Empty：明確說目前尚無狀況追蹤，提供新增 CTA。
- Error：顯示載入失敗與 Retry，不能假裝成 Empty。
- Unauthorized data 不可出現在 UI。

若目前 query 無法安全且有效取得卡片所需 derived state，先回報缺少的既有 DB capability；禁止自行新增 DB 物件。最後依 Shared Completion Report 回報並停止。
```

**Acceptance:** Active-only, correctly prioritized, one CTA/card, distinct Loading/Empty/Error.

---

## P05 — New Health Event Three-step Wizard

**Goal:** Implement the complete initial-record flow without inventing taxonomy.

```text
請實作 /events/new 為「單頁三步驟 Wizard」，步驟名稱固定：
1. 主要不適症狀
2. 相關症狀與生活狀況
3. 確認初始紀錄

Step 1：
- Category 必填，只能來自 approved active Seed Content。
- 主要不適症狀必填，只能來自 approved Seed Content；Other 時顯示 1–100 字元自訂文字，不能據此推論疾病或科別。
- 不適開始日期必填，預設今天，可選過去或今天，不可未來。這是 started_on，不是 created_at；建立後不可修改。
- 目前困擾程度必填，使用共用 1–10 Slider。
- 最近的發生頻率必填，選項固定：過去7天約發生1次／過去7天約發生2–3次／過去7天約發生4–6次／平均每天約發生1次／平均每天2次以上，或幾乎持續出現。
- Frequency description optional。
- Duration value/unit 必填，value 必須為正數並使用 schema 支援單位。

Step 2：
- 相關症狀 optional multi-select/custom text；只使用 approved Seed Content。
- 睡眠、飲食、活動、壓力四項五段式皆必填，完整文案必須取自 04_Screen_Spec.md，不得改變意義。
- 補充描述 optional，最多 1,000 字元。
- Prompt：關於症狀還有其他想補充嗎？例如，經常發生的時間、身體反應，或其他具體描述？

Step 3：
- 唯讀確認所有輸入，每區可「返回修改」。
- Primary「建立狀況追蹤」；Loading 必須顯示含角括號的「<建立中>」與 spinner。
- Event + Initial Record 必須以現有原子 DB capability 建立；成功→/events/:eventId/safety。
- 失敗必須讓兩者都不成立並保留表單。

Severity Slider 共用規格：
- 已拖曳區段使用 primary color；未拖曳區段 neutral。
- thumb 使用實心 primary color，不可白色。
- 即時顯示例如「4／10」。
- 只顯示三個錨點：1分（輕微）、5分（干擾日常）、10分（難以忍受）。
- 不顯示額外程度 badge；高分不自動變紅；可鍵盤操作。

Seed Content 尚未載入時：顯示不誤導的 unavailable 狀態並阻止建立，回報 blocker；禁止自行建立症狀、分類或醫療選項。

處理 validation、unsaved changes、responsive、focus first invalid field。最後依 Shared Completion Report 回報並停止。
```

**Acceptance:** Exact 3-step flow; correct slider; immutable start date; atomic creation; no invented taxonomy.

---

## P06 — Safety Check and Fail-safe Shell

**Goal:** Implement routing, states, and approved-content rendering without fabricating medical logic.

```text
請實作 /events/:eventId/safety 的 P0 Safety workflow。內部可稱 Safety Check，但使用者介面不得顯示英文術語。

文案狀態：
- 初次頁面暫用「先確認目前狀況」。
- Recheck 暫用「再次確認目前狀況」。
- 這兩個標題仍是 Lovable 鄰接畫面完成後的 Copy Review 項目；先集中成可替換的 UI copy constant，不改變流程。

畫面結構：Event Context Header、目的說明、approved required questions、進度、提交、結果與下一步。

重要限制：
- 題目、選項、評估規則與醫療結果只能讀取已核准 Seed Content／既有 DB capability。
- Seed Content 或處理能力缺少時，只能完成 UI shell、Loading、Unavailable 與 Error 狀態；不得編造題目、答案或結果。
- 未回答 required questions 不可提交。
- Loading 顯示含角括號的「<狀況確認中>」。
- processing failure 絕不可視為 normal，也不可導向一般改善方向。

結果 routing：
- normal：可先看一般改善／觀察方向，Primary「查看改善方向」。
- attention：改善方向加就醫方向選項，Primary「查看改善方向」。
- priority_care：優先醫療評估，Primary「查看就醫與專業支持方向」；Navigate 只顯示 Medical Care。

Failure：
- 標題「目前無法判斷下一步方向」。
- 說明本次結果未完成，因此不會把狀況視為一般狀態。
- Primary「重新嘗試」。
- Secondary「先查看就醫方向」。
- 不顯示技術錯誤。

保護 unauthorized/nonexistent Event 使用同一安全 Not Found。若初始紀錄 revision 改變，舊 Safety 不可當成 current。最後依 Shared Completion Report 回報並停止。
```

**Acceptance:** Fail-safe behavior; no fabricated assessment; normal is never a failure default.

---

## P07 — Event Detail, Edit Initial Record, and Close Tracking

**Goal:** Build the event control center and safe lifecycle actions.

```text
請實作：
- /events/:eventId（使用者名稱「狀況總覽」）
- /events/:eventId/edit
- Close Tracking confirmation

Event Detail sections：Event Header、Current Safety Banner、唯一 Next-Step Card、Initial Record Summary、Today Track Card、Tracking Progress、Timeline Preview、Summary Status、Close Tracking。

Primary CTA 優先順序：
1. Safety incomplete→完成目前狀況問題。
2. Safety failed→重新嘗試。
3. Priority Care→查看就醫與專業支持方向。
4. Normal/Attention 且沒有 current Guide→查看改善方向。
5. Guide current 且今天未追蹤→新增今日追蹤。
6. 至少兩筆 Track→查看追蹤變化。
7. 紀錄 severity 上升→查看就醫與專業支持方向，除非 Safety 有更高優先規則。

Edit Initial Record：
- 唯讀：主要不適症狀、Other 自訂主要症狀、不適開始日期。
- 可編輯：severity、frequency/description、duration、associated symptoms、四項 life context、supplemental description。
- 只有實際變更才可更新；依既有 schema/capability 將 relevant revision 增加一次。
- 不刪除舊 Safety、Guide、Track、Summary。
- 成功→/events/:eventId/safety 進行 Recheck。
- Loading「<儲存中>」；失敗保留輸入。

Close Tracking：
- 必須用 confirmation Modal／Mobile Bottom Sheet。
- 「確認結束」只更新既有 status/closed timestamp，保留完整歷史。
- 成功→/dashboard。
- Closed Event 不可再 Today Track 或編輯 Initial Record；P0 不顯示 Product Feedback。

Timeline preview 最新在最上方，使用中文事件名稱，不顯示 revision、Guide version、table name 或 internal log。最後依 Shared Completion Report 回報並停止。
```

**Acceptance:** One prioritized CTA; immutable fields enforced; close preserves history; closed writes blocked.

---

## P08 — Guide / 改善方向

**Goal:** Render approved Guide content and safe fallback behavior.

```text
請實作 /events/:eventId/guide，使用者頁面名稱固定為「改善方向」。

進入條件：current initial revision 必須有 current valid Safety。Safety 未完成→Safety route；Priority Care→Event Detail 或 Navigate，不顯示一般 Guide。

頁面四層：
1. Health Context Summary
2. General Health Information／Possible Factors
3. 2–3 Improvement Suggestions
4. Observation Guidance

醫療內容與來源只能來自 approved Seed Content。Trusted Sources 使用 progressive disclosure。若 Seed Content/template 缺少，只能顯示安全 fallback/unavailable 狀態並回報；不得自行生成可能因素、建議或來源。

UI 規則：
- 使用者看到「改善方向」，不看到 Guide。
- 建議是可選擇嘗試，不暗示療效或診斷。
- Act 不是獨立頁面或 task system，不建立 Act route/table。
- Primary「新增今日追蹤」。
- Secondary「查看就醫與專業支持方向」。
- Timeline 文字用「已提供本次改善方向」或「改善方向已更新」，不可顯示「Guide 已建立」。

處理 current/stale Guide、Loading、Unavailable、Error 與 responsive。禁止修改 DB 或補 Seed Content。最後依 Shared Completion Report 回報並停止。
```

**Acceptance:** Four layers; valid-Safety gate; approved content only; internal word Guide hidden.

---

## P09 — Today Track

**Goal:** Create/update one Asia/Taipei daily record per event/day.

```text
請實作 /events/:eventId/track/today，支援：今天尚無紀錄時新增；今天已有紀錄時載入並更新同一筆。

欄位：
- 共用 Severity Slider（完全沿用 P05 視覺與 accessibility）。
- 最近的發生頻率（完全沿用同一組 1–5 文案）。
- Subjective Change：好很多／好一些／沒有明顯變化／差一些／差很多。
- 睡眠、飲食、活動、壓力四項 required，沿用相同五段式文案。
- current valid Guide 存在時顯示 Suggestion Execution；允許全部未勾選。
- Notes optional，最多 1,000 字元。

規則：
- today 由 Asia/Taipei 決定，使用者不能選 Track 日期。
- 依既有 unique constraint／upsert-safe capability 確保每 Event/日期一筆；重複送出不能新增第二筆。
- 今天可編輯；歷史只讀。
- Priority Care 即使沒有 Guide 仍可 Track。
- 若觸發 Recheck，必須清楚告知使用者並導向 Safety；不可在背景自行捏造 Safety 結果。
- Closed Event 阻止寫入並回 Event Detail。
- Loading「<儲存中>」；錯誤時保留輸入；防止重複提交；未儲存離頁需確認。

測試跨時區日期邊界可用程式層測試，不可改系統或資料庫時區設定。最後依 Shared Completion Report 回報並停止。
```

**Acceptance:** Exactly one row/event/Taipei day; today editable; history read-only; no silent Safety result.

---

## P10 — Reassess and Timeline

**Goal:** Show factual recorded change without producing a clinical score.

```text
請實作 /events/:eventId/reassess，使用者頁面名稱「追蹤變化」。

Eligibility：Initial Record + 至少兩筆 Daily Tracks。
- 未達條件仍允許進入，顯示 Informational state，不是 Error。
- 標題「還需要更多追蹤紀錄」。
- 顯示目前筆數與還差幾筆。
- CTA「新增今日追蹤」。

達條件後依序顯示：
1. Safety Banner（永遠優先）
2. Recorded Trend
3. Baseline→Current Severity
4. Frequency Change
5. Latest Subjective Change（獨立呈現）
6. Tracking duration/count
7. Timeline
8. 非診斷的 medical boundary statement

Trend 僅依既有紀錄比較：
- delta ≤ -2：「紀錄顯示困擾程度下降」
- delta -1 到 +1：「紀錄顯示變化不明顯」
- delta ≥ +2：「紀錄顯示困擾程度上升」
這不是臨床判定。P0 禁止建立 composite health score 或 enhanced chart。

Timeline：最新紀錄在最上方；使用中文名稱；不顯示 revision、version、table 名或 internal logs。Safety routing 必須覆蓋 Trend，不可因趨勢下降而淡化 priority_care。

若 derived query 缺少既有安全 capability，回報 blocker，不新增 DB 物件。最後依 Shared Completion Report 回報並停止。
```

**Acceptance:** Insufficient data is informational; exact delta wording; Safety overrides trend; newest first.

---

## P11 — Navigate / 就醫與專業支持方向

**Goal:** Present approved direction before any demo professional cards.

```text
請實作 /events/:eventId/navigate，使用者頁面名稱「就醫與專業支持方向」。

內容順序：
1. Event Context
2. Direction First
3. Medical Care
4. Other Professional Support（規則允許時）
5. Mock Professional Cards（optional、secondary）
6. Trusted Sources

規則：
- priority_care 只顯示 Medical Care，不顯示 Other Professional Support。
- Direction 一定先於 professional cards。
- 對應只能來自 approved Seed Content/navigation templates。
- Other 或 mapping 缺少時，僅使用規格核准的一般醫療評估 fallback；不得推論科別。
- associated symptoms 只能補充 context，不能改寫主要 mapping。
- medication 內容不得建議自行停藥或改劑量。
- Mock Professionals 若存在必須清楚標示「示範資料」，不可暗示真實 availability、配對或 Provider table。
- Trusted Sources progressive disclosure；不得自行編造來源。

Actions：
- Medical：「產生就醫摘要」。
- Professional Support：「產生諮詢摘要」。
- Secondary：「繼續追蹤」。

Seed Content 缺少時建立安全的 unavailable shell 並回報，不生成醫療方向。最後依 Shared Completion Report 回報並停止。
```

**Acceptance:** Direction first; priority care medical-only; demo data labeled; no inferred specialty/source.

---

## P12 — Summary Builder, Preview, and Ready Summary

**Goal:** Build immutable, user-confirmed snapshots from existing source records.

```text
請實作：
- /events/:eventId/summary/new（「建立健康摘要」）
- /summaries/:summaryId（Draft Preview 或 Ready Summary）

Summary type：就醫摘要／諮詢摘要，由進入來源與既有 schema 支援值決定。

系統產生的 core content：主要狀況、開始日期與 Initial Record、最新有效 tracking comparison 或 insufficient-data wording、相關症狀與補充、Life Context、曾嘗試的行動但不宣稱療效、current Safety context、非診斷聲明。使用者不能在 Summary 直接編輯 source data。

使用者可控制：
- Health Background categories，預設全部未勾選。
- Daily Track Notes，預設未勾選。
- 提供給專業人員的問題 0–3 題。

Builder：
- Primary「產生摘要預覽」。
- Loading 顯示含角括號的「<產生摘要中>」。
- 使用既有 capability 建立或更新該 Event/type 唯一 draft。
- 0 Track 仍允許 Initial-only Summary。
- 失敗不得留下不完整 draft，並保留使用者選項。

Draft Preview：
- 顯示完整 Snapshot。
- 問句必須為「這份摘要是否正確？」
- Primary「確認正確」，Loading「<確認中>」。
- Secondary「調整摘要內容」。
- Link「返回修改原始紀錄」。
- 調整摘要只改 inclusion/questions；修改來源要回來源畫面。

Ready Summary：
- 確認後 draft→ready 並保存確認時間。
- Ready 內容 immutable，P0 不可編輯或刪除。
- 確認前不需額外 blocking Modal。
- 來源之後改變不能改寫 Ready Snapshot。
- 非最新顯示「這份摘要不是依最新紀錄產生，原內容仍會保留。」
- CTA「依最新紀錄產生新摘要」。
- Ready Summary 若進入 edit flow，阻止編輯，只能從 current data 產生新 draft。

P0 不做 PDF、public link、Email、集中 Summary History。不得讓 Ready Summary 隨 Profile/Event query 即時變動。最後依 Shared Completion Report 回報並停止。
```

**Acceptance:** 0-track summary works; defaults unchecked; 0–3 questions; ready snapshot immutable.

---

## P13 — Cross-app States, Route Guards, Accessibility, and Responsive Pass

**Goal:** Apply consistent non-happy-path behavior across all implemented P0 screens.

```text
請對所有已完成 P0 screens 做 cross-app consistency pass，不增加新產品功能，也不修改資料庫。

Route guards：
- 無 session→/login。
- session 有效但 onboarding 未完成→/onboarding。
- onboarding 完成者進 /onboarding→/dashboard。
- unauthorized 或不存在 Event 使用同一訊息：「找不到這筆狀況追蹤，或你沒有權限查看。」不可洩漏他人 ownership。
- closed Event 進 Today Track/Edit：阻止動作並回 Event Detail。
- Safety incomplete 進 Guide：Safety route。
- priority_care 進 Guide：Event Detail 或 Navigate。
- Reassess 資料不足：允許進入並顯示 progress。
- 0 Track 進 Summary Builder：允許 Initial-only。
- Ready Summary edit：阻止，提供從 current data 建新 draft。

Loading：
- Page 使用 layout-specific Skeleton。
- Submit button 原位 spinner + disabled + duplicate prevention。
- 下列字串必須真的包含可見角括號並正確 escape：<登入中>、<建立帳號中>、<儲存中>、<建立中>、<狀況確認中>、<產生摘要中>、<確認中>。

Validation：blur + submit；focus 第一個 invalid field；修正後移除；錯誤不只靠 border color。使用 04_Screen_Spec.md 的固定核心訊息。

Unsaved Changes：Onboarding、New Event、Edit、Today Track、Summary Builder、Profile；只在 actual change 後顯示。Title「尚未儲存變更」；Primary「繼續編輯」；Secondary「放棄變更並離開」。

Network/persistence：保留輸入、Retry、不顯示技術資訊。Empty 與 Error 必須完全不同。

Session expired：「登入狀態已失效，請重新登入。」重新登入後在安全且合法時返回原 route。

Responsive/accessibility：
- Mobile/Tablet/Desktop 都檢查。
- Dashboard desktop max 2 columns、mobile 1 column。
- Mobile 無 bottom nav；Event Journey 用 Dropdown/Menu。
- touch target 約 44×44、keyboard navigation、visible focus、label/aria、error association。
- color 必須搭配文字/icon；Severity/Trend 色彩不模仿 Safety。

最後逐 route 列出修正與仍存在問題，依 Shared Completion Report 回報並停止。
```

**Acceptance:** Guards and states are consistent; literal Loading copy; keyboard/mobile usability verified.

---

## P14 — P0 Integration QA and Release-blocker Audit

**Goal:** Verify the Golden Path without expanding scope.

```text
請進行 NexNav P0 Integration QA。這一輪以檢查與必要的小型修正為主；不要新增 P1/P2，不要修改 Supabase schema／policies／Seed Content。

逐段測試 Golden Path：
Account/Profile → Record → Safety Check → Guide → Track → Reassess → Navigate → Prepare → Ready Summary

至少覆蓋：
1. Register/Login/Onboarding gates，並確認前端沒有重複建立 Profile。
2. 多個 active Events 各自獨立，Dashboard one-CTA priority 正確。
3. New Event 三步 Wizard、started_on 過去/今天與 future validation、原子建立。
4. Safety required/failure/normal/attention/priority_care routing；failure 絕不 fail open。
5. Edit revision 後舊 Safety/Guide 不當 current，且歷史不被刪除。
6. Today Track 每 Event/Asia-Taipei 日期一筆、同日 update、closed blocked。
7. Reassess 0/1/2+ Tracks 與 newest-first Timeline。
8. Navigate priority_care medical-only 與 Seed Content absence。
9. Summary 0 Track、draft、confirm、Ready immutable、source stale message、新 draft。
10. Unauthorized/nonexistent IDs 不洩漏 ownership。
11. Loading/Empty/Error/Validation/Unsaved/Network/session-expired。
12. Mobile、Tablet、Desktop；keyboard、focus、labels、44px targets。
13. 所有 user-facing internal terms 已翻成繁中；不出現 Guide、Safety Check、table/revision/version 等內部資訊。
14. Loading 按鈕角括號實際可見。

Release-blocker 判定：
- 任何 Safety fail-open、跨使用者資料、Ready Summary 可變、Event/Initial 非原子、同日 Track 重複、closed Event 可寫，均為 blocker。
- 缺少核准 Seed Content 也是 health-information Golden Path blocker；不得用假內容通過測試。
- 純裝飾文案、spacing、typography 可列為後續 Lovable visual polish，不得掩蓋功能 blocker。

輸出：
- route-by-route PASS／FAIL／BLOCKED 表。
- 每個 FAIL 的重現步驟、預期、實際與修正結果。
- 所有 BLOCKED 的責任來源（UI、existing DB capability、Seed Content、copy review）。
- 明確結論：P0 Golden Path 是否可進入下一階段。

完成後停止，不要自行部署、變更 Supabase 或進入 P1。
```

**Acceptance:** Evidence-based QA report; blockers remain visible; no fake Seed Content used.

---

## 5. Recommended Execution Order

| Order | Prompt | Depends on | Can proceed without Seed Content? |
|---:|---|---|---|
| 1 | P00 Preflight | Existing project | Yes |
| 2 | P01 App Shell | P00 approved | Yes |
| 3 | P02 Auth | P00 | Yes |
| 4 | P03 Onboarding/Profile | P01–P02 | Yes |
| 5 | P04 Dashboard | P01, existing event data capability | Partially |
| 6 | P05 New Event | P01, atomic create capability | Shell only if taxonomy absent |
| 7 | P06 Safety | P05, approved Safety content/logic | Shell only |
| 8 | P07 Event Detail/Edit/Close | P04–P06 | Partially |
| 9 | P08 Guide | P06, approved Guide content | Shell only |
| 10 | P09 Today Track | P07; Guide optional for priority care | Yes |
| 11 | P10 Reassess | P09 | Yes |
| 12 | P11 Navigate | P06, approved mappings/sources | Shell only |
| 13 | P12 Summary | P07, P09–P11 | Yes, using existing approved records |
| 14 | P13 Consistency Pass | P01–P12 | Yes |
| 15 | P14 Integration QA | P01–P13 | Full pass requires Seed Content |

## 6. Stop Conditions

Pause implementation and request a decision when any of the following occurs:

1. A requested write cannot be performed atomically with existing database capabilities.
2. Screen behavior requires a table, field, RPC, policy, or enum not present in the locked schema.
3. The implementation would require bypassing RLS or using a service-role key in the browser.
4. Approved medical Seed Content, Safety rules, Guide content, sources, or navigation mapping is missing.
5. A lower-priority document or prompt conflicts with a higher-priority Source of Truth.
6. A proposed change would make Ready Summary mutable, allow Safety failure to become Normal, or allow cross-user data access.
7. Lovable would need to replace the existing project, reconnect Supabase, or rebuild tested Auth.

## 7. Day 4 Copy and Visual Review Queue

These items may be refined after real adjacent screens are visible, provided meaning and routing do not change:

- Final user-facing title replacing temporary `先確認目前狀況` / `再次確認目前狀況`.
- Decorative helper text, microcopy, spacing, typography, and visual hierarchy.
- Component-level polish within the locked responsive and accessibility rules.

These are not open for casual visual revision:

- Route gates and Safety priority.
- Required/optional status and validation meaning.
- Literal Loading strings and visible angle brackets.
- Severity Slider anchors and behavior.
- Frequency and Life Context scale meaning.
- Immutable `started_on` after Event creation.
- Ready Summary immutability and Snapshot behavior.
- P0/P1/P2 boundary.

## 8. Initial Assembly Definition of Done

`05_Lovable_Prompt_Library.md v0.1` is complete when:

1. It can be executed incrementally without rebuilding Day 2 work.
2. Every P0 route is covered by an implementation prompt.
3. Database, RLS, Auth Trigger, and Seed Content guardrails are explicit.
4. Each prompt has a bounded scope and acceptance criteria.
5. Missing medical content leads to a blocker, never fabricated content.
6. Cross-screen Loading, Error, Empty, Validation, responsive, and accessibility rules are included.
7. Integration QA covers the complete P0 Golden Path and critical safety/data invariants.

---

**Day 3 — Lovable Prompt Library Initial Assembly COMPLETE**

---

## 9. Day 7 Execution Sync — P10／P11

### P10 — Reassess／追蹤變化

**Execution status:** Implemented; partial manual acceptance complete.  
**Remaining acceptance:** A second Daily Track on a different Asia/Taipei date is still required to verify the full trend conclusion, severity chart, and cross-date timeline. Do not classify this as an implementation failure before that data condition exists.

Locked invariants:

- Daily Track count is deduplicated by Asia/Taipei date.
- At least two different tracking dates are required before a trend conclusion appears.
- Safety takes precedence over improvement or deterioration trends.
- No composite health score or diagnostic conclusion.
- Timeline and latest-record selection do not depend on `updated_at`.

### P11 — Navigate／就醫與專業協助

**Final status:** Completed & Closed on 2026-08-20.  
**Route:** `/events/:eventId/navigate`  
**Implementation strategy:** Scheme A — P11 implements navigation/support content and two Summary entry links only. Full Summary／Prepare behavior remains P12.

Final user-facing name:

- Page and Event Journey: `就醫與專業協助`
- Medical summary entry: `/events/:eventId/summary/new?type=medical`
- Professional summary entry: `/events/:eventId/summary/new?type=professional`

Final state behavior:

- `normal`: information banner, general next steps, five professional-assistance mappings, current record summary, two Summary entries, fixed boundary statement.
- `attention`: amber caution banner, general next steps and professional-assistance mappings remain visible. Safety v1.0 does not currently generate this state; branch is retained for compatibility.
- `priority_care`: red urgent banner; general next steps and professional-assistance mappings are not rendered. Current record summary, Summary entries, and fixed boundary statement remain visible.
- Missing or invalid Safety must never fail open to `normal`.

Professional-assistance mappings:

1. 飲食與營養問題 → 營養師
2. 壓力、情緒或心理適應 → 諮商心理師／臨床心理師
3. 用藥與保健品問題 → 藥師
4. 一般運動安排與體能訓練 → 具相關資格的運動教練
5. 姿勢不良、肌肉或關節痠痛問題 → 復健科醫師／物理治療師

Presentation is a compact mapping list, not five large equal-width cards. No sixth category is added for visual balance.

Final implementation and fix prompts are preserved in `P11_Lovable_Prompt_Pack_v1.0.md`.

Acceptance evidence:

- Initial implementation and one consolidated Final Fix completed.
- Desktop `normal` and `priority_care` manually verified.
- Mobile `normal` and `priority_care` manually verified.
- `?type=medical` and `?type=professional` manually verified.
- Typecheck, build, eslint, and prettier passed.
- No Table, View, RPC, Trigger, Migration, RLS, Realtime, or Summary write behavior added.

Known non-blocking follow-up:

- On a narrow mobile viewport, the final character of the priority-care heading may wrap to a new line. Keep as a P2 Demo Visual Polish item; do not reopen P11 solely for this.

**Day 7 — P11 COMPLETE & CLOSED**
