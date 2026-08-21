import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { HealthBackgroundKey } from "@/lib/summary";

export type SummarySourceTrack = {
  id: string;
  track_date: string;
  severity: number;
  frequency_level: number | null;
  frequency_description: string | null;
  subjective_change: string | null;
  life_context: Record<string, number> | null;
  suggestion_execution: string[];
  notes: string | null;
  updated_at: string;
};

export type SummarySource = {
  event: {
    id: string;
    started_on: string;
    status: string;
    updated_at: string;
    primary_symptom_label: string | null;
    custom_primary_symptom: string | null;
  };
  initialRecord: {
    revision: number;
    severity: number;
    frequency_level: number | null;
    frequency_description: string | null;
    duration_value: number | null;
    duration_unit: string | null;
    associated_symptoms: { label: string | null }[];
    life_context: Record<string, number> | null;
    supplemental_description: string | null;
    updated_at: string;
  };
  safety: {
    id: string;
    result: string;
    record_revision: number;
    assessed_at: string;
    warnings: { code: string; label: string }[];
  } | null;
  tracks: SummarySourceTrack[];
  suggestionMap: Record<string, { title: string; description?: string | null }>;
  profileUpdatedAt: string | null;
  healthBackground: Record<string, unknown>;
  latestTrackDate: string | null;
};

const SAFETY_WARNING_LABELS: Record<string, string> = {
  severe_breathing_difficulty: "明顯呼吸困難",
  significant_chest_discomfort: "明顯胸悶或胸痛",
  stroke_warning_signs: "疑似中風徵兆（臉部歪斜、單側無力、說話困難）",
  consciousness_change: "意識改變或昏厥",
  other_emergency_signs: "其他需要立即處理的緊急徵兆",
};

function maxIso(values: (string | null | undefined)[]): string | null {
  let best: string | null = null;
  let bestTime = -Infinity;
  for (const value of values) {
    if (!value) continue;
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) continue;
    if (time > bestTime) {
      bestTime = time;
      best = value;
    }
  }
  return best;
}

/**
 * 依伺服器端 confirm_health_summary 相同規則計算來源指紋。
 * 僅在有選取健康背景項目時納入 Profile 的更新時間。
 */
export function sourceFingerprint(
  source: SummarySource,
  selectedBackgroundKeys: HealthBackgroundKey[],
): string | null {
  const trackUpdated = maxIso(source.tracks.map((t) => t.updated_at));
  const values = [
    source.event.updated_at,
    source.initialRecord.updated_at,
    source.safety?.assessed_at ?? null,
    trackUpdated ?? source.initialRecord.updated_at,
    selectedBackgroundKeys.length > 0
      ? (source.profileUpdatedAt ?? source.initialRecord.updated_at)
      : source.initialRecord.updated_at,
  ];
  return maxIso(values);
}

