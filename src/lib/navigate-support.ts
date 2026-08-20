/**
 * P11 就醫與專業協助 — 靜態一般性內容。
 * 這裡只有通用方向文字，不包含診斷、機率、分數或個人化醫療建議。
 */

export const NAVIGATE_DISCLAIMER =
  "本頁提供一般性的就醫與專業協助方向，不構成醫療診斷，也不能取代專業人員的實際評估。";

export const START_POINTS: string[] = [
  "持續記錄症狀與困擾程度",
  "留意症狀是否持續、加重或影響日常活動",
  "整理目前紀錄，作為與專業人員溝通的參考",
  "有疑慮時尋求合適的專業評估",
];

export type SupportOption = {
  topic: string;
  people: string;
  note?: string;
};

export const SUPPORT_OPTIONS: SupportOption[] = [
  { topic: "飲食與營養問題", people: "營養師" },
  { topic: "壓力、情緒或心理適應", people: "諮商心理師／臨床心理師" },
  { topic: "用藥與保健品問題", people: "藥師" },
  {
    topic: "一般運動安排與體能訓練",
    people: "具相關資格的運動教練",
    note: "若有疼痛、受傷或復健需求，建議先尋求醫療專業評估。",
  },
  {
    topic: "姿勢不良、肌肉或關節痠痛問題",
    people: "復健科醫師／物理治療師",
    note: "若疼痛持續、加重、曾經受傷或已影響日常活動，建議先接受醫療專業評估。",
  },
];
