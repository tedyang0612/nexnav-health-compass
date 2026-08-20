/**
 * P10 追蹤變化（Reassess）— 純前端唯讀計算。
 * 只使用既有資料表欄位，不寫回任何計算結果，也不產生任何醫療判斷。
 */

import {
  DAILY_FREQUENCY_OPTIONS,
  SUBJECTIVE_CHANGE_OPTIONS,
  isSubjectiveChange,
  type SubjectiveChange,
} from "@/lib/daily-track";

export type SafetyResultValue = "normal" | "attention" | "priority_care";

export type ReassessEvent = {
  id: string;
  status: string;
  startedOn: string;
  symptomName: string;
};

export type ReassessInitialRecord = {
  id: string;
  revision: number;
  severity: number;
  frequencyLevel: number;
  createdAt: string;
};

export type ReassessTrack = {
  id: string;
  trackDate: string;
  severity: number;
  frequencyLevel: number;
  subjectiveChange: SubjectiveChange | null;
  notes: string | null;
  createdAt: string;
};

export type ReassessSafety = {
  id: string;
  result: SafetyResultValue;
  recordRevision: number;
  occurredAt: string;
};

export const MIN_TRACKS_FOR_TREND = 2;

export function frequencyLabel(level: number): string {
  return DAILY_FREQUENCY_OPTIONS.find((o) => o.value === level)?.label ?? "—";
}

export function subjectiveLabel(value: SubjectiveChange | null): string {
  if (!value) return "—";
  return SUBJECTIVE_CHANGE_OPTIONS.find((o) => o.value === value)?.label ?? "—";
}

export function isSafetyResult(value: unknown): value is SafetyResultValue {
  return value === "normal" || value === "attention" || value === "priority_care";
}

export function parseSubjective(value: unknown): SubjectiveChange | null {
  return isSubjectiveChange(value) ? value : null;
}

/* ---------- 日期（Asia/Taipei） ---------- */

const TAIPEI_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** timestamptz → Asia/Taipei 的 YYYY-MM-DD。 */
export function taipeiDateOf(iso: string): string {
  return TAIPEI_DATE.format(new Date(iso));
}

