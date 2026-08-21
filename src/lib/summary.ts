/**
 * P12 Prepare — 摘要建立與 Ready Summary 顯示契約。
 * 所有正式內容一律由 confirm_health_summary RPC 於伺服器端組裝，
 * 前端僅負責選取、預覽與呈現既有 Snapshot。
 */

export const SUMMARY_TYPES = ["medical", "professional_support"] as const;
export type SummaryType = (typeof SUMMARY_TYPES)[number];

export function isSummaryType(value: unknown): value is SummaryType {
  return typeof value === "string" && (SUMMARY_TYPES as readonly string[]).includes(value);
}

/** 網址 search param → 內部 summary type。 */
export function summaryTypeFromSearch(value: unknown): SummaryType {
  if (value === "professional" || value === "professional_support") return "professional_support";
  return "medical";
}

export const SUMMARY_TYPE_LABEL: Record<SummaryType, string> = {
  medical: "醫療溝通摘要",
  professional_support: "其他健康專業諮詢摘要",
};

export const SUMMARY_TYPE_DESCRIPTION: Record<SummaryType, string> = {
  medical: "整理症狀、安全確認與追蹤變化，方便就醫時溝通。",
  professional_support: "整理生活狀況、已嘗試的調整與追蹤紀錄，方便與其他健康專業人員討論。",
};

/** 可選填私人資訊區塊上方的固定說明文字。 */
export const PRIVACY_COPY_LINES = [
  "以下資訊預設不會帶入。",
  "只有你勾選的內容會出現在這份摘要中，不會修改個人資料或其他版本。",
] as const;

export const SUMMARY_DISCLAIMER: Record<SummaryType, string> = {
  medical:
    "本摘要依使用者自行記錄的資訊整理，僅供就醫溝通參考，不構成醫療診斷，也不能取代醫療人員的實際評估。",
  professional_support:
    "本摘要整理使用者自行記錄的資訊，不構成醫療診斷，也不能取代專業人員的實際評估。",
};

export const TARGET_PROFESSIONALS = [
  { value: "nutritionist", label: "營養師" },
  { value: "psychologist", label: "諮商心理師／臨床心理師" },
  { value: "pharmacist", label: "藥師" },
  { value: "fitness_coach", label: "具相關資格的運動教練" },
  { value: "rehab_physio", label: "復健科醫師／物理治療師" },
  { value: "undecided", label: "尚未確定" },
] as const;

export type TargetProfessional = (typeof TARGET_PROFESSIONALS)[number]["value"];

export const HEALTH_BACKGROUND_KEYS = [
  { value: "chronic_conditions", label: "慢性病或長期健康狀況" },
  { value: "allergies", label: "過敏史" },
  { value: "medications", label: "目前用藥或保健品" },
  { value: "other_notes", label: "其他補充" },
] as const;

export type HealthBackgroundKey = (typeof HEALTH_BACKGROUND_KEYS)[number]["value"];

export const QUESTION_MAX_LENGTH = 200;
export const QUESTION_MAX_COUNT = 3;

export function normalizeQuestions(values: string[]): string[] {
  return values.map((v) => v.trim()).filter((v) => v.length > 0);
}

export function validateQuestions(values: string[]): string | undefined {
  const trimmed = normalizeQuestions(values);
  if (trimmed.length > QUESTION_MAX_COUNT) return `最多只能列出 ${QUESTION_MAX_COUNT} 個問題`;
  if (trimmed.some((v) => v.length > QUESTION_MAX_LENGTH))
    return `每個問題請控制在 ${QUESTION_MAX_LENGTH} 個字元以內`;
  return undefined;
}

