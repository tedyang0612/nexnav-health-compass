# NexNav Health Navigator｜智慧健康導航平台
https://nexnav-health-navigator.lovable.app/

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

NexNav 並不嘗試取代醫療專業人員進行診斷，而是將零散的健康資訊整理成一條清楚的行動路徑，協助使用者從「發現不適」逐步走向「理解、追蹤、判讀與尋求適當協助」。

---

## 2. 核心理念

NexNav 的 Product Loop 為：

**Record → Understand → Decide → Act → Communicate**

實際產品流程則形成完整的 Golden Path：

**Record 記錄 → Safety 安全確認 → Guide 改善方向 → Track 每日追蹤 → Reassess 變化判讀 → Navigate 專業協助 → Prepare 建立摘要 → Connect 醫療資源**

NexNav 的核心並不是替使用者回答「我得了什麼病」，而是協助使用者釐清：

> **「我現在可以怎麼做？接下來該往哪裡走？」**

---

# 3. Golden Path

## 01｜Record — 記錄

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

## 02｜Safety — 安全確認

在進入一般健康導航流程前，先進行必要的安全風險確認。

Safety Check 採用簡潔的 Yes / No 問題，確認是否存在需要優先處理的警訊，例如：

* 嚴重呼吸困難
* 明顯胸痛或胸部壓迫感
* 突發性中風相關警訊
* 意識異常、難以喚醒或突然明顯混亂
* 其他需要優先處理的重要警訊

若偵測到重要安全警訊，系統會優先提供尋求醫療協助的行動提示，而不是繼續一般健康改善流程。

> Safety Check 僅提供一般性安全導航，不構成醫療診斷。

---

## 03｜Guide — 改善方向

依照使用者記錄的主要不適，整理一般性的健康資訊與可觀察方向。

Guide 的目的不是提供疾病診斷，而是協助使用者：

* 理解可觀察的生活因素
* 建立自我觀察方向
* 知道哪些變化值得持續記錄
* 取得可信來源的健康資訊

---

## 04｜Track — 每日追蹤

使用者可每日記錄一次健康狀況，逐步建立連續的變化資料。

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

## 05｜Reassess — 變化判讀

將每日追蹤資料轉換成較容易理解的視覺資訊。

包含：

* 症狀困擾程度趨勢
* 發生頻率變化
* Timeline 追蹤時間軸
* Safety 結果摘要
* 整體變化方向

讓使用者不只看到單日數值，而能理解一段時間內的健康變化。

---

## 06｜Navigate — 專業協助

當持續追蹤後仍需要進一步處理時，NexNav 協助使用者了解可以尋求哪些類型的專業協助。

目前涵蓋：

* 醫療院所
* 營養師
* 心理諮商師
* 藥師
* 運動教練
* 復健科醫師／物理治療師

系統提供的是「下一步導航」，而不是疾病診斷。

---

## 07｜Prepare — 建立摘要

使用者可以將累積的健康資訊整理成結構化摘要，降低就醫或專業諮詢時重新回想與描述資訊的負擔。

目前支援兩種摘要：

### Medical Summary｜就醫摘要

整理：

* 主要症狀
* 建立狀況追蹤當日資訊
* Safety 安全確認
* 困擾程度與發生頻率變化
* 每日追蹤紀錄
* 生活狀況
* 使用者補充資訊

### Professional Summary｜其他健康專業諮詢摘要

針對其他健康專業人員整理：

* 主要健康狀況
* 生活狀況
* 已嘗試的調整
* 每日追蹤紀錄
* 希望詢問的專業對象
* 希望討論的問題

摘要需經：

**Preview → 使用者確認 → 建立固定版本**

確認後採用 **Immutable Snapshot** 概念保存，不會因後續健康紀錄變動而自動修改既有摘要。

---

## 08｜Connect — 醫療資源

建立摘要後，使用者可進一步前往醫療資源導航。

Connect 的目的，是將前面的：

**記錄 → 理解 → 追蹤 → 判讀 → 準備資訊**

真正銜接到：

**尋找下一步可採取的專業行動。**

目前 MVP / Demo 階段支援附近醫療資源的搜尋與導航體驗。

---

# 4. Dashboard｜狀況總覽

Dashboard 是 NexNav 的主要操作中心。

每一個進行中的狀況追蹤會以 Event Card 呈現，包括：

* 症狀名稱與識別 Icon
* 開始追蹤日期
* 累積追蹤資訊
* Golden Path 目前進度
* Safety 狀態
* 建議下一步
* 動態 CTA

系統會依 Event 目前進度自動提供下一步，例如：

* 完成目前狀況確認
* 查看改善方向
* 開始今日追蹤
* 查看追蹤變化
* 查看專業協助

