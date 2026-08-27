# NexNav Health Navigator
https://nexnav-health-navigator.lovable.app/

# NexNav｜智慧健康導航平台

> **從記錄不適，到找到下一步。**
> NexNav 協助使用者整理健康狀況、辨識安全風險、持續追蹤變化，並在需要時準備資訊、尋找適合的專業協助。

---

## 1. 專案簡介

**NexNav** 是一個以「健康導航（Health Navigation）」為核心概念的響應式 Web Application。

當使用者遇到頭痛、疲倦、睡眠困擾、腸胃不適等日常健康問題時，往往需要自行搜尋大量資訊，卻不一定知道：

* 現在的狀況是否需要特別注意？
* 可以先從哪些生活因素開始觀察？
* 症狀這幾天究竟有沒有改善？
* 什麼時候應該尋求專業協助？
* 就醫或諮詢時，該如何整理自己的狀況？

NexNav 並不嘗試取代醫療專業人員進行診斷，而是將健康資訊整理成一條清楚的行動路徑，協助使用者從「發現不適」逐步走向「理解、追蹤、判讀與尋求適當協助」。

---

## 2. 核心理念

NexNav 的產品核心流程為：

**Record → Understand → Decide → Act → Communicate**

對應產品中的 Golden Path：

**Record 記錄 → Safety 安全確認 → Guide 改善方向 → Track 每日追蹤 → Reassess 變化判讀 → Navigate 專業協助 → Prepare 建立摘要 → Connect 醫療資源**

透過完整流程，將零散的健康資訊轉化為可理解、可追蹤、可溝通的健康紀錄。

---

## 3. Golden Path

### 01｜Record — 記錄

建立一次「狀況追蹤」，記錄目前主要不適與基本狀況。

MVP 支援的主要症狀類型：

* 頭痛
* 頭昏
* 疲倦或精神不濟
* 睡眠困擾
* 腹部或腸胃不適
* 肌肉或關節不適
* 鼻子或喉嚨不適
* 其他不適

使用者可以同時建立多個 Event，分別追蹤不同健康狀況。

---

### 02｜Safety — 安全確認

在進入一般健康導航流程前，先進行必要的安全風險確認。

Safety Check 採用簡潔的 Yes / No 問題，確認是否存在需要優先處理的警訊，例如：

* 嚴重呼吸困難
* 明顯胸痛或胸部壓迫感
* 突發性中風相關警訊
* 意識異常、難以喚醒或突然明顯混亂
* 其他需優先處理的重要警訊

系統依結果提供不同程度的安全提示與下一步行動方向。

> Safety Check 僅提供一般性安全導航，不構成醫療診斷。

---

### 03｜Guide — 改善方向

根據使用者記錄的主要不適，整理一般性的健康資訊與可觀察方向。

Guide 的目的不是提供診斷，而是協助使用者：

* 理解可能需要注意的生活因素
* 建立自我觀察方向
* 知道哪些變化值得持續記錄
* 取得可信來源的健康資訊

---

### 04｜Track — 每日追蹤

使用者可每日記錄一次健康狀況，建立連續的變化資料。

追蹤內容包含：

* 困擾程度
* 發生頻率
* 主觀變化
* 睡眠
* 飲食／飲水
* 活動狀況
* 壓力等生活因素
* 補充備註

同一天的紀錄可以再次更新，避免產生重複資料。

---

### 05｜Reassess — 變化判讀

將每日追蹤資料轉換成更容易理解的視覺資訊。

包含：

* 症狀困擾程度趨勢
* 發生頻率變化
* Timeline 追蹤時間軸
* Safety 結果摘要
* 整體變化方向

協助使用者從單日感受進一步理解一段時間內的健康變化。

---

### 06｜Navigate — 專業協助

當持續追蹤後仍需要進一步處理時，NexNav 協助使用者判斷下一步可尋求的專業協助方向。

目前涵蓋：

* 醫療院所
* 營養師
* 心理諮商師
* 藥師
* 運動教練
* 復健科醫師／物理治療師

系統依目前狀況提供導航，而非直接進行醫療診斷。

---

### 07｜Prepare — 建立摘要

使用者可以將已累積的健康資訊整理成固定版本摘要，降低就醫或專業諮詢時重新回想與描述資訊的負擔。

目前支援：

#### 就醫摘要

整理：

* 主要症狀
* 建立狀況追蹤當日資訊
* Safety 安全確認
* 困擾程度與發生頻率變化
* 每日追蹤紀錄
* 生活狀況
* 使用者補充資訊

#### 專業諮詢摘要

針對其他健康專業人員整理：

* 生活狀況
* 已嘗試的調整
* 追蹤紀錄
* 希望詢問的專業對象
* 希望討論的問題

摘要必須經使用者預覽並確認後才會保存。

確認後的摘要採用 **Immutable Snapshot** 概念保存，不會因後續健康紀錄變更而自動改寫既有摘要。

---

### 08｜Connect — 醫療資源

完成就醫摘要後，使用者可以進一步尋找附近的醫療資源。

