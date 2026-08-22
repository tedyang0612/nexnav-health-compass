# NexNav MVP — User Flow

**Version:** v1.0  
**Status:** Day 1 Locked  
**Source of Truth:** `01_Project_Vision.md` + `02_PRD.md v1.0`  
**Scope:** P0 Golden Path + key P1/P2 boundaries

---

## 1. Purpose

本文件以精簡流程方式呈現 NexNav MVP 的主要使用者路徑與關鍵分支。

詳細功能規則、Acceptance Criteria、Safety Boundary 與 Scope Priority，均以 `02_PRD.md` 為準。本文件不重複定義 Functional Requirements。

---

## 2. Overall P0 Golden Path

```text
登入 / 建立帳號
      ↓
Health Profile
      ↓
Dashboard
      ↓
建立新的狀況追蹤
      ↓
Record
      ↓
Safety Check
      ↓
Guide
      ↓
Act
      ↓
Daily Track
      ↓
Reassess
      ↓
Navigate
      ↓
Prepare
      ↓
就醫摘要 / 諮詢摘要
```

> Safety Check 可依結果提前將使用者導向 Navigate，不必強制經過 Guide → Act → Track → Reassess。

---

## 3. Account & Onboarding Flow

```text
進入 NexNav
    ↓
是否已登入？
 ┌──┴──────────┐
 No            Yes
 ↓              ↓
登入 / 註冊    是否已完成 Health Profile？
Email / Google       │
                ┌────┴────┐
                No        Yes
                ↓          ↓
        基本健康檔案     Dashboard
                ↓
        健康背景（選填）
          ↓        ↓
        填寫      略過
          └────┬───┘
               ↓
           Dashboard
```

### 核心規則
- Email / Google Login = P0。
- Facebook Login = P1。
- 基本健康檔案完成後才能結束 Onboarding。
- 健康背景為選填，可略過。
- 已完成 Profile 的使用者再次登入直接進 Dashboard。

---

## 4. Record Flow

```text
Dashboard
    ↓
＋ 建立新的狀況追蹤
    ↓
Step 1｜主要不適
    ↓
Step 2｜相關狀況
    ↓
Step 3｜確認紀錄
    ↓
建立 Health Event
    ↓
Safety Check
```

### Step 1｜主要不適
- Category
- Primary Symptom
- Severity
- Frequency / Duration
- `Other` 可輸入自訂主要不適

### Step 2｜相關狀況
- Associated Symptoms（可為 0）
- Life Context（必填）
  - 睡眠
  - 飲食
  - 活動
  - 壓力
- 補充描述（選填）

### Step 3｜確認紀錄
使用者確認後建立 Health Event。

### 核心規則
- 一個 Health Event = 一個 Primary Symptom + 多個 Associated Symptoms。
- 可同時存在多筆 Active Health Events。
- Health Event 建立後 Primary Symptom 鎖定。
- 其他可修改資料更新時不改變原始 Start Date。

---

## 5. Safety Check Flow

```text
Record 完成
    ↓
Safety Check
    ↓
 ┌─────────────┬──────────────────┬─────────────────────┐
 │             │                  │
Normal      Attention        Priority Care
 │             │                  │
 ↓             ↓                  ↓
Guide       Guide          Navigate
             +                  ↓
          Navigate Option    Medical Care
```

### Normal
主要 CTA：

**查看改善方向**

### Attention
提供：

- 查看改善方向
- 查看就醫方向

### Priority Care
主要 CTA：

**查看就醫方向**

且 Navigate 僅呈現 Medical Care，不以 Professional Support 取代醫療評估。

### Fail-safe

```text
Safety 無法正確完成
        ↓
不得自動判定 Normal
        ↓
重新嘗試 / 查看就醫方向
```

### 核心規則
- Safety Result > Reassess Trend。
- Priority Care 不會自動結束狀況追蹤。
- Priority Care 仍允許 Daily Track。
- 提示持續存在，直到新的有效 Safety Check / Recheck 改變結果。

