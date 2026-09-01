import type { Database, Json } from "@/integrations/supabase/types";

export type CreateHealthEventArgs =
  Database["public"]["Functions"]["create_health_event"]["Args"];

/**
 * P05 New Health Event Wizard — 型別、鎖定文案、驗證與 payload 正規化。
 * 所有症狀內容皆來自 Seed，本檔不 hardcode 任何症狀清單。
 */

export type SymptomOption = {
  id: string;
  code: string;
  category_code: string;
  category_name: string;
  display_name: string;
  is_primary_enabled: boolean;
  is_hero_group: boolean;
  is_other: boolean;
  is_active: boolean;
  display_order: number;
};

export type DurationUnit = "minutes" | "hours" | "days" | "weeks" | "months";

export const DURATION_UNITS: { value: DurationUnit; label: string }[] = [
  { value: "minutes", label: "分鐘" },
  { value: "hours", label: "小時" },
  { value: "days", label: "天" },
];

/** 04_Screen_Spec 鎖定的頻率量表。 */
export const FREQUENCY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "過去7天約發生1次" },
  { value: 2, label: "過去7天約發生2–3次" },
  { value: 3, label: "過去7天約發生4–6次" },
  { value: 4, label: "平均每天約發生1次" },
  { value: 5, label: "平均每天2次以上，或幾乎持續出現" },
];

/** 使用者可見日期一律 YYYY/MM/DD；RPC payload 仍使用 ISO YYYY-MM-DD。 */
export function formatDisplayDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return isoDate;
  return `${match[1]}/${match[2]}/${match[3]}`;
}

export type LifeContextKey = "sleep" | "diet" | "activity" | "stress";

/** 04_Screen_Spec 鎖定的四項生活狀況文案。 */
export const LIFE_CONTEXT_FIELDS: {
  key: LifeContextKey;
  label: string;
  options: { value: number; label: string }[];
}[] = [
  {
    key: "sleep",
    label: "睡眠狀況",
    options: [
      { value: 1, label: "睡得很差，明顯影響白天精神" },
      { value: 2, label: "睡得不太好，比平常疲倦一點" },
      { value: 3, label: "和平常差不多" },
      { value: 4, label: "睡得還不錯，精神比平常好一些" },
      { value: 5, label: "睡得很好，精神狀況很好" },
    ],
  },
  {
    key: "diet",
    label: "飲食狀況",
    options: [
      { value: 1, label: "很不規律，經常少吃一餐或用餐時間差很多" },
      { value: 2, label: "有些不規律，偶爾少吃一餐或延後用餐" },
      { value: 3, label: "和平常差不多" },
      { value: 4, label: "大致規律，多數時間正常用餐" },
      { value: 5, label: "很規律，三餐時間與份量都相對穩定" },
    ],
  },
  {
    key: "activity",
    label: "活動狀況",
    options: [
      { value: 1, label: "活動量比平常少很多" },
      { value: 2, label: "活動量比平常少一些" },
      { value: 3, label: "和平常差不多" },
      { value: 4, label: "活動量比平常多一些" },
      { value: 5, label: "活動量比平常多很多" },
    ],
  },
  {
    key: "stress",
    label: "壓力感受",
    options: [
      { value: 1, label: "目前沒有什麼壓力" },
      { value: 2, label: "有一點壓力，但不太受影響" },
      { value: 3, label: "有些壓力，偶爾會受影響" },
      { value: 4, label: "壓力偏高，已明顯影響生活" },
      { value: 5, label: "壓力非常高，經常感到難以負荷" },
    ],
  },
];

export const SUPPLEMENTAL_PROMPT =
  "關於症狀還有其他想補充嗎？例如，經常發生的時間、身體反應，或其他具體描述？";

export const CREATING_LABEL = "<建立中>";
export const NOT_FILLED = "未填寫";

export type EventFormValues = {
  categoryCode: string;
  primarySymptomId: string;
  customPrimarySymptom: string;
  startedOn: string;
  severity: number;
  frequencyLevel: number | null;
  frequencyDescription: string;
  durationValue: string;
  durationUnit: DurationUnit | "";
  associatedSymptomIds: string[];
  customAssociatedSymptoms: string[];
  sleep: number | null;
  diet: number | null;
  activity: number | null;
  stress: number | null;
  supplementalDescription: string;
};

