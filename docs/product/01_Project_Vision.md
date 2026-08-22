# NexNav — Project Vision

**Version:** v1.2  
**Status:** Locked  
**Product Name:** NexNav  
**Project Type:** 10-Day MVP / AI Vibe Coding  
**Development Tools:** ChatGPT (GPT-5.6) + Lovable Pro + Supabase Free  
**AI Strategy:** MVP 階段不串接 OpenAI API；AI 分析先以 Mock Data、Curated Content 與 Rule-based Logic 呈現。

---

## 1. Project Overview

NexNav 是一個「智慧健康導航平台」，協助使用者在出現身體不適或有日常健康管理需求時，將零散的症狀、生活狀況與追蹤紀錄整理成可理解、可持續追蹤的健康資訊。

平台核心不是進行醫療診斷，而是協助使用者從「不知道現在該怎麼辦」，逐步走向：

> **紀錄 → 理解 → 決策 → 行動 → 追蹤 → 再評估 → 專業銜接 → 溝通**

NexNav 希望降低使用者面對健康問題時的資訊混亂與決策不確定性，並提升日常健康管理意識。

## 2. Problem Statement

使用者出現頭暈、疲勞、睡眠困擾、腸胃不適等狀況時，常自行搜尋資訊、短暫觀察，或直接決定是否就醫。主要問題包括：

- **健康資訊零散：** 搜尋結果很多，但不一定對應實際狀況。
- **缺乏持續紀錄：** 不容易回想症狀開始時間、嚴重程度變化與期間做過的調整。
- **難以判斷下一步：** 不確定應先生活調整、繼續觀察，或尋求專業協助。
- **就醫溝通資訊不完整：** 容易只描述當下感受，無法完整呈現一段時間的變化。
- **健康管理偏事件式：** 多數人往往等到不舒服才開始關注健康。

## 3. Product Vision

> **讓使用者在面對健康不適時，不只是搜尋答案，而是能透過持續紀錄、理解與追蹤，更清楚地知道自己的狀況，以及下一步可以怎麼做。**

NexNav 希望成為使用者與專業醫療／健康資源之間的「前置導航層」。

平台不取代醫療專業，而是協助使用者整理健康資訊、理解一般健康資訊與值得留意的因素、嘗試生活改善方向、持續追蹤變化，在需要時尋求專業協助，並整理成容易溝通的摘要。

長期而言，NexNav 希望從「症狀發生後的健康導航」逐步延伸為個人的持續健康管理入口。

## 4. Product Positioning

NexNav 不是 AI 醫師、線上診斷平台、疾病預測工具、單純症狀搜尋網站、單純健康日記或醫療預約 Marketplace。

定位為：

> **Health Tracking + Health Navigation Platform**

透過結構化健康紀錄與追蹤，協助使用者理解自身狀況並做出下一步決策，在需要時銜接適合的醫療或健康專業資源。

## 5. Primary Target User

### MVP Primary Target User

**18～55 歲，具有健康管理需求或輕微身體不適，且習慣使用數位工具自行記錄或搜尋健康資訊的使用者。**

典型情境包括：
- 最近出現不舒服，但不確定是否需要立即就醫；
- 希望先嘗試生活調整並觀察變化；
- 有持續性健康困擾，希望整理一段時間的變化；
- 希望在就醫前把自己的狀況整理得更完整；
- 平時已有健康管理習慣，希望建立更有結構的紀錄。

### Secondary / Future Users
- 有慢性健康管理需求者；
- 穿戴裝置使用者；
- 定期健檢族群；
- 希望獲得營養、運動、藥事或其他健康專業支持者。

## 6. Core User Problem

NexNav 聚焦的核心問題不是：

> 「我得了什麼病？」

而是：

> **「我現在的身體狀況到底發生了什麼變化？我可以先做什麼？什麼時候應該尋求專業協助？如果需要就醫，我要怎麼把這段期間的狀況說清楚？」**

## 7. Value Proposition

### Core Value Proposition

> **NexNav 將一次性的健康搜尋，轉變為可以持續紀錄、理解、行動與追蹤的健康導航流程。**

- **Record｜紀錄：** 結構化記錄主要不適、相關狀況與生活背景。
- **Understand｜理解：** 提供相關一般健康資訊、可能值得留意的因素與可信資訊來源。
- **Decide｜決策：** 透過 Safety Check、Guide 與追蹤協助理解下一步方向。
- **Act｜行動：** 提供少量、可實際嘗試的改善建議。
- **Track｜追蹤：** 持續記錄症狀與生活狀況變化。
- **Reassess｜再評估：** 將一段時間的紀錄整理成直觀變化資訊。
- **Navigate｜導航：** 在需要時提供醫療評估或其他專業支持方向。
- **Communicate｜溝通：** 整理就醫／諮詢摘要，協助完整描述狀況。

