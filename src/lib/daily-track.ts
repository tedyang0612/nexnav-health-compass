/**
 * P09 Daily Track — 型別、鎖定文案、驗證與 payload mapping。
 * 內容僅為使用者自述紀錄，不含任何醫療判斷。
 */

import { LIFE_CONTEXT_FIELDS, type LifeContextKey } from "@/lib/event-wizard";

export { LIFE_CONTEXT_FIELDS };
export type { LifeContextKey };

/** Daily Track 專用：只描述「今天」，不得沿用初次紀錄的「最近 7 天」文案。 */
export const DAILY_FREQUENCY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "目前沒有發生" },
  { value: 2, label: "偶爾出現" },
  { value: 3, label: "反覆出現" },
  { value: 4, label: "多數時間出現" },
  { value: 5, label: "幾乎一直發生" },
];

export const SUBJECTIVE_CHANGE_VALUES = [
  "much_better",
  "slightly_better",
  "no_clear_change",
  "slightly_worse",
  "much_worse",
] as const;

export type SubjectiveChange = (typeof SUBJECTIVE_CHANGE_VALUES)[number];

export const SUBJECTIVE_CHANGE_OPTIONS: {
  value: SubjectiveChange;
  label: string;
}[] = [
  { value: "much_better", label: "改善很多" },
  { value: "slightly_better", label: "好一點" },
  { value: "no_clear_change", label: "差不多" },
  { value: "slightly_worse", label: "差一點" },
  { value: "much_worse", label: "加重" },
];

export function isSubjectiveChange(value: unknown): value is SubjectiveChange {
  return (
    typeof value === "string" && (SUBJECTIVE_CHANGE_VALUES as readonly string[]).includes(value)
  );
}

export const NOTES_MAX = 1000;
export const FREQ_DESC_MAX = 200;
export const SUGGESTION_MAX = 3;

export type DailyLifeContext = {
  sleep: number;
  diet: number;
  activity: number;
  stress: number;
};

export type DailyTrackFormValues = {
  severity: number | null;
  frequencyLevel: number | null;
  frequencyDescription: string;
  subjectiveChange: SubjectiveChange | null;
  sleep: number | null;
  diet: number | null;
  activity: number | null;
  stress: number | null;
  suggestionExecution: string[];
  notes: string;
};

/** 新增模式預設值。修改模式一律使用 DB 原值。 */
export function createEmptyDailyTrackForm(): DailyTrackFormValues {
  return {
    severity: null,
    frequencyLevel: null,
    frequencyDescription: "",
    subjectiveChange: null,
    sleep: null,
    diet: null,
    activity: null,
    stress: null,
    suggestionExecution: [],
    notes: "",
  };
}

export type ParsedDailyTrack = {
  id: string;
  guideId: string | null;
  trackDate: string;
  values: DailyTrackFormValues;
};

export class DailyTrackParseError extends Error {
  constructor(message = "invalid_daily_track_row") {
    super(message);
    this.name = "DailyTrackParseError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function intInRange(value: unknown, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new DailyTrackParseError("invalid_number");
  }
  return value;
}

function parseLifeContext(value: unknown): DailyLifeContext {
  if (!isRecord(value)) throw new DailyTrackParseError("invalid_life_context");
  return {
    sleep: intInRange(value["sleep"], 1, 5),
    diet: intInRange(value["diet"], 1, 5),
    activity: intInRange(value["activity"], 1, 5),
    stress: intInRange(value["stress"], 1, 5),
  };
}

function parseSuggestionExecution(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) throw new DailyTrackParseError("invalid_suggestion_execution");
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || item.trim() === "") {
      throw new DailyTrackParseError("invalid_suggestion_code");
    }
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