/** RPC 錯誤代碼 → 使用者可理解的繁體中文訊息。 */
export function summaryErrorMessage(raw: unknown): string {
  const message = typeof raw === "string" ? raw : ((raw as { message?: string })?.message ?? "");
  if (message.includes("SAFETY_NOT_AVAILABLE"))
    return "需要先完成最新的安全確認，才能建立摘要。";
  if (message.includes("PROFESSIONAL_SUPPORT_BLOCKED_BY_SAFETY"))
    return "目前的安全確認結果建議優先尋求醫療協助，暫時無法建立其他健康專業諮詢摘要。";
  if (message.includes("SOURCE_CHANGED"))
    return "你的紀錄在預覽後有更新，請重新整理預覽內容再確認一次。";
  if (message.includes("INVALID_TRACK_SELECTION"))
    return "選取的每日追蹤備註已不存在，請重新選擇。";
  if (message.includes("TOO_MANY_QUESTIONS") || message.includes("INVALID_QUESTIONS"))
    return "想問的問題格式不正確，請確認每則不超過 200 字，且最多 3 則。";
  if (message.includes("TARGET_PROFESSIONAL_REQUIRED")) return "請先選擇想諮詢的對象。";
  if (message.includes("INVALID_TARGET_PROFESSIONAL")) return "諮詢對象選項無效，請重新選擇。";
  if (message.includes("EVENT_NOT_AVAILABLE") || message.includes("INITIAL_RECORD_NOT_AVAILABLE"))
    return "找不到這筆狀況紀錄，請返回後再試一次。";
  return "建立摘要時發生問題，請稍後再試一次。";
}

/* ---------- Snapshot 顯示型別（唯讀） ---------- */

export type SnapshotLabelled = { code: string; label: string };

export type SnapshotAction = { code: string; title: string; description?: string | null };

export type SnapshotTrack = {
  track_id: string;
  track_date: string;
  severity: number;
  frequency_level: number;
  frequency_label?: string | null;
  frequency_description?: string | null;
  subjective_change: string;
  subjective_change_label?: string | null;
  life_context?: Record<string, number> | null;
  actions_tried?: SnapshotAction[];
};

export type SnapshotNote = { track_id: string; track_date: string; notes: string };

export type SummarySnapshot = {
  schema_version?: string;
  summary_type: SummaryType;
  summary_type_label: string;
  disclaimer: string;
  questions?: string[];
  target_professional?: { value: string; label: string } | null;
  event: {
    health_event_id: string;
    started_on: string;
    status: string;
    primary_symptom_label?: string | null;
    custom_primary_symptom?: string | null;
  };
  initial_record: {
    revision: number;
    severity: number;
    frequency_level: number;
    frequency_label?: string | null;
    frequency_description?: string | null;
    duration_value: number;
    duration_unit: string;
    duration_unit_label?: string | null;
    associated_symptoms?: { label: string | null }[];
    life_context?: Record<string, number> | null;
    supplemental_description?: string | null;
  };
  life_context_labels?: Record<string, string>;
  daily_tracks?: SnapshotTrack[];
  selected_track_notes?: SnapshotNote[];
  latest_track_date?: string | null;
  safety: {
    safety_assessment_id: string;
    result: string;
    result_label?: string | null;
    assessed_at?: string | null;
    assessed_on?: string | null;
    rule_version?: string | null;
    record_revision?: number | null;
    warnings?: SnapshotLabelled[];
  };
  health_background?: { code: string; label: string; content: unknown }[];
  generated_at?: string;
};