Connect 將健康紀錄與實際下一步行動串接，使流程不只停留在「知道該就醫」，而能繼續前往適合的醫療資源。

---

## 4. Dashboard｜狀況總覽

Dashboard 是 NexNav 的主要操作中心。

每一個進行中的狀況追蹤會以 Event Card 呈現，包括：

* 症狀名稱與識別 Icon
* 開始追蹤日期
* 累積追蹤資訊
* Golden Path 目前進度
* Safety 狀態
* 建議下一步
* 動態 CTA

系統會依目前 Event 狀態自動提供下一步，例如：

* 完成目前狀況確認
* 查看改善方向
* 開始今日追蹤
* 查看追蹤變化
* 查看專業協助

讓使用者不需要自行判斷應該進入哪個頁面。

---

## 5. 帳號與個人資料

MVP 已建立基本帳號與使用者資料流程，包括：

* Register 註冊
* Login 登入
* Onboarding 初始設定
* Profile 個人資料
* 基本健康背景

Authentication 與使用者資料串接既有外部 **Supabase** 專案。

---

## 6. 資料與安全設計

NexNav 的資料設計以「健康狀況 Event」作為核心。

主要資料包含：

* 使用者 Profile
* Health Event
* Safety Check
* Guide
* Daily Track
* Reassess
* Summary
* 使用者健康背景與相關資料

資料庫採用 Supabase，並搭配：

* Authentication
* Row Level Security（RLS）
* Database Index
* Trigger
* 資料唯一性限制
* Snapshot 保存機制

以維持資料隔離與紀錄一致性。

---

## 7. 響應式介面

NexNav 採用 Responsive Web Design，同時支援：

* Desktop
* Mobile

設計方向以健康科技產品為核心：

* 青綠至藍色品牌色
* 清楚的資訊層級
* 卡片式 UI
* 症狀識別 Icon
* Golden Path 視覺導航
* 語意化安全狀態
* 行動裝置優先考量的資訊密度

---

## 8. 技術架構

### Frontend

* React
* TypeScript
* Responsive Web Design
* Component-based UI Architecture

### Backend / Database

* Supabase
* Supabase Authentication
* PostgreSQL
* Row Level Security（RLS）

### Development

* Lovable
* GitHub
* Git Branch / Pull Request Workflow

---

## 9. MVP 功能範圍

| 模組            | 功能               | MVP 狀態     |
| ------------- | ---------------- | ---------- |
| Account       | Login / Register | Completed  |
| Onboarding    | 基本資料與健康背景        | Completed  |
| Profile       | 個人資料管理           | Completed  |
| Record        | 建立健康狀況追蹤         | Completed  |
| Safety        | 安全警訊確認           | Completed  |
| Guide         | 改善與觀察方向          | Completed  |
| Track         | 每日健康追蹤           | Completed  |
| Reassess      | 趨勢與變化判讀          | Completed  |
| Navigate      | 專業協助導航           | Completed  |
| Prepare       | 就醫／專業諮詢摘要        | Completed  |
| Connect       | 醫療資源銜接           | MVP / Demo |
| Dashboard     | 多 Event 狀況總覽     | Completed  |
| Responsive UI | Desktop / Mobile | Completed  |

---

## 10. 產品定位

NexNav 並非：

* AI 醫師
* 線上診斷工具
* 疾病預測工具
* 醫療專業人員的替代方案

NexNav 的定位是：

> **Personal Health Navigation Platform｜個人健康導航平台**

核心價值不是告訴使用者「你得了什麼病」，而是協助使用者回答：

> **「我現在可以怎麼做？接下來該往哪裡走？」**

---

## 11. 醫療聲明

> **NexNav 提供一般性健康資訊與行動導航，內容不構成醫療診斷，亦不能取代專業醫療評估。**

如出現嚴重、快速惡化或可能危及生命的症狀，應立即尋求適當的緊急醫療協助。

---

## 12. MVP Status

**NexNav MVP — Demo Ready**

目前版本已完成主要 Golden Path 與核心功能整合，可進行完整產品流程展示：

**Record → Safety → Guide → Track → Reassess → Navigate → Prepare → Connect**

後續版本將持續針對使用者測試結果、流程體驗、資料視覺化與健康資源串接進行優化。

---

**NexNav**
*From uncertainty to the next step.*
---


Create a minimal project scaffold for a responsive web application named NexNav.

NexNav is a health navigation platform that helps users organize mild health concerns, track symptoms and lifestyle factors, and prepare information for seeking appropriate professional care.

For this initial scaffold only:

- Create a clean responsive React application shell.

- Use Traditional Chinese (zh-TW) as the interface language.

- Create only basic placeholder routes for Login, Register, Onboarding, and Dashboard.

- Use a calm, trustworthy healthcare visual direction.

- Do not create or modify any database tables.

- Do not generate a new database schema.

- Do not enable Lovable Cloud.

- Do not implement authentication yet.

- Do not add mock medical recommendations or diagnosis content.

- We will connect an existing external Supabase project after this scaffold is created.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bece607d-5b5e-43b4-8cc9-69fae539ac13).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