export function useSummarySource(eventId: string) {
  return useQuery<SummarySource>({
    queryKey: ["summary-source", eventId],
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const [eventRes, recordRes, trackRes, profileRes, guideRes] = await Promise.all([
        supabase
          .from("health_events")
          .select(
            "id, started_on, status, updated_at, custom_primary_symptom, symptom_catalog:primary_symptom_id(display_name)",
          )
          .eq("id", eventId)
          .maybeSingle(),
        supabase
          .from("initial_records")
          .select(
            "revision, severity, frequency_level, frequency_description, duration_value, duration_unit, associated_symptoms, life_context, supplemental_description, updated_at",
          )
          .eq("health_event_id", eventId)
          .order("revision", { ascending: false })
          .limit(1),
        supabase
          .from("daily_tracks")
          .select(
            "id, track_date, severity, frequency_level, frequency_description, subjective_change, life_context, suggestion_execution, notes, updated_at",
          )
          .eq("health_event_id", eventId)
          .order("track_date", { ascending: true }),
        supabase.from("profiles").select("updated_at, health_background").maybeSingle(),
        supabase.from("guides").select("suggestions_snapshot").eq("health_event_id", eventId),
      ]);

      if (eventRes.error) throw eventRes.error;
      if (recordRes.error) throw recordRes.error;
      if (trackRes.error) throw trackRes.error;
      if (profileRes.error) throw profileRes.error;

      const eventRow = eventRes.data;
      const recordRow = recordRes.data?.[0];
      if (!eventRow || !recordRow) throw new Error("EVENT_NOT_AVAILABLE");

      const safetyRes = await supabase
        .from("safety_assessments")
        .select("id, result, record_revision, resolved_at, created_at, answers_snapshot")
        .eq("health_event_id", eventId)
        .eq("assessment_status", "completed")
        .eq("record_revision", recordRow.revision)
        .not("result", "is", null)
        .order("resolved_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1);
      if (safetyRes.error) throw safetyRes.error;

      const safetyRow = safetyRes.data?.[0] ?? null;

      const tracks: SummarySourceTrack[] = (trackRes.data ?? []).map((row) => ({
        id: row.id,
        track_date: row.track_date,
        severity: row.severity,
        frequency_level: row.frequency_level ?? null,
        frequency_description: row.frequency_description ?? null,
        subjective_change: row.subjective_change ?? null,
        life_context: (row.life_context as Record<string, number> | null) ?? null,
        suggestion_execution: Array.isArray(row.suggestion_execution)
          ? (row.suggestion_execution as unknown[]).filter(
              (v): v is string => typeof v === "string",
            )
          : [],
        notes: row.notes ?? null,
        updated_at: row.updated_at,
      }));

      const suggestionMap: Record<string, { title: string; description?: string | null }> = {};
      for (const guide of guideRes.data ?? []) {
        const list = guide.suggestions_snapshot;
        if (!Array.isArray(list)) continue;
        for (const raw of list as Record<string, unknown>[]) {
          const code = typeof raw?.["code"] === "string" ? (raw["code"] as string) : null;
          if (!code) continue;
          suggestionMap[code] = {
            title: typeof raw["title"] === "string" ? (raw["title"] as string) : code,
            description:
              typeof raw["description"] === "string" ? (raw["description"] as string) : null,
          };
        }
      }

      const answers = (safetyRow?.answers_snapshot as Record<string, unknown> | null) ?? {};
      const warnings = Object.entries(answers)
        .filter(([, value]) => value === true)
        .map(([code]) => ({ code, label: SAFETY_WARNING_LABELS[code] ?? code }))
        .sort((a, b) => a.code.localeCompare(b.code));

      const symptom = eventRow.symptom_catalog as { display_name: string } | null;

      const associated = Array.isArray(recordRow.associated_symptoms)
        ? (recordRow.associated_symptoms as Record<string, unknown>[]).map((item) => ({
            label: typeof item?.["custom_text"] === "string" ? (item["custom_text"] as string) : null,
          }))
        : [];

      return {
        event: {
          id: eventRow.id,
          started_on: eventRow.started_on,
          status: eventRow.status,
          updated_at: eventRow.updated_at,
          primary_symptom_label: symptom?.display_name ?? null,
          custom_primary_symptom: eventRow.custom_primary_symptom,
        },
        initialRecord: {
          revision: recordRow.revision,
          severity: recordRow.severity,
          frequency_level: recordRow.frequency_level ?? null,
          frequency_description: recordRow.frequency_description ?? null,
          duration_value: recordRow.duration_value ?? null,
          duration_unit: recordRow.duration_unit ?? null,
          associated_symptoms: associated,
          life_context: (recordRow.life_context as Record<string, number> | null) ?? null,
          supplemental_description: recordRow.supplemental_description ?? null,
          updated_at: recordRow.updated_at,
        },
        safety: safetyRow
          ? {
              id: safetyRow.id,
              result: safetyRow.result as string,
              record_revision: safetyRow.record_revision,
              assessed_at: safetyRow.resolved_at ?? safetyRow.created_at,
              warnings,
            }
          : null,
        tracks,
        suggestionMap,
        profileUpdatedAt: profileRes.data?.updated_at ?? null,
        healthBackground:
          (profileRes.data?.health_background as Record<string, unknown> | null) ?? {},
        latestTrackDate: tracks[tracks.length - 1]?.track_date ?? null,
      };
    },
  });
}