---

## 6. Guide → Act Flow

```text
Safety Check
    ↓
Guide
    ↓
A｜Health Context Summary
    ↓
B｜Health Information / Possible Factors
    ↓
C｜2–3 Improvement Suggestions
    ↓
D｜Observation Guidance
    ↓
Act
    ↓
使用者自行嘗試改善方式
    ↓
Daily Track
```

### 核心規則
- Guide 使用 Primary Symptom Template + User Context。
- 不只根據 Life Context 提供籠統建議。
- 健康資訊與就醫方向使用可信來源。
- `Other` 沒有可信 Template 時使用 Safe Fallback，不猜測可能疾病。
- Act 不是獨立功能 Module。
- 使用者不需要完成所有 Suggestions 才能繼續 Track。

---

## 7. Daily Track Flow

```text
Active Health Event
      ↓
今天是否已有 Track？
   ┌──┴─────┐
   No       Yes
   ↓         ↓
新增今日    查看 / 修改
追蹤        今日紀錄
   ↓         ↓
   └────┬────┘
        ↓
更新 Health Event Detail
        ↓
是否觸發 Safety Recheck？
   ┌────┴─────┐
   Yes        No
   ↓           ↓
Safety       Reassess
Recheck      更新
```

### Daily Track
- Severity
- Frequency
- Subjective Change
- Life Context
- Suggestions Execution
- Notes（選填）

### 核心規則
- 同一 Health Event 每日最多一筆 Daily Track。
- 不同 Health Events 同日可各有一筆。
- 今日 Track 可修改。
- Historical Track 在 P0 為 Read-only。
- Closed Event 不可新增 Track。
- 歷史 Track 保留當時對應的 Guide Suggestion Snapshot / Reference。

---

## 8. Reassess Flow

```text
Initial Record
     ↓
Daily Tracks
     ↓
是否至少有 2 筆 Track？
 ┌───┴────────┐
 No           Yes
 ↓             ↓
資料不足       Reassess
提示            ↓
          Overall Trend
          Baseline → Current
          Frequency Change
          Tracking Duration
          Timeline
                ↓
        ┌───────┴────────┐
        ↓                ↓
   繼續追蹤          查看就醫方向
```

### Trend Rule
- 差值 ≤ -2：改善
- -1 ～ +1：變化不明顯
- 差值 ≥ +2：變差

此規則僅整理使用者記錄的數值變化，不代表臨床改善或惡化判定。

### 核心規則
- Baseline = Initial Record。
- Current = 最新有效 Daily Track。
- Frequency 獨立呈現，不建立 Composite Health Score。
- Subjective Change 與 Recorded Trend 分開。
- 不推論 Life Context / Suggestions 與症狀變化的因果關係。
- Safety Result 優先於 Reassess Trend。

---

## 9. Navigate Flow

### Entry Points

```text
Safety Check ────────┐
                     │
Reassess ────────────┼──→ Navigate
                     │
使用者主動查看 ──────┘
```

### Normal Navigate

```text
Navigate
   ↓
追蹤 / 症狀 Context
   ↓
┌──────────────────┬──────────────────────┐
│                  │
Medical Care       Professional Support
│                  │
就醫方向            其他專業支持
│                  │
可信來源            Curated Context
│                  │
Mock Professional  Mock Professional
└─────────┬────────┴───────────┐
          ↓                    ↓
     產生就醫摘要          產生諮詢摘要
```

### Priority Safety Route

```text
Priority Safety
      ↓
Navigate
      ↓
Medical Care Only
      ↓
就醫方向
      ↓
產生就醫摘要
```

### 核心規則
- Direction First，Professional Cards Second。
- Associated Symptoms 提供 Context，不做疾病預測。
- Mock Professional 明確標示為示範資料。
- Medication Context 不提供自行停藥或調整劑量建議。
- `Other` 或 Template Missing 不猜 Specialty，使用一般醫療評估 Fallback。

---

## 10. Prepare Flow

