# NexNav Day 7 Closeout

**Version:** v1.0  
**Date:** 2026-08-20  
**Day focus:** P10 Reassess／追蹤變化＋P11 就醫與專業協助  
**Lovable credits remaining:** 76.9  

## 1. 當天完成事項表

| 編號 | 項目 | 今日完成內容 | 狀態 |
|---:|---|---|---|
| 1 | P10 規格與資料規則 | 鎖定追蹤變化的資料門檻、台灣日期去重、最新紀錄、趨勢結論、折線圖與時間軸規則；Safety 永遠優先於 Trend。 | 完成 |
| 2 | P10 Implementation | Lovable 已完成 `/events/:eventId/reassess` 與 P10 所需的唯讀資料解析／計算。 | 完成 |
| 3 | P10 初步人工驗收 | 已驗收資料不足、單筆追蹤、目前紀錄摘要與部分手機／桌面畫面。 | 部分完成 |
| 4 | P10 跨日驗收 | 尚需在第二個不同 Asia/Taipei 日期建立 Daily Track，驗證完整趨勢、折線圖與時間軸，再集中判斷是否需要 Fix。 | 待續 |
| 5 | P11 規格凍結 | 完成 P11-A1～A17、B1～B2、C1～C6；鎖定 Safety 分流、一般行動、五類專業協助、精簡紀錄摘要、摘要入口、錯誤／權限／響應式與非診斷邊界。 | 完成 |
| 6 | P11 範圍裁決 | 採方案 A：P11 只完成就醫與專業協助頁及兩個摘要入口；摘要預覽、確認寫入、版本、歷史清單與查看頁移交 P12 Summary／Prepare。 | 完成 |
| 7 | P11 Final Consistency Audit | 查核 P10 共用邏輯、Safety fail-open、Summary 邊界、DB／RLS 禁止變更及使用者文案。 | 完成 |
| 8 | P11 Initial Implementation | 完成 `/events/:eventId/navigate`、三種 Safety 分支、一般行動、五類專業協助、精簡紀錄摘要及 `?type=medical/professional`。 | 完成 |
| 9 | P11 Initial QA | 驗證 `normal`、`priority_care`、兩個 Summary URL、Desktop 與 Mobile；`attention` 因 Safety v1.0 不產生，採程式分支驗證。 | 完成 |
| 10 | P11 Final Fix | 一次集中完成 F01～F05：紅色緊急層級、統一「專業協助」、狀態內容控制、文字層級、緊湊 mapping list。 | 完成 |
| 11 | P11 Final Acceptance | 修正後 Desktop／Mobile 的 `normal` 與 `priority_care` 全部通過；P11 正式 Completed & Closed。 | 完成 |
| 12 | Credits 管理 | P11 Initial 4.5＋Final Fix 4.6＝9.1 credits；目前剩餘 76.9 credits。 | 已記錄 |

## 2. 已完成或更新的正式文件

| 文件 | 版本 | 今日動作 | 狀態 |
|---|---|---|---|
| `Day_7_Closeout_v1.0.md` | v1.0 | 新增 Day 7 完成事項、待續項目、credits 與 Day 8 開場指令。 | 新增 |
| `P11_Lovable_Prompt_Pack_v1.0.md` | v1.0 | 保存 P11 Final Implementation Prompt、唯一一次 Final Fix Prompt、執行結果與驗收紀錄。 | 新增 |
| `05_Lovable_Prompt_Library.md` | v0.4 | 同步 P10 當前驗收狀態、P11 最終契約、執行結果、Prompt Pack 參照與 P2 polish。 | 更新 |

## 3. 今日鎖定的重要決策

- P11 最終名稱：`就醫與專業協助`。
- `normal`：顯示一般行動與五類專業協助。
- `attention`：琥珀提醒後保留一般內容；Safety v1.0 暫不產生。
- `priority_care`：隱藏一般行動與五類專業協助，只保留紅色緊急提醒、紀錄摘要、摘要入口與固定聲明。
- 五類專業協助使用緊湊 mapping list，不新增第六類填補版面。
- P11 只提供 `?type=medical`／`?type=professional` 入口，不提前實作摘要內容或寫入。
- P11 全程唯讀，不新增或修改任何 DB object。

## 4. 待續與已知限制

### P10 Release-blocking acceptance

- 在第二個不同台灣日期建立 Daily Track。
- 驗證至少兩個不同日期後才顯示趨勢結論。
- 驗證折線圖、Baseline→Current、追蹤筆數與時間軸排序。
- 將實際問題集中成最多一次 P10 Fix Prompt。

### P11 非阻斷項目

- `attention` 目前只能以程式分支驗證。
- P12 Summary／Prepare 尚未實作，`/events/:eventId/summary/new` 維持預留頁。
- priority-care 手機標題最後一字可能單獨換行，列為 P2 Demo Visual Polish。

## 5. Day 8 新聊天開場指令

```text
小G，我要繼續 NexNav Day 8。

請先承接以下狀態，不要重新規劃已完成模組：

1. P11「就醫與專業協助」已完成 Initial Implementation、唯一一次 Final Fix、Desktop／Mobile 人工驗收，狀態為 Completed & Closed。
2. P11 採方案 A：只完成兩個 Summary 入口；完整 Summary／Prepare 是下一個模組。
3. P10「追蹤變化」已實作並完成部分驗收，但仍需第二個不同 Asia/Taipei 日期的 Daily Track，才能驗證完整趨勢、折線圖與時間軸；先完成這項跨日驗收，再決定是否需要最多一次 P10 Fix Prompt。
4. P12 已預先鎖定：
   - `/events/:eventId/summary/new?type=medical`
   - `/events/:eventId/summary/new?type=professional`
   - 進入建立頁才產生預覽。
   - 使用者點擊「確認正確」後才寫入。
   - 每次確認建立新版並保留舊摘要。
   - 摘要建立頁顯示「已建立的摘要」，可前往 `/summaries/:summaryId`。
   - 已結束的狀況追蹤仍可查看舊摘要及建立新版，但不得重新開啟或修改來源紀錄。
5. Day 8 先完成 P10 跨日驗收；接著進入 P12 Summary／Prepare 的內容欄位、資料 mapping、隱私勾選、預覽、確認、版本與錯誤情境規格凍結。完成 Final Consistency Audit 後，才產生一次性 Lovable Implementation Prompt。
6. Credits 規範：ChatGPT 先離線完成需求、DB contract、UI、edge cases、AC 與 Final Prompt；Lovable 只做一次 Implementation；人工驗收後，必要問題集中為最多一次 Fix Prompt。不要用 Lovable 進行零碎討論或試錯。
7. Lovable 目前剩餘 76.9 credits。每次 Lovable 執行後，都要更新剩餘額度與 burn rate。
8. 每日結束前固定提供：當天完成事項表、已完成／更新正式文件、下一天聊天開場指令（包含剩餘 credits）。

請先從 P10 第二日期追蹤驗收開始，一次只帶我完成一個畫面確認步驟。
```

## 6. Day 7 Closeout 結論

- P11 已正式關閉，不再因非阻斷視覺偏好重開。
- Day 8 第一優先是完成 P10 跨日驗收。
- P10 關閉後，立即進入 P12 Summary／Prepare 規格凍結。
- Lovable 剩餘 76.9 credits，尚未達 30-credit Burn Rate Review 門檻。
