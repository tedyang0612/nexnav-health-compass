import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { taipeiToday } from "@/lib/event-wizard";
import {
  resolveEventNextStep,
  type EventNextStep,
} from "@/lib/event-next-step";

export type ActiveEventItem = {
  id: string;
  startedOn: string;
  primarySymptomLabel: string;
  symptomCode: string | null;
  trackedDays: number;
  trackCount: number;
  latestSeverity: number | null;
  nextStep: EventNextStep;
};

type EventRow = {
  id: string;
  started_on: string;
  custom_primary_symptom: string | null;
  symptom_catalog: { display_name: string; code: string } | null;
};

type SafetyResult = "normal" | "attention" | "priority_care";

/** 以 Asia/Taipei 今日計算已追蹤天數（起始日當天為第 1 天）。 */
export function trackedDays(startedOn: string, today = taipeiToday()): number {
  const start = Date.parse(`${startedOn}T00:00:00Z`);
  const end = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return 1;
  const diff = Math.floor((end - start) / 86_400_000);
  return diff < 0 ? 1 : diff + 1;
}

/** 讀取目前登入者的 active Health Events，並解析每筆事件目前的下一步。 */
export function useActiveEvents(userId: string | undefined) {
  return useQuery({
    queryKey: ["active-events", userId],
    enabled: !!userId,
    retry: 1,
    queryFn: async (): Promise<ActiveEventItem[]> => {
      const { data, error } = await supabase
        .from("health_events")
        .select(
          "id, started_on, custom_primary_symptom, symptom_catalog(display_name, code)",
        )
        .eq("user_id", userId!)
        .eq("status", "active")
        .order("started_on", { ascending: false });

      if (error) throw error;

      const events = (data ?? []) as unknown as EventRow[];
      if (events.length === 0) return [];
      const eventIds = events.map((event) => event.id);

      const [safetyRes, revisionsRes, guidesRes, tracksRes] = await Promise.all([
        supabase
          .from("safety_assessments")
          .select("health_event_id, assessment_status, result, record_revision, created_at")
          .in("health_event_id", eventIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("initial_records")
          .select("health_event_id, revision")
          .in("health_event_id", eventIds)
          .order("revision", { ascending: false }),
        supabase
          .from("guides")
          .select("health_event_id, record_revision, version_number")
          .in("health_event_id", eventIds)
          .order("version_number", { ascending: false }),
        supabase
          .from("daily_tracks")
          .select("health_event_id, track_date, severity")
          .in("health_event_id", eventIds)
          .order("track_date", { ascending: false }),
      ]);

      if (safetyRes.error) throw safetyRes.error;
      if (revisionsRes.error) throw revisionsRes.error;
      if (guidesRes.error) throw guidesRes.error;
      if (tracksRes.error) throw tracksRes.error;

      const currentRevisionByEvent = new Map<string, number>();
      for (const row of revisionsRes.data ?? []) {
        if (!currentRevisionByEvent.has(row.health_event_id)) {
          currentRevisionByEvent.set(row.health_event_id, row.revision);
        }
      }

      const safetyResultByEvent = new Map<string, SafetyResult>();
      for (const row of safetyRes.data ?? []) {
        const currentRevision = currentRevisionByEvent.get(row.health_event_id);
        if (
          !safetyResultByEvent.has(row.health_event_id) &&
          row.assessment_status === "completed" &&
          row.record_revision === currentRevision &&
          (row.result === "normal" ||
            row.result === "attention" ||
            row.result === "priority_care")
        ) {
          safetyResultByEvent.set(row.health_event_id, row.result);
        }
      }

      const currentGuideEvents = new Set<string>();
      for (const row of guidesRes.data ?? []) {
        if (
          row.record_revision === currentRevisionByEvent.get(row.health_event_id)
        ) {
          currentGuideEvents.add(row.health_event_id);
        }
      }

      const today = taipeiToday();
      const trackCountByEvent = new Map<string, number>();
      const todayTrackEvents = new Set<string>();
      const latestSeverityByEvent = new Map<string, number>();
      for (const row of tracksRes.data ?? []) {
        trackCountByEvent.set(
          row.health_event_id,
          (trackCountByEvent.get(row.health_event_id) ?? 0) + 1,
        );
        if (row.track_date === today) todayTrackEvents.add(row.health_event_id);
        if (!latestSeverityByEvent.has(row.health_event_id)) {
          latestSeverityByEvent.set(row.health_event_id, row.severity);
        }
      }

      return events.map((event) => {
        const safetyResult = safetyResultByEvent.get(event.id) ?? null;
        return {
          id: event.id,
          startedOn: event.started_on,
          primarySymptomLabel:
            event.custom_primary_symptom?.trim() ||
            event.symptom_catalog?.display_name ||
            "未指定不適",
          symptomCode: event.symptom_catalog?.code ?? null,
          trackedDays: trackedDays(event.started_on, today),
          trackCount: trackCountByEvent.get(event.id) ?? 0,
          latestSeverity: latestSeverityByEvent.get(event.id) ?? null,
          nextStep: resolveEventNextStep({
            safetyResult,
            hasCurrentGuide: currentGuideEvents.has(event.id),
            hasTodayTrack: todayTrackEvents.has(event.id),
          }),
        };
      });
    },
  });
}
