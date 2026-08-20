import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  isSafetyResult,
  parseSubjective,
  type ReassessEvent,
  type ReassessInitialRecord,
  type ReassessSafety,
  type ReassessTrack,
} from "@/lib/reassess";

export type ReassessData = {
  event: ReassessEvent;
  initial: ReassessInitialRecord | null;
  tracks: ReassessTrack[];
  safety: ReassessSafety[];
};

export class EventNotFoundError extends Error {
  constructor() {
    super("event_not_found");
    this.name = "EventNotFoundError";
  }
}

/**
 * P10：單一 query 內平行取得所有唯讀來源。
 * 任何必要 query 失敗即整體視為失敗，不呈現部分結論。
 */
export function useReassessData(eventId: string) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery<ReassessData>({
    queryKey: ["reassess", eventId, userId],
    enabled: !!userId,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const eventRes = await supabase
        .from("health_events")
        .select(
          "id, status, started_on, custom_primary_symptom, primary_symptom_id, symptom_catalog:primary_symptom_id (display_name)",
        )
        .eq("id", eventId)
        .maybeSingle();

      if (eventRes.error) throw eventRes.error;
      if (!eventRes.data) throw new EventNotFoundError();

      const catalog = eventRes.data.symptom_catalog as { display_name: string } | null;
      const event: ReassessEvent = {
        id: eventRes.data.id,
        status: eventRes.data.status,
        startedOn: eventRes.data.started_on,
        symptomName:
          eventRes.data.custom_primary_symptom?.trim() || catalog?.display_name || "主要症狀",
      };

      const [initialRes, tracksRes, safetyRes] = await Promise.all([
        supabase
          .from("initial_records")
          .select("id, revision, severity, frequency_level, created_at")
          .eq("health_event_id", eventId)
          .order("revision", { ascending: false })
          .limit(1),
        supabase
          .from("daily_tracks")
          .select(
            "id, track_date, severity, frequency_level, subjective_change, notes, created_at",
          )
          .eq("health_event_id", eventId)
          .order("track_date", { ascending: true }),
        supabase
          .from("safety_assessments")
          .select("id, result, record_revision, resolved_at, created_at")
          .eq("health_event_id", eventId)
          .eq("assessment_status", "completed")
          .not("result", "is", null),
      ]);

      if (initialRes.error) throw initialRes.error;
      if (tracksRes.error) throw tracksRes.error;
      if (safetyRes.error) throw safetyRes.error;

      const initialRow = initialRes.data?.[0] ?? null;
      const initial: ReassessInitialRecord | null = initialRow
        ? {
            id: initialRow.id,
            revision: initialRow.revision,
            severity: initialRow.severity,
            frequencyLevel: initialRow.frequency_level,
            createdAt: initialRow.created_at,
          }
        : null;

      const seenDates = new Set<string>();
      const tracks: ReassessTrack[] = [];
      for (const row of tracksRes.data ?? []) {
        if (seenDates.has(row.track_date)) continue;
        seenDates.add(row.track_date);
        tracks.push({
          id: row.id,
          trackDate: row.track_date,
          severity: row.severity,
          frequencyLevel: row.frequency_level,
          subjectiveChange: parseSubjective(row.subjective_change),
          notes: row.notes,
          createdAt: row.created_at,
        });
      }

      const safety: ReassessSafety[] = [];
      for (const row of safetyRes.data ?? []) {
        if (!isSafetyResult(row.result)) continue;
        safety.push({
          id: row.id,
          result: row.result,
          recordRevision: row.record_revision,
          occurredAt: row.resolved_at ?? row.created_at,
        });
      }
      safety.sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));

      return { event, initial, tracks, safety };
    },
  });
}
