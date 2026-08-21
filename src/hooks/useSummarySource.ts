import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { HealthBackgroundKey } from "@/lib/summary";

export type SummarySourceTrack = {
  id: string;
  track_date: string;
  severity: number;
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
  initialRecord: { revision: number; severity: number; updated_at: string };
  safety: {
    id: string;
    result: string;
    record_revision: number;
    assessed_at: string;
  } | null;
  tracks: SummarySourceTrack[];
  profileUpdatedAt: string | null;
  healthBackground: Record<string, unknown>;
  latestTrackDate: string | null;
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
      const [eventRes, recordRes, trackRes, profileRes] = await Promise.all([
        supabase
          .from("health_events")
          .select(
            "id, started_on, status, updated_at, custom_primary_symptom, symptom_catalog:primary_symptom_id(display_name)",
          )
          .eq("id", eventId)
          .maybeSingle(),
        supabase
          .from("initial_records")
          .select("revision, severity, updated_at")
          .eq("health_event_id", eventId)
          .order("revision", { ascending: false })
          .limit(1),
        supabase
          .from("daily_tracks")
          .select("id, track_date, severity, notes, updated_at")
          .eq("health_event_id", eventId)
          .order("track_date", { ascending: true }),
        supabase.from("profiles").select("updated_at, health_background").maybeSingle(),
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
        .select("id, result, record_revision, resolved_at, created_at")
        .eq("health_event_id", eventId)
        .eq("assessment_status", "completed")
        .eq("record_revision", recordRow.revision)
        .not("result", "is", null)
        .order("resolved_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1);
      if (safetyRes.error) throw safetyRes.error;

      const safetyRow = safetyRes.data?.[0] ?? null;
      const tracks = (trackRes.data ?? []) as SummarySourceTrack[];
      const symptom = eventRow.symptom_catalog as { display_name: string } | null;

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
          updated_at: recordRow.updated_at,
        },
        safety: safetyRow
          ? {
              id: safetyRow.id,
              result: safetyRow.result as string,
              record_revision: safetyRow.record_revision,
              assessed_at: safetyRow.resolved_at ?? safetyRow.created_at,
            }
          : null,
        tracks,
        profileUpdatedAt: profileRes.data?.updated_at ?? null,
        healthBackground:
          (profileRes.data?.health_background as Record<string, unknown> | null) ?? {},
        latestTrackDate: tracks.length > 0 ? tracks[tracks.length - 1].track_date : null,
      };
    },
  });
}