降低使用者自行判斷「下一頁該去哪裡」的操作負擔。

---

# 5. 帳號與個人資料

MVP 已建立基本帳號與個人資料流程，包括：

* Register 註冊
* Login 登入
* Onboarding 初始設定
* Profile 個人資料
* 基本健康背景

Authentication 與使用者資料串接既有外部 **Supabase** 專案。

---

# 6. 資料與安全設計

NexNav 以「健康狀況 Event」作為核心資料單位。

主要資料包含：

* User Profile
* Health Background
* Health Event
* Safety Check
* Guide
* Daily Track
* Reassess
* Summary

資料庫採用 Supabase，並搭配：

* Authentication
* PostgreSQL
* Row Level Security（RLS）
* Database Index
* Trigger
* 資料唯一性限制
* Immutable Snapshot

維持不同使用者之間的資料隔離，以及健康追蹤紀錄的一致性。

---

# 7. Responsive UI / UX

NexNav 採用 Responsive Web Design，同時支援：

* Desktop
* Mobile

主要視覺方向：

* 青綠至藍色健康科技品牌色
* 白色與冷色系背景
* 清楚的卡片資訊層級
* 症狀識別 Icon
* Golden Path 視覺導航
* 語意化 Safety 狀態
* Responsive Layout
* 行動裝置資訊密度優化

---

# 8. 技術架構

## Frontend

* React
* TypeScript
* Responsive Web Design
* Component-based UI Architecture

## Backend / Database

* Supabase
* Supabase Authentication
* PostgreSQL
* Row Level Security（RLS）

## Development Workflow

* Lovable
* GitHub
* Git Branch
* Pull Request Workflow

---

# 9. P0 MVP Status

| 模組            | 功能                             | 狀態             |
| ------------- | ------------------------------ | -------------- |
| Account       | Login / Register               | Completed      |
| Onboarding    | 基本資料與健康背景                      | Completed      |
| Profile       | 個人資料管理                         | Completed      |
| Record        | 建立健康狀況追蹤                       | Completed      |
| Safety        | 安全警訊確認                         | Completed      |
| Guide         | 改善與觀察方向                        | Completed      |
| Track         | 每日健康追蹤                         | Completed      |
| Reassess      | 趨勢與變化判讀                        | Completed      |
| Navigate      | 專業協助導航                         | Completed      |
| Prepare       | Medical / Professional Summary | Completed      |
| Connect       | 附近醫療資源導航                       | MVP / Demo     |
| Dashboard     | 多 Event 狀況總覽                   | Completed      |
| Responsive UI | Desktop / Mobile               | Completed      |
| PDF Export    | 摘要列印／PDF 輸出                    | Final Addendum |

---

# 10. P0 Final Addendum｜MVP 最終收尾

核心 Golden Path 已完成，目前進入 **P0 Final Addendum**。

此階段不重新擴張 MVP 功能範圍，而是針對正式 Demo 與 MVP 封版前發現的最後問題進行修正。

## PDF / Mobile Export Final Fix

### Mobile PDF Content Integrity

修正行動裝置透過原生列印／PDF 流程輸出摘要時可能發生的內容截斷問題。

驗收目標：

* 完整輸出 Summary Snapshot
* 完整輸出 Health Background
* 完整輸出 Disclaimer
* 不因 Desktop / Mobile 列印環境差異造成內容遺失

### PDF Filename Consistency

統一不同摘要類型的 PDF 檔案名稱，使下載／儲存後仍能辨識摘要用途與版本。

### Summary → Connect Handoff

摘要完成後，強化下一步前往醫療資源的資訊銜接。

預計採用：

**下一步｜尋找醫療資源**

> 摘要已準備完成，你可以接著查看附近的醫療與專業協助資源。

CTA：

**查看附近醫療資源**

讓 Prepare 不停留在「摘要已完成」，而能自然進入 Connect。

---

# 11. Professional Summary Information Hierarchy Enhancement

P0 Final Addendum 完成後，將進一步優化 **Professional Summary｜其他健康專業諮詢摘要** 的資訊層級。

此項調整不改變既有 Snapshot 與資料邏輯，主要改善資訊閱讀順序與專業溝通效率。

優化方向包含：

* 強化摘要最重要資訊的優先層級
* 改善生活狀況與追蹤資料的閱讀順序
* 強化「已嘗試的調整」資訊呈現
* 提升「詢問對象」與「希望討論問題」的辨識度
* 降低資訊量較大時的閱讀負擔
* 維持 Medical Summary 與 Professional Summary 的用途差異

目標是讓不同健康專業人員能更快掌握：

**目前狀況 → 已觀察到的變化 → 已嘗試的行動 → 使用者希望討論的問題**

