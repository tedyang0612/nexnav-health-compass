import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { taipeiToday } from "@/lib/event-wizard";

export type ActiveEventSafetyState = "incomplete" | "completed";

export type ActiveEventItem = {
  id: string;
  startedOn: string;
  primarySymptomLabel: string;
  trackedDays: number;
  safetyState: ActiveEventSafetyState;
};

type EventRow = {
  id: string;
  started_on: string;
  custom_primary_symptom: string | null;
  symptom_catalog: { display_name: string } | null;
};

/** 以 Asia/Taipei 今日計算已追蹤天數（起始日當天為第 1 天）。 */
export function trackedDays(startedOn: string, today = taipeiToday()): number {
  const start = Date.parse(`${startedOn}T00:00:00Z`);
  const end = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return 1;
  const diff = Math.floor((end - start) / 86_400_000);
  return diff < 0 ? 1 : diff + 1;
}

/** 讀取目前登入者的 active Health Events（RLS 限制僅回傳本人資料）。 */
export function useActiveEvents(userId: string | undefined) {
  return useQuery({
    queryKey: ["active-events", userId],
    enabled: !!userId,
    retry: 1,
    queryFn: async (): Promise<ActiveEventItem[]> => {
      const { data, error } = await supabase
        .from("health_events")
        .select(
          "id, started_on, custom_primary_symptom, symptom_catalog(display_name)",
        )
        .eq("user_id", userId!)
        .eq("status", "active")
        .order("started_on", { ascending: false });

      if (error) throw error;

      const events = (data ?? []) as unknown as EventRow[];
      if (events.length === 0) return [];

      const { data: safetyRows, error: safetyError } = await supabase
        .from("safety_assessments")
        .select("health_event_id, assessment_status, result, record_revision")
        .in(
          "health_event_id",
          events.map((e) => e.id),
        );

      if (safetyError) throw safetyError;

      const { data: revisionRows, error: revisionError } = await supabase
        .from("initial_records")
        .select("health_event_id, revision")
        .in(
          "health_event_id",
          events.map((e) => e.id),
        )
        .order("revision", { ascending: false });

      if (revisionError) throw revisionError;

      const currentRevisionByEvent = new Map<string, number>();
      for (const r of revisionRows ?? []) {
        if (!currentRevisionByEvent.has(r.health_event_id)) {
          currentRevisionByEvent.set(r.health_event_id, r.revision);
        }
      }

      const completed = new Set(
        (safetyRows ?? [])
          .filter(
            (r) =>
              r.assessment_status === "completed" &&
              r.result !== null &&
              r.record_revision === currentRevisionByEvent.get(r.health_event_id),
          )
          .map((r) => r.health_event_id),
      );

      const today = taipeiToday();
      return events.map((e) => ({
        id: e.id,
        startedOn: e.started_on,
        primarySymptomLabel:
          e.custom_primary_symptom?.trim() ||
          e.symptom_catalog?.display_name ||
          "未指定不適",
        trackedDays: trackedDays(e.started_on, today),
        safetyState: completed.has(e.id) ? "completed" : "incomplete",
      }));
    },
  });
}