### Extended Value

> **透過持續紀錄與追蹤，提高使用者對自身健康狀態的覺察與健康管理意識。**

## 8. NexNav Product Loop v1.0

```text
Record
  ↓
Safety Check
  ↓
Understand / Guide
  ↓
Decide
  ↓
Act
  ↓
Track
  ↓
Reassess
  ↓
Continue Tracking / Navigate
  ↓
Prepare / Communicate
```

### Safety Branch

```text
Record
  ↓
Safety Check
  ↓
Priority Medical Assistance
  ↓
Navigate
  ↓
Prepare / Communicate
```

使用者仍可保留後續追蹤能力，但 NexNav 不以自我改善建議取代必要的專業醫療評估。

## 9. Core Product Principles

### 9.1 Health Record Is a Core Feature
健康紀錄不是附屬功能。NexNav 的價值來自：

> **一段時間的紀錄 → 形成變化脈絡 → 支援下一步決策與溝通**

### 9.2 One Health Event, One Primary Concern
每一次狀況追蹤以一個主要不適為核心，可同時記錄多個相關狀況；使用者可同時存在多筆未結束的狀況追蹤。

### 9.3 User Controls Tracking Closure
平台不自動替使用者結束狀況追蹤。使用者自行決定何時結束。

未來可在長時間沒有新增追蹤紀錄時主動詢問，例如已 14 天無紀錄時詢問是否結束。此提醒屬於 P1。

## 10. MVP Goal

10 天內完成真正可操作的 NexNav MVP，使使用者能：

1. 建立帳號並完成基本健康檔案；
2. 建立一筆狀況追蹤；
3. 完成 Safety Check；
4. 取得相關 Guide；
5. 嘗試改善方向；
6. 建立 Daily Track；
7. 查看一段期間的變化；
8. 查看就醫／專業支持方向；
9. 產生專業溝通摘要。

> **MVP 成功的核心不是功能數量，而是完整跑通 NexNav Product Loop。**

## 11. MVP Functional Direction

### P0 — MVP Core
- Account / Authentication
- Health Profile
- Record / 狀況追蹤
- Safety Check
- Guide
- Act（Product Loop Stage）
- Daily Track
- Reassess
- Navigate
- Prepare / Health Summary

### P1 — Demo Plus
- Facebook Login
- 14-Day Tracking Reminder
- Enhanced Trend Visualization
- Connect / Mock Appointment
- Product Feedback
- Summary / Export enhancements

### P2 — Future Prototype
- Closed Tracking History UI
- Experience Sharing Prototype
- Wearable Device Prototype
- Health Report Upload Prototype

### Post-MVP
- Real AI analysis / OpenAI API
- Real provider integration
- Telehealth
- Wearable data integration
- Health-report parsing and analysis
- Full community / UGC
- Advanced personalized health analytics

## 12. Account & Profile Direction

MVP 支援：
- Email / Password
- Google Login

Facebook Login 為 P1。

首次登入後 Profile 採兩階段：
1. **基本健康檔案**
2. **健康背景（選填，可略過）**

健康背景可包含慢性健康狀況、過敏、用藥資訊等，使用者後續可修改 Profile。

## 13. Health Information & AI Strategy

NexNav 最終希望透過 AI 理解使用者紀錄、整理可能因素、提供個人化改善方向、整理長期變化與產生專業溝通摘要。

但 10-Day MVP：

> **不串接 OpenAI API。**

改採：
- Curated Content
- Rule-based Logic
- Mock Data
- 預先設計的內容 Template

先驗證產品流程與資訊架構，再決定後續 AI Prompt 與 API Integration。

## 14. Health Content Strategy

### MVP Content Scope
**5 Categories / 7 Primary Symptoms + Other**

### Hero Symptom Groups
- 頭痛／頭暈
- 疲勞／睡眠困擾
- 腸胃不適

Hero Groups 提供較完整的 Guide / Possible Factors / Improvement Suggestions / Navigation。

其餘支援症狀提供 Minimum Viable Trusted Content；`Other` 使用 Safe Fallback，不自行猜測疾病原因或專科方向。

## 15. Professional Support Vision

