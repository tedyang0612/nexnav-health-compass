/**
 * P08 Guide Snapshot 型別與 runtime parser。
 * 內容一律來自後端 approved template snapshot；前端只做結構驗證與顯示。
 */

export type GuideSource = {
  title: string;
  url: string;
};

export type GuideContentSnapshot = {
  title: string;
  summary_disclaimer: string;
  factors_title: string;
  factors_intro: string;
  factors: string[];
  factors_disclaimer: string;
  suggestion_note: string;
  observations: string[];
  escalation: string;
  sources: GuideSource[];
};

export type GuideSuggestion = {
  code: string;
  title: string;
  description: string;
};

export type GuideRpcRow = {
  guide_id: string;
  version_number: number;
  record_revision: number;
  safety_assessment_id: string;
  template_code: string;
  template_version: string;
  content_snapshot: unknown;
  suggestions_snapshot: unknown;
  created_new: boolean;
};

export type GuideViewModel = {
  guideId: string;
  versionNumber: number;
  content: GuideContentSnapshot;
  suggestions: GuideSuggestion[];
};

export class GuideSnapshotError extends Error {
  constructor(message = "invalid_guide_snapshot") {
    super(message);
    this.name = "GuideSnapshotError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new GuideSnapshotError(`missing_string:${key}`);
  }
  return value;
}

function strArray(source: Record<string, unknown>, key: string): string[] {
  const value = source[key];
  if (!Array.isArray(value)) throw new GuideSnapshotError(`missing_array:${key}`);
  return value.map((item) => {
    if (typeof item !== "string" || item.trim() === "") {
      throw new GuideSnapshotError(`invalid_array_item:${key}`);
    }
    return item;
  });
}

function isSafeHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function parseSources(value: unknown): GuideSource[] {
  if (!Array.isArray(value)) throw new GuideSnapshotError("missing_array:sources");
  return value.map((item) => {
    if (!isRecord(item)) throw new GuideSnapshotError("invalid_source");
    const title = str(item, "title");
    const url = str(item, "url");
    if (!isSafeHttpUrl(url)) throw new GuideSnapshotError("invalid_source_url");
    return { title, url };
  });
}

export function parseGuideContentSnapshot(value: unknown): GuideContentSnapshot {
  if (!isRecord(value)) throw new GuideSnapshotError("invalid_content_snapshot");
  return {
    title: str(value, "title"),
    summary_disclaimer: str(value, "summary_disclaimer"),
    factors_title: str(value, "factors_title"),
    factors_intro: str(value, "factors_intro"),
    factors: strArray(value, "factors"),
    factors_disclaimer: str(value, "factors_disclaimer"),
    suggestion_note: str(value, "suggestion_note"),
    observations: strArray(value, "observations"),
    escalation: str(value, "escalation"),
    sources: parseSources(value["sources"]),
  };
}

export function parseGuideSuggestions(value: unknown): GuideSuggestion[] {
  if (!Array.isArray(value)) throw new GuideSnapshotError("invalid_suggestions");
  return value.map((item) => {
    if (!isRecord(item)) throw new GuideSnapshotError("invalid_suggestion");
    return {
      code: str(item, "code"),
      title: str(item, "title"),
      description: str(item, "description"),
    };
  });
}

/** 將 RPC 回傳列（單列或陣列）轉為已驗證的 View Model。 */
export function parseGuideRpcResult(data: unknown): GuideViewModel {
  const row = Array.isArray(data) ? data[0] : data;
  if (!isRecord(row)) throw new GuideSnapshotError("empty_guide_result");

  const guideId = row["guide_id"];
  const versionNumber = row["version_number"];
  if (typeof guideId !== "string" || typeof versionNumber !== "number") {
    throw new GuideSnapshotError("invalid_guide_row");
  }

  return {
    guideId,
    versionNumber,
    content: parseGuideContentSnapshot(row["content_snapshot"]),
    suggestions: parseGuideSuggestions(row["suggestions_snapshot"]),
  };
}