```text
Navigate / Health Event Detail
            ↓
      選擇 Summary Type
       ↙             ↘
產生就醫摘要       產生諮詢摘要
       ↘             ↙
        Core Health Summary
                ↓
選擇 Health Background
選擇重要 Track Notes
填寫 0–3 個想詢問的問題
                ↓
             Preview
                ↓
       這份摘要是否正確？
          ↙           ↘
    返回修改紀錄      確認正確
          ↓              ↓
      Source Data      ready
          ↓
      重新產生摘要
```

### 核心規則
- Prepare 不要求已有 Reassess。
- 0 Track 仍可產生 Initial-only Summary。
- 沒有足夠資料時不假裝存在 Trend。
- Summary 綁定單一 Health Event。
- Health Background 由使用者選擇是否納入。
- Daily Track Notes 由使用者選擇。
- 最多 3 個問題。
- Summary 內不能直接修改 Source Data。
- Summary 為 Snapshot。
- Source Data 更新後，舊 Summary 不變，可產生最新摘要。

---

## 11. Close Tracking Flow

```text
Active Health Event
       ↓
結束這次追蹤
       ↓
確認是否結束
   ↙          ↘
取消          確認
               ↓
         status = closed
               ↓
從 Active List 移除
               ↓
     Product Feedback（P1）
          ↙          ↘
        填寫          略過
```

### 核心規則
- Close ≠ Delete。
- Event、Track、Safety、Summary 等歷史資料保留。
- Closed Event 不再新增 Daily Track。
- History UI = P2。
- Product Feedback = P1，且只在 Close Tracking 後觸發。
- Connect 完成不觸發 Feedback。

---

## 12. P1 Connect Extension

P0 在 Prepare 即已成立；Connect 為 P1 Demo Plus。

```text
Navigate
   ↓
Mock Professional
   ↓
Professional Detail
   ↓
Mock Appointment
   ↓
完成預約
   ↓
查看預約 / 返回狀況追蹤
```

### 核心規則
- Appointment ≠ Tracking Closed。
- 預約後仍可繼續 Daily Track。
- 真實預約、醫療資源與 Telehealth 串接為 Post-MVP。

---

## 13. P2 Future Flow Extensions

### History
```text
我的追蹤
 ├─ 追蹤中的狀況
 └─ 歷史追蹤紀錄（P2）
```

### Experience Sharing
P2 僅展示 Mock Posts / Detail，不建立真正 UGC 社群功能。

### Wearables
P2 僅展示連結穿戴裝置 / Coming Soon UI。

### Health Report
P2 僅展示上傳健檢報告 / Coming Soon UI，不進行 OCR 或醫療分析。

---

## 14. Golden Path Completion Boundary

NexNav P0 被視為完整時，以下流程必須真正可操作：

```text
Account / Profile
        ↓
Record
        ↓
Safety Check
        ↓
Guide
        ↓
Act
        ↓
Track
        ↓
Reassess
        ↓
Navigate
        ↓
Prepare
        ↓
Ready Summary
```

P0 不依賴 Connect、Product Feedback、History、Community、Wearables 或 Health Report 才能成立。

---

## 15. Related Documents

- `01_Project_Vision.md` — Product foundation, target user, value proposition and vision.
- `02_PRD.md` — Functional requirements, scope, acceptance criteria, safety/privacy rules and Definition of Done.
- `03_Database_Schema.md` — Supabase data model and security design. **Day 2**
- `04_Screen_Spec.md` — Detailed screen/component specification.
- `05_Lovable_Prompt_Library.md` — Implementation prompt sequence for Lovable.

---

## 16. Day 1 Status

**Day 1 — Product Definition: CLOSED**

Completed:
- Product Vision
- Product naming
- Target User
- Value Proposition
- Product Loop
- Golden Path
- MVP Scope
- Functional Requirements
- Acceptance Criteria
- Cross-Module Consistency Check
- PRD v1.0
- User Flow v1.0

Next phase:

**Day 2 — Database Schema & Supabase Architecture**