NexNav 的專業銜接不只限於醫師。

### Medical Care
- 不同專科醫師；
- 一般醫療評估；
- 其他正式醫療資源。

### Other Professional Support
例如：
- 藥師；
- 營養師；
- 物理治療相關專業；
- 健身／運動專業；
- 其他適合的健康支持角色。

> **Medical Care ≠ Other Professional Support**

其他專業支持不能取代需要的醫療評估。

## 16. Connect Vision

未來希望讓使用者在 Navigate 後直接銜接專業資源，包括專業人員資料、實體服務、線上諮詢、預約時間及附帶 NexNav Health Summary。

10-Day MVP 若時間允許，以 **Mock Appointment（P1）** 呈現，不進行真實醫療預約或 Telehealth Integration。

## 17. Experience Sharing Vision

Experience Sharing 讓曾有類似狀況的使用者分享自身經驗，使其他使用者知道自己並非唯一遇到這類問題，降低資訊不足帶來的不安。

必須避免把個人經驗當成醫療建議、錯誤醫療資訊與未經管理的疾病診斷宣稱。

10-Day MVP：

> **P2 Mock Prototype only**

## 18. Product Feedback Vision

Product Feedback 是使用者對 NexNav 本身是否有幫助的私密回饋，與 Experience Sharing 不同。

觸發時機：

> **使用者主動結束一次狀況追蹤後。**

Product Feedback 不會自動公開到 Experience Sharing。

## 19. Wearable Device Vision

未來整合穿戴裝置，減少手動輸入並持續取得睡眠、活動、心率、HRV 等健康指標，與 Health Event / Daily Track 結合形成長期健康脈絡。

10-Day MVP：

> **P2 UI Prototype / Coming Soon**

## 20. Health Report Vision

未來使用者可上傳健檢報告，整理重要指標並長期追蹤。

10-Day MVP 僅做：

> **P2 Upload Prototype / Coming Soon**

不進行 OCR、AI Medical Interpretation 或 Clinical Risk Prediction。

## 21. Safety & Medical Boundary

> **NexNav 是健康資訊整理與導航工具，不是醫療診斷工具。**

平台可以：
- 整理使用者輸入；
- 提供一般健康資訊；
- 提供可信資訊來源；
- 提醒值得注意的情況；
- 建議尋求專業協助；
- 協助整理就醫資訊。

平台不應：
- 診斷疾病；
- 宣稱使用者罹患特定疾病；
- 提供處方；
- 建議自行停藥；
- 建議自行調整藥物劑量；
- 用未經驗證演算法取代醫療判斷；
- 將生活因素與症狀變化宣稱為確定因果關係。

## 22. Long-Term Product Direction

```text
症狀紀錄
    ↓
健康追蹤
    ↓
個人健康脈絡
    ↓
專業健康導航
    ↓
穿戴裝置 / 健檢資料
    ↓
長期個人健康管理
```

最終希望 NexNav 從：

> 「身體不舒服時才打開的工具」

逐步成為：

> **「持續理解自己健康狀況的個人健康導航入口」。**

## 23. 10-Day Development Principle

工具：
- ChatGPT (GPT-5.6)
- Lovable Pro
- Supabase Free

開發原則：
1. P0 Golden Path 優先；
2. 每個功能逐模組完成；
3. 不一次生成整個產品；
4. 不為 Future Features 提前建立複雜架構；
5. Mock Data 可以驗證流程時，不提前串接外部 API；
6. Day 6 若 P0 尚未完整跑通，停止 P1/P2 開發；
7. Demo 前優先確保資料正確、流程完整、安全邏輯成立。

## 24. Source-of-Truth Relationship

本文件定義：

> **Why / Who / Product Direction**

後續文件：
- `02_PRD.md` — What to build / Functional Requirements / Acceptance Criteria
- `User_Flow.md` — User journey and route branches
- `03_Database_Schema.md` — Data architecture / Supabase
- `04_Screen_Spec.md` — Screen / Component / Interaction specification
- `05_Lovable_Prompt_Library.md` — Implementation prompts

若後續文件與本 Vision 的核心產品方向產生重大衝突，應先確認是否需要升版 Vision，而不是直接由下游文件覆蓋。

---

## Vision Statement

> **NexNav 透過結構化健康紀錄、持續追蹤與可信健康導航，協助使用者從「發現不適」走到「理解狀況、採取行動、觀察變化，並在需要時更有效地與專業人員溝通」，同時逐步建立更主動的健康管理意識。**
