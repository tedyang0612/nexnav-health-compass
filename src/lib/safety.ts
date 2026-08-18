/**
 * NexNav Safety Content v1.0（P06）。
 * 這裡只定義題目文案與送出用的答案鍵值；
 * Safety 結果一律由後端 RPC 判定，前端不得計算或送出 result。
 */

export const SAFETY_ANSWER_KEYS = [
  "severe_breathing_difficulty",
  "significant_chest_discomfort",
  "stroke_warning_signs",
  "consciousness_change",
  "other_emergency_signs",
] as const;

export type SafetyAnswerKey = (typeof SAFETY_ANSWER_KEYS)[number];

export type SafetyAnswers = Record<SafetyAnswerKey, boolean>;

export type SafetyAnswerDraft = Partial<Record<SafetyAnswerKey, boolean>>;

export type SafetyQuestion = {
  key: SafetyAnswerKey;
  label: string;
  question: string;
  helper?: string;
  helperItems?: string[];
};

export const SAFETY_QUESTIONS: SafetyQuestion[] = [
  {
    key: "severe_breathing_difficulty",
    label: "呼吸",
    question: "你目前是否有明顯或嚴重的呼吸困難？",
    helper: "例如喘不過氣、呼吸非常吃力，或因呼吸困難而難以正常說話。",
  },
  {
    key: "significant_chest_discomfort",
    label: "胸部不適",
    question: "你目前是否有明顯的胸痛、胸悶或胸部壓迫感？",
    helper: "特別是症狀明顯、持續，或伴隨呼吸困難、冒冷汗、暈眩等情況。",
  },
  {
    key: "stroke_warning_signs",
    label: "疑似中風警訊",
    question: "你是否突然出現以下任一情況？",
    helperItems: [
      "單側臉部歪斜",
      "單側手腳明顯無力或麻木",
      "說話突然含糊、異常或難以表達",
    ],
  },
  {
    key: "consciousness_change",
    label: "意識狀態",
    question: "你目前是否有失去意識、難以喚醒，或突然明顯意識混亂的情況？",
  },
  {
    key: "other_emergency_signs",
    label: "其他明顯危急狀況",
    question:
      "你目前是否有其他讓你覺得情況嚴重或快速惡化，需要立即協助的狀況？",
    helper:
      "例如大量且難以止住的出血、嚴重過敏反應，或其他明顯危及安全的情況。",
  },
];

export function answeredCount(draft: SafetyAnswerDraft): number {
  return SAFETY_ANSWER_KEYS.filter((k) => typeof draft[k] === "boolean").length;
}

export function isComplete(draft: SafetyAnswerDraft): draft is SafetyAnswers {
  return answeredCount(draft) === SAFETY_ANSWER_KEYS.length;
}

/** 只組出五個核准的 boolean 欄位，絕不包含 result / user_id / revision 等欄位。 */
export function buildAnswersPayload(answers: SafetyAnswers): SafetyAnswers {
  return {
    severe_breathing_difficulty: answers.severe_breathing_difficulty,
    significant_chest_discomfort: answers.significant_chest_discomfort,
    stroke_warning_signs: answers.stroke_warning_signs,
    consciousness_change: answers.consciousness_change,
    other_emergency_signs: answers.other_emergency_signs,
  };
}

export type SafetyResult = "normal" | "priority_care" | "attention";

export function isKnownResult(value: unknown): value is SafetyResult {
  return (
    value === "normal" || value === "priority_care" || value === "attention"
  );
}