export function formatTaipeiDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.length <= 10 ? `${value}T00:00:00+08:00` : value);
  if (Number.isNaN(date.getTime())) return "—";
  const parts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}/${get("month")}/${get("day")}`;
}

/** 安全確認顯示句：於 YYYY/MM/DD 完成平台安全確認，當時未勾選所列緊急警訊。 */
export function safetySentence(safety: SummarySnapshot["safety"]): string {
  const date = formatTaipeiDate(safety.assessed_on ?? safety.assessed_at ?? null);
  const hasWarnings = (safety.warnings?.length ?? 0) > 0;
  return hasWarnings
    ? `於 ${date} 完成平台安全確認，當時勾選了下列需要留意的警訊。`
    : `於 ${date} 完成平台安全確認，當時未勾選所列緊急警訊。`;
}

export function backgroundContentToText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content))
    return content
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim())
      .filter(Boolean)
      .join("、");
  return "";
}

/* ---------- 顯示用對照表與衍生指標 ---------- */

export const FREQUENCY_LABELS: Record<number, string> = {
  1: "目前沒有發生",
  2: "偶爾出現",
  3: "反覆出現",
  4: "多數時間出現",
  5: "幾乎一直發生",
};

export const SUBJECTIVE_LABELS: Record<string, string> = {
  much_better: "改善很多",
  slightly_better: "好一點",
  no_clear_change: "差不多",
  slightly_worse: "差一點",
  much_worse: "加重",
};

export const DURATION_UNIT_LABELS: Record<string, string> = {
  minutes: "分鐘",
  hours: "小時",
  days: "天",
  weeks: "週",
  months: "個月",
};

export function frequencyLabel(level?: number | null): string | null {
  if (typeof level !== "number") return null;
  return FREQUENCY_LABELS[level] ?? null;
}

export function subjectiveLabel(value?: string | null): string | null {
  if (!value) return null;
  return SUBJECTIVE_LABELS[value] ?? value;
}

export const MISMATCH_NOTICE = "數字紀錄與主觀感受可能呈現不同方向，建議一併參考。";

export type SummaryStats = {
  trackCount: number;
  hasTracks: boolean;
  initialSeverity: number;
  latestSeverity: number;
  severityFromTrack: boolean;
  earliestFrequency: number | null;
  latestFrequency: number | null;
  latestSubjective: string | null;
  latestSubjectiveLabel: string | null;
  firstTrackDate: string | null;
  latestTrackDate: string | null;
  mismatch: boolean;
};

const BETTER = new Set(["much_better", "slightly_better"]);
const WORSE = new Set(["much_worse", "slightly_worse"]);

/** 由 Snapshot（預覽或已保存皆同一格式）計算摘要關鍵指標。 */
export function deriveSummaryStats(snapshot: SummarySnapshot): SummaryStats {
  const tracks = [...(snapshot.daily_tracks ?? [])].sort((a, b) =>
    a.track_date.localeCompare(b.track_date),
  );
  const first = tracks[0] ?? null;
  const last = tracks[tracks.length - 1] ?? null;
  const initialSeverity = snapshot.initial_record.severity;
  const latestSeverity = last ? last.severity : initialSeverity;
  const latestSubjective = last?.subjective_change ?? null;

  const delta = latestSeverity - initialSeverity;
  const mismatch =
    !!latestSubjective &&
    ((BETTER.has(latestSubjective) && delta > 0) || (WORSE.has(latestSubjective) && delta < 0));

  return {
    trackCount: tracks.length,
    hasTracks: tracks.length > 0,
    initialSeverity,
    latestSeverity,
    severityFromTrack: !!last,
    earliestFrequency: first?.frequency_level ?? null,
    latestFrequency: last?.frequency_level ?? null,
    latestSubjective,
    latestSubjectiveLabel: subjectiveLabel(latestSubjective),
    firstTrackDate: first?.track_date ?? null,
    latestTrackDate: last?.track_date ?? snapshot.latest_track_date ?? null,
    mismatch,
  };
}

/** 平台安全確認的固定敘述（priority_care 為兩行鎖定文案）。 */
export function safetyLines(safety: SummarySnapshot["safety"]): string[] {
  const date = formatTaipeiDate(safety.assessed_on ?? safety.assessed_at ?? null);
  if (safety.result === "priority_care") {
    return [
      `於 ${date} 完成平台安全確認，當時有勾選需要優先尋求醫療協助的警訊。`,
      "當時系統建議優先尋求醫療專業協助；若目前情況緊急或快速惡化，請立即撥打 119 或前往就近急診。",
    ];
  }
  if ((safety.warnings?.length ?? 0) > 0) {
    return [`於 ${date} 完成平台安全確認，當時勾選了下列需要留意的警訊。`];
  }
  return [`於 ${date} 完成平台安全確認，當時未勾選所列緊急警訊。`];
}