---

# 12. Future Roadmap

P0 MVP 封版後，後續功能依優先度分為 **P1 近期優化**與 **P2 產品延伸**。

---

## P1｜近期優化

P1 聚焦於「讓現有 MVP 更穩定、更完整、更適合實際持續使用」。

### 1. Login Stability & Third-party Login UI

* 提升登入流程穩定性
* 改善登入錯誤處理
* 完善第三方登入介面與體驗

### 2. Reminder / Notification

建立健康追蹤提醒機制，例如：

* 每日追蹤提醒
* 尚未完成追蹤提示
* 重新評估提醒
* 重要流程節點通知

降低使用者中斷健康追蹤的機率。

### 3. Summary Export Enhancement

持續完善摘要輸出與分享：

* PDF Export
* Mobile Share Flow
* 檔名與版本管理
* 跨裝置輸出一致性

### 4. More Symptoms & Body-area Entry Points

擴充目前 7+1 症狀入口，逐步增加：

* 更多常見症狀
* 身體部位入口
* 更容易找到適合的健康追蹤分類

### 5. Health Documents Lite

建立安全的健康文件上傳能力，例如：

* 健康檢查報告
* 基本健康文件
* 使用者自行保存的健康資料

P1 階段以「安全保存與使用者控制」為主，不直接讓系統自行判定醫療結果。

---

## P2｜產品延伸

P2 聚焦於「從使用者自行記錄，延伸到更多健康資料來源與真實服務串接」。

### 1. Health Document OCR

針對健檢報告等文件加入 OCR 資訊擷取能力。

流程原則：

**Upload → OCR → Preview → User Confirmation → Save**

系統自動擷取的健康資訊不得直接寫入正式健康紀錄，必須由使用者確認。

### 2. Wearable / Health Data Integration

逐步整合外部健康資料來源，例如：

* 穿戴式裝置
* 活動數據
* 睡眠資料
* 健康檢查資訊

讓使用者不必完全依賴手動輸入建立健康趨勢。

### 3. Real-world Healthcare Connection

將目前 Connect 從導航體驗進一步延伸至真實服務：

* 醫療院所
* 掛號
* 預約
* 健康專業人員媒合

逐步形成從健康紀錄到實際專業服務的完整閉環。

### 4. Health History

將不同 Health Event 累積成長期個人健康歷史，協助使用者理解：

* 過去曾發生的健康狀況
* 不同時期的變化
* 曾採取過的改善方式
* 過去建立的摘要與專業協助紀錄

### 5. Feedback & Experience Layer

逐步建立：

* 使用者回饋
* 行動結果紀錄
* 經驗分享
* 產品改善資料

讓 NexNav 從單次健康導航工具，逐步發展成長期個人健康管理平台。

---

# 13. Product Development Principle

NexNav 對於未來的健康資料自動化功能，遵循：

> **Preview → User Confirmation → Save**

無論是：

* OCR 擷取
* 健檢資料
* 穿戴裝置資料
* 自動產生的健康摘要

只要涉及將自動整理或擷取的資訊寫入正式健康紀錄，都應優先讓使用者知道系統取得了什麼資訊，並由使用者確認後再正式保存。

---

# 14. 產品定位與邊界

NexNav 並非：

* AI 醫師
* 線上診斷工具
* 疾病預測工具
* 醫療專業人員的替代方案

NexNav 的定位是：

> **Personal Health Navigation Platform｜個人健康導航平台**

平台的核心任務不是提供診斷，而是降低使用者面對健康問題時的資訊混亂與行動不確定性。

---

# 15. 醫療聲明

> **NexNav 提供一般性健康資訊與行動導航，內容不構成醫療診斷，亦不能取代專業醫療評估。**

如出現嚴重、快速惡化或可能危及生命的症狀，應立即尋求適當的緊急醫療協助。

---

# 16. Current Project Status

**NexNav P0 MVP — Demo Ready / Final Addendum in Progress**

目前核心 Golden Path 已完成：

**Record → Safety → Guide → Track → Reassess → Navigate → Prepare → Connect**

目前開發重點：

**P0 Final Addendum**
↓
**Professional Summary Information Hierarchy Enhancement**
↓
**P0 Closeout / MVP Freeze**
↓
**P1 近期優化**
↓
**P2 產品延伸**

---

## Project Stage

`P0 MVP`　██████████　Core Completed
`Final Addendum`　████████░░　In Progress
`P1`　░░░░░░░░░░　Planned
`P2`　░░░░░░░░░░　Future

---

**NexNav**

**不是取代醫療判斷，而是提升自主健康管理意識。**

*From uncertainty to the next step.*

---