/** Asia/Taipei 的今天（YYYY-MM-DD），不依賴瀏覽器時區。 */
export function taipeiToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function createEmptyForm(): EventFormValues {
  return {
    categoryCode: "",
    primarySymptomId: "",
    customPrimarySymptom: "",
    startedOn: taipeiToday(),
    severity: 5,
    frequencyLevel: null,
    frequencyDescription: "",
    durationValue: "",
    durationUnit: "",
    associatedSymptomIds: [],
    customAssociatedSymptoms: [],
    sleep: null,
    diet: null,
    activity: null,
    stress: null,
    supplementalDescription: "",
  };
}

export function isFormDirty(values: EventFormValues): boolean {
  const base = createEmptyForm();
  return JSON.stringify({ ...values, startedOn: "" }) !==
    JSON.stringify({ ...base, startedOn: "" });
}

export type Step1Field =
  | "primarySymptomId"
  | "customPrimarySymptom"
  | "startedOn"
  | "severity"
  | "frequencyLevel"
  | "frequencyDescription"
  | "durationValue"
  | "durationUnit";

export type Step2Field = LifeContextKey | "supplementalDescription" | "customAssociatedSymptoms";

export const STEP1_FIELD_ORDER: Step1Field[] = [
  "primarySymptomId",
  "customPrimarySymptom",
  "startedOn",
  "severity",
  "frequencyLevel",
  "frequencyDescription",
  "durationValue",
  "durationUnit",
];

export const STEP2_FIELD_ORDER: Step2Field[] = [
  "customAssociatedSymptoms",
  "sleep",
  "diet",
  "activity",
  "stress",
  "supplementalDescription",
];

export type Step1Errors = Partial<Record<Step1Field, string>>;
export type Step2Errors = Partial<Record<Step2Field, string>>;

export function validateStep1(
  values: EventFormValues,
  options: SymptomOption[],
): Step1Errors {
  const errors: Step1Errors = {};
  const selected = options.find((o) => o.id === values.primarySymptomId);

  if (!values.primarySymptomId || !selected) {
    errors.primarySymptomId = "請輸入主要不適症狀";
  } else if (selected.is_other) {
    const text = values.customPrimarySymptom.trim();
    if (text.length < 1) errors.customPrimarySymptom = "請完成此欄位";
    else if (text.length > 100)
      errors.customPrimarySymptom = "自訂內容最多100個字元";
  }

  if (!values.startedOn) {
    errors.startedOn = "請完成此欄位";
  } else if (values.startedOn > taipeiToday()) {
    errors.startedOn = "開始日期不能晚於今天";
  }

  if (
    !Number.isInteger(values.severity) ||
    values.severity < 1 ||
    values.severity > 10
  ) {
    errors.severity = "請選擇目前困擾程度";
  }

  if (
    values.frequencyLevel === null ||
    !Number.isInteger(values.frequencyLevel) ||
    values.frequencyLevel < 1 ||
    values.frequencyLevel > 5
  ) {
    errors.frequencyLevel = "請選擇最近的發生頻率";
  }

  if (values.frequencyDescription.trim().length > 200) {
    errors.frequencyDescription = "補充描述最多200個字元";
  }

  const duration = Number(values.durationValue);
  if (
    values.durationValue.trim() === "" ||
    !Number.isInteger(duration) ||
    duration <= 0
  ) {
    errors.durationValue = "請填寫大於 0 的整數";
  }

  if (!values.durationUnit) errors.durationUnit = "請完成此欄位";

  return errors;
}

export function validateStep2(values: EventFormValues): Step2Errors {
  const errors: Step2Errors = {};

  for (const item of LIFE_CONTEXT_FIELDS) {
    const v = values[item.key];
    if (v === null || !Number.isInteger(v) || v < 1 || v > 5) {
      errors[item.key] = "請完成四項生活狀況";
    }
  }

  if (
    values.customAssociatedSymptoms.some((t) => t.trim().length > 100)
  ) {
    errors.customAssociatedSymptoms = "每個自訂項目最多100個字元";
  }

  if (values.supplementalDescription.trim().length > 1000) {
    errors.supplementalDescription = "補充描述最多1000個字元";
  }

  return errors;
}