/** 不使用 unchecked assertion；所有 Supabase JSON 欄位皆做 runtime 驗證。 */
export function parseDailyTrackRow(row: unknown): ParsedDailyTrack {
  if (!isRecord(row)) throw new DailyTrackParseError();
  const id = row["id"];
  const trackDate = row["track_date"];
  if (typeof id !== "string" || typeof trackDate !== "string") {
    throw new DailyTrackParseError();
  }
  const guideIdRaw = row["guide_id"];
  const guideId = typeof guideIdRaw === "string" ? guideIdRaw : null;

  const subjective = row["subjective_change"];
  if (!isSubjectiveChange(subjective)) {
    throw new DailyTrackParseError("invalid_subjective_change");
  }
  const life = parseLifeContext(row["life_context"]);
  const freqDesc = row["frequency_description"];
  const notes = row["notes"];

  return {
    id,
    guideId,
    trackDate,
    values: {
      severity: intInRange(row["severity"], 1, 10),
      frequencyLevel: intInRange(row["frequency_level"], 1, 5),
      frequencyDescription: typeof freqDesc === "string" ? freqDesc : "",
      subjectiveChange: subjective,
      sleep: life.sleep,
      diet: life.diet,
      activity: life.activity,
      stress: life.stress,
      suggestionExecution: parseSuggestionExecution(row["suggestion_execution"]),
      notes: typeof notes === "string" ? notes : "",
    },
  };
}

export type DailyTrackField =
  | "severity"
  | "frequencyLevel"
  | "frequencyDescription"
  | "subjectiveChange"
  | LifeContextKey
  | "suggestionExecution"
  | "notes";

export const DAILY_TRACK_FIELD_ORDER: DailyTrackField[] = [
  "severity",
  "frequencyLevel",
  "frequencyDescription",
  "subjectiveChange",
  "sleep",
  "diet",
  "activity",
  "stress",
  "suggestionExecution",
  "notes",
];

export type DailyTrackErrors = Partial<Record<DailyTrackField, string>>;

export function validateDailyTrack(
  values: DailyTrackFormValues,
  allowedSuggestionCodes: string[],
): DailyTrackErrors {
  const errors: DailyTrackErrors = {};

  if (
    values.severity === null ||
    !Number.isInteger(values.severity) ||
    values.severity < 1 ||
    values.severity > 10
  ) {
    errors.severity = "請選擇困擾程度";
  }

  if (
    values.frequencyLevel === null ||
    !Number.isInteger(values.frequencyLevel) ||
    values.frequencyLevel < 1 ||
    values.frequencyLevel > 5
  ) {
    errors.frequencyLevel = "請選擇發生頻率";
  }


  if (values.frequencyDescription.trim().length > FREQ_DESC_MAX) {
    errors.frequencyDescription = `補充描述最多${FREQ_DESC_MAX}個字元`;
  }

  if (!isSubjectiveChange(values.subjectiveChange)) {
    errors.subjectiveChange = "請選擇和前一次相比的感受";
  }

  for (const field of LIFE_CONTEXT_FIELDS) {
    const v = values[field.key];
    if (v === null || !Number.isInteger(v) || v < 1 || v > 5) {
      errors[field.key] = "請完成四項生活狀況";
    }
  }

  const codes = values.suggestionExecution;
  if (codes.length > SUGGESTION_MAX) {
    errors.suggestionExecution = `最多勾選 ${SUGGESTION_MAX} 項`;
  } else if (new Set(codes).size !== codes.length) {
    errors.suggestionExecution = "選項重複，請重新選擇";
  } else if (codes.some((code) => !allowedSuggestionCodes.includes(code))) {
    errors.suggestionExecution = "選項已失效，請重新選擇";
  }

  if (values.notes.trim().length > NOTES_MAX) {
    errors.notes = `補充紀錄最多${NOTES_MAX}個字元`;
  }

  return errors;
}

export function buildDailyLifeContext(values: DailyTrackFormValues): DailyLifeContext {
  return {
    sleep: values.sleep as number,
    diet: values.diet as number,
    activity: values.activity as number,
    stress: values.stress as number,
  };
}

/** INSERT/UPDATE 共用的可寫欄位。track_date 一律交由 DB default（Asia/Taipei）。 */
export function buildDailyTrackWritablePayload(values: DailyTrackFormValues) {
  if (values.severity === null || values.frequencyLevel === null) {
    throw new Error("invalid_daily_track_required_values");
  }

  const freqDesc = values.frequencyDescription.trim();
  const notes = values.notes.trim();
  return {
    severity: values.severity,
    frequency_level: values.frequencyLevel,
    frequency_description: freqDesc === "" ? null : freqDesc,
    subjective_change: values.subjectiveChange as SubjectiveChange,
    life_context: buildDailyLifeContext(values),
    suggestion_execution: values.suggestionExecution,
    notes: notes === "" ? null : notes,
  };
}

export function isDailyTrackDirty(
  values: DailyTrackFormValues,
  baseline: DailyTrackFormValues,
): boolean {
  return JSON.stringify(values) !== JSON.stringify(baseline);
}