/** YYYY-MM-DD → 顯示用（2026/08/20）。不直接切 UTC 字串。 */
export function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${y}/${m}/${d}`;
}

/** YYYY-MM-DD → 短標籤（8/20）。 */
export function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  if (!m || !d) return dateStr;
  return `${Number(m)}/${Number(d)}`;
}

/** YYYY-MM-DD → 用於等距 X 軸的數值（UTC 正午避免時區偏移）。 */
export function dateValue(dateStr: string): number {
  return Date.parse(`${dateStr}T12:00:00Z`);
}

/* ---------- 困擾程度結論 ---------- */

export type SeverityDirection = "down" | "flat" | "up";

export type SeverityConclusion = {
  direction: SeverityDirection;
  text: string;
  initial: number;
  latest: number;
  diff: number;
};

export function buildSeverityConclusion(
  initialSeverity: number,
  latestSeverity: number,
): SeverityConclusion {
  const diff = latestSeverity - initialSeverity;
  const direction: SeverityDirection = diff <= -2 ? "down" : diff >= 2 ? "up" : "flat";
  const text =
    direction === "down"
      ? "紀錄顯示困擾程度下降"
      : direction === "up"
        ? "紀錄顯示困擾程度上升"
        : "紀錄顯示變化不明顯";
  return { direction, text, initial: initialSeverity, latest: latestSeverity, diff };
}

/** 主觀感受方向：僅用於「方向不同」的提示，不覆寫數字結論。 */
export function subjectiveDirection(value: SubjectiveChange | null): SeverityDirection | null {
  if (value === "much_better" || value === "slightly_better") return "down";
  if (value === "no_clear_change") return "flat";
  if (value === "slightly_worse" || value === "much_worse") return "up";
  return null;
}

export function hasDirectionMismatch(
  numeric: SeverityDirection,
  subjective: SeverityDirection | null,
): boolean {
  if (!subjective) return false;
  return (
    (numeric === "down" && subjective === "up") || (numeric === "up" && subjective === "down")
  );
}

export const MISMATCH_TEXT = "數字紀錄與主觀感受可能呈現不同方向，建議一併參考。";

/* ---------- 發生頻率比較 ---------- */

export type FrequencyComparison = {
  direction: SeverityDirection;
  text: string;
  earliest: { date: string; level: number; label: string };
  latest: { date: string; level: number; label: string };
};

export function buildFrequencyComparison(
  earliest: ReassessTrack,
  latest: ReassessTrack,
): FrequencyComparison {
  const diff = latest.frequencyLevel - earliest.frequencyLevel;
  const direction: SeverityDirection = diff < 0 ? "down" : diff > 0 ? "up" : "flat";
  const text =
    direction === "down"
      ? "紀錄顯示發生頻率下降"
      : direction === "up"
        ? "紀錄顯示發生頻率上升"
        : "紀錄顯示發生頻率沒有變化";
  return {
    direction,
    text,
    earliest: {
      date: earliest.trackDate,
      level: earliest.frequencyLevel,
      label: frequencyLabel(earliest.frequencyLevel),
    },
    latest: {
      date: latest.trackDate,
      level: latest.frequencyLevel,
      label: frequencyLabel(latest.frequencyLevel),
    },
  };
}

/* ---------- 圖表 ---------- */

export type ChartPoint = {
  x: number;
  date: string;
  severity: number;
  isInitial: boolean;
};

export function buildChartPoints(
  initial: ReassessInitialRecord,
  tracks: ReassessTrack[],
): ChartPoint[] {
  const initialDate = taipeiDateOf(initial.createdAt);
  const points: ChartPoint[] = [
    { x: dateValue(initialDate), date: initialDate, severity: initial.severity, isInitial: true },
  ];
  for (const t of tracks) {
    points.push({
      x: dateValue(t.trackDate),
      date: t.trackDate,
      severity: t.severity,
      isInitial: false,
    });
  }
  return points.sort((a, b) => a.x - b.x);
}

const DAY_MS = 86_400_000;

/** 只使用實際存在的日期作為刻度；超過約 14 天時改為約每週一個代表性日期。 */
export function buildChartTicks(points: ChartPoint[]): number[] {
  if (points.length === 0) return [];
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const spanDays = (last.x - first.x) / DAY_MS;
  if (spanDays <= 14) return points.map((p) => p.x);

  const ticks: number[] = [first.x];
  let cursor = first.x;
  for (const p of points) {
    if (p.x - cursor >= 7 * DAY_MS) {
      ticks.push(p.x);
      cursor = p.x;
    }
  }
  if (ticks[ticks.length - 1] !== last.x) ticks.push(last.x);
  return ticks;
}

export const CHART_NOTE = "趨勢僅依已記錄日期呈現，未記錄日期不代表困擾程度沒有變化。";

/* ---------- 時間軸 ---------- */

export type TimelineEntry =
  | { kind: "track"; id: string; date: string; sortAt: number; track: ReassessTrack }
  | {
      kind: "safety";
      id: string;
      date: string;
      sortAt: number;
      result: SafetyResultValue;
    }
  | {
      kind: "initial";
      id: string;
      date: string;
      sortAt: number;
      record: ReassessInitialRecord;
    };

export const TIMELINE_PAGE_SIZE = 5;

export function buildTimeline({
  initial,
  tracks,
  safety,
}: {
  initial: ReassessInitialRecord;
  tracks: ReassessTrack[];
  safety: ReassessSafety[];
}): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  entries.push({
    kind: "initial",
    id: initial.id,
    date: taipeiDateOf(initial.createdAt),
    sortAt: Date.parse(initial.createdAt),
    record: initial,
  });

  for (const t of tracks) {
    entries.push({
      kind: "track",
      id: t.id,
      // 顯示與排序日期一律使用 track_date，不受後續編輯影響。
      date: t.trackDate,
      sortAt: dateValue(t.trackDate) + (Date.parse(t.createdAt) % DAY_MS) / 1e6,
      track: t,
    });
  }

  for (const s of safety) {
    entries.push({
      kind: "safety",
      id: s.id,
      date: taipeiDateOf(s.occurredAt),
      sortAt: Date.parse(s.occurredAt),
      result: s.result,
    });
  }

  return entries.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.sortAt - a.sortAt;
  });
}

export const SAFETY_TIMELINE_TEXT: Record<SafetyResultValue, string> = {
  normal: "此次確認未出現需要優先處理的情況。",
  priority_care: "當時的確認結果建議優先尋求專業協助。",
  attention: "當時的確認結果建議持續留意目前狀況。",
};