export type AssociatedSymptomPayload = {
  symptom_id: string | null;
  custom_text: string | null;
};

export type LifeContextPayload = {
  sleep: number;
  diet: number;
  activity: number;
  stress: number;
};

/** 依使用者選擇順序輸出，catalog 去重、自訂文字 trim 後去重。 */
export function buildAssociatedSymptoms(
  values: EventFormValues,
): AssociatedSymptomPayload[] {
  const out: AssociatedSymptomPayload[] = [];
  const seenIds = new Set<string>();
  const seenText = new Set<string>();

  for (const id of values.associatedSymptomIds) {
    if (!id || id === values.primarySymptomId || seenIds.has(id)) continue;
    seenIds.add(id);
    out.push({ symptom_id: id, custom_text: null });
  }

  for (const raw of values.customAssociatedSymptoms) {
    const text = raw.trim();
    if (!text || seenText.has(text)) continue;
    seenText.add(text);
    out.push({ symptom_id: null, custom_text: text });
  }

  return out;
}

export function buildLifeContext(values: EventFormValues): LifeContextPayload {
  return {
    sleep: values.sleep as number,
    diet: values.diet as number,
    activity: values.activity as number,
    stress: values.stress as number,
  };
}

export function buildRpcPayload(
  values: EventFormValues,
  options: SymptomOption[],
): CreateHealthEventArgs {
  const selected = options.find((o) => o.id === values.primarySymptomId);
  const isOther = !!selected?.is_other;
  const customPrimary = isOther ? values.customPrimarySymptom.trim() : "";
  const freqDesc = values.frequencyDescription.trim();
  const supplemental = values.supplementalDescription.trim();

  const lifeContext: Json = buildLifeContext(values);
  const associatedSymptoms: Json = buildAssociatedSymptoms(values);

  return {
    p_primary_symptom_id: values.primarySymptomId,
    p_started_on: values.startedOn,
    p_severity: values.severity,
    p_frequency_level: values.frequencyLevel as number,
    p_duration_value: Number(values.durationValue),
    p_duration_unit: values.durationUnit as DurationUnit,
    p_life_context: lifeContext,
    ...(customPrimary ? { p_custom_primary_symptom: customPrimary } : {}),
    ...(freqDesc ? { p_frequency_description: freqDesc } : {}),
    p_associated_symptoms: associatedSymptoms,
    ...(supplemental ? { p_supplemental_description: supplemental } : {}),
  };
}

export type SafeErrorKind =
  | "auth"
  | "onboarding"
  | "symptom"
  | "validation"
  | "generic";

export type SafeError = {
  kind: SafeErrorKind;
  message: string;
  /** validation 時要回到的步驟。 */
  step?: 1 | 2;
};

/** 集中式安全錯誤 mapping：不外洩 SQLSTATE、資料表名或原始錯誤。 */
export function mapCreateEventError(error: unknown): SafeError {
  const raw =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";
  const text = raw.toLowerCase();

  if (text.includes("authentication required") || text.includes("jwt") || text.includes("not authenticated")) {
    return { kind: "auth", message: "登入狀態已失效，請重新登入。" };
  }
  if (text.includes("onboarding")) {
    return {
      kind: "onboarding",
      message: "請先完成基本健康檔案，才能建立狀況追蹤。",
    };
  }
  if (text.includes("symptom")) {
    return { kind: "symptom", message: "症狀選項已更新，請重新選擇。", step: 1 };
  }
  if (text.includes("started_on") || text.includes("date")) {
    return { kind: "validation", message: "開始日期不能晚於今天", step: 1 };
  }
  if (
    text.includes("severity") ||
    text.includes("frequency") ||
    text.includes("duration")
  ) {
    return { kind: "validation", message: "部分欄位不符合格式，請返回確認。", step: 1 };
  }
  if (text.includes("life_context") || text.includes("associated")) {
    return { kind: "validation", message: "部分欄位不符合格式，請返回確認。", step: 2 };
  }
  return {
    kind: "generic",
    message: "目前無法建立狀況追蹤，請稍後再試。",
  };
}
