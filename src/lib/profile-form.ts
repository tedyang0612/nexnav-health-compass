/**
 * Profile 表單的共用契約：欄位型別、驗證、Gender 對照與 health_background 轉換。
 * 僅使用既有 profiles 欄位，不新增任何 DB 結構或 JSON key。
 */

export const GENDER_OPTIONS = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "non_binary", label: "非二元性別" },
  { value: "other", label: "其他" },
  { value: "prefer_not_to_say", label: "不願透露" },
] as const;

export type GenderValue = (typeof GENDER_OPTIONS)[number]["value"];

export const GENDER_VALUES: readonly string[] = GENDER_OPTIONS.map(
  (o) => o.value,
);

export function genderLabel(value: string | null | undefined): string {
  return GENDER_OPTIONS.find((o) => o.value === value)?.label ?? "—";
}

/** 依當年度動態計算 18～70 歲的合法出生年份（由新到舊）。 */
export function birthYearOptions(now: Date = new Date()): number[] {
  const currentYear = now.getFullYear();
  const newest = currentYear - 18;
  const oldest = currentYear - 70;
  const years: number[] = [];
  for (let y = newest; y >= oldest; y -= 1) years.push(y);
  return years;
}

export function isValidBirthYear(
  year: number | null,
  now: Date = new Date(),
): boolean {
  if (year === null || !Number.isInteger(year)) return false;
  const currentYear = now.getFullYear();
  return year <= currentYear - 18 && year >= currentYear - 70;
}

export const DISPLAY_NAME_MAX = 20;

export type HealthBackground = {
  chronic_conditions: string[];
  allergies: string[];
  medications: string[];
  other_notes: string;
};

export type ProfileFormValues = {
  displayName: string;
  birthYear: string; // select 值，空字串代表未選
  gender: string;
  chronicConditions: string;
  allergies: string;
  medications: string;
  otherNotes: string;
};

export const EMPTY_FORM: ProfileFormValues = {
  displayName: "",
  birthYear: "",
  gender: "",
  chronicConditions: "",
  allergies: "",
  medications: "",
  otherNotes: "",
};

/** 多行文字 → 去空白、去空項的陣列。 */
export function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function listToLines(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .join("\n");
}

export function buildHealthBackground(
  values: ProfileFormValues,
): HealthBackground {
  return {
    chronic_conditions: linesToList(values.chronicConditions),
    allergies: linesToList(values.allergies),
    medications: linesToList(values.medications),
    other_notes: values.otherNotes.trim(),
  };
}

type ProfileRowLike = {
  display_name: string | null;
  birth_year: number | null;
  gender: string | null;
  health_background: unknown;
};

export function profileRowToForm(row: ProfileRowLike): ProfileFormValues {
  const hb =
    row.health_background && typeof row.health_background === "object"
      ? (row.health_background as Record<string, unknown>)
      : {};

  return {
    displayName: row.display_name?.trim() ?? "",
    birthYear: row.birth_year ? String(row.birth_year) : "",
    gender:
      row.gender && GENDER_VALUES.includes(row.gender) ? row.gender : "",
    chronicConditions: listToLines(hb["chronic_conditions"]),
    allergies: listToLines(hb["allergies"]),
    medications: listToLines(hb["medications"]),
    otherNotes:
      typeof hb["other_notes"] === "string" ? hb["other_notes"].trim() : "",
  };
}

export type Step1Field = "displayName" | "birthYear" | "gender";

export type Step1Errors = Partial<Record<Step1Field, string>>;

export function validateStep1Field(
  field: Step1Field,
  values: ProfileFormValues,
  now: Date = new Date(),
): string | undefined {
  if (field === "displayName") {
    const trimmed = values.displayName.trim();
    if (trimmed.length === 0) return "請輸入顯示名稱";
    if (trimmed.length > DISPLAY_NAME_MAX)
      return `顯示名稱請控制在 ${DISPLAY_NAME_MAX} 個字元以內`;
    return undefined;
  }
  if (field === "birthYear") {
    if (!values.birthYear) return "請選擇出生年份";
    const year = Number(values.birthYear);
    if (!isValidBirthYear(Number.isNaN(year) ? null : year, now))
      return "請選擇有效的出生年份";
    return undefined;
  }
  if (!values.gender) return "請選擇性別";
  if (!GENDER_VALUES.includes(values.gender)) return "請選擇有效的性別選項";
  return undefined;
}

export const STEP1_FIELDS: Step1Field[] = [
  "displayName",
  "birthYear",
  "gender",
];

export function validateStep1(
  values: ProfileFormValues,
  now: Date = new Date(),
): Step1Errors {
  const errors: Step1Errors = {};
  for (const field of STEP1_FIELDS) {
    const message = validateStep1Field(field, values, now);
    if (message) errors[field] = message;
  }
  return errors;
}

export function formsEqual(a: ProfileFormValues, b: ProfileFormValues) {
  return (
    a.displayName.trim() === b.displayName.trim() &&
    a.birthYear === b.birthYear &&
    a.gender === b.gender &&
    linesToList(a.chronicConditions).join("\n") ===
      linesToList(b.chronicConditions).join("\n") &&
    linesToList(a.allergies).join("\n") === linesToList(b.allergies).join("\n") &&
    linesToList(a.medications).join("\n") ===
      linesToList(b.medications).join("\n") &&
    a.otherNotes.trim() === b.otherNotes.trim()
  );
}

/** 對外一律顯示安全的繁體中文訊息，不揭露技術細節。 */
export const SAVE_ERROR_MESSAGE =
  "儲存時發生問題，您的內容仍保留在畫面上，請稍後再試一次。";
export const SAVE_MISSING_PROFILE_MESSAGE =
  "目前無法更新您的健康檔案，請重新登入後再試一次。";
export const SAVING_LABEL = "<儲存中>";
