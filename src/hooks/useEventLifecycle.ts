import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ClosedEventItem = {
  id: string;
  startedOn: string;
  closedAt: string | null;
  primarySymptomLabel: string;
  symptomCode: string | null;
};

type EventRow = {
  id: string;
  started_on: string;
  closed_at: string | null;
  custom_primary_symptom: string | null;
  symptom_catalog: { display_name: string; code: string } | null;
};

/** 讀取目前登入者已結束的 Health Events（僅供 Dashboard 極簡列表使用）。 */
export function useClosedEvents(userId: string | undefined) {
  return useQuery({
    queryKey: ["closed-events", userId],
    enabled: !!userId,
    retry: 1,
    queryFn: async (): Promise<ClosedEventItem[]> => {
      const { data, error } = await supabase
        .from("health_events")
        .select(
          "id, started_on, closed_at, custom_primary_symptom, symptom_catalog(display_name, code)",
        )
        .eq("user_id", userId!)
        .eq("status", "closed")
        .order("closed_at", { ascending: false });

      if (error) throw error;

      return ((data ?? []) as unknown as EventRow[]).map((event) => ({
        id: event.id,
        startedOn: event.started_on,
        closedAt: event.closed_at,
        primarySymptomLabel:
          event.custom_primary_symptom?.trim() ||
          event.symptom_catalog?.display_name ||
          "未指定不適",
        symptomCode: event.symptom_catalog?.code ?? null,
      }));
    },
  });
}

/** 讀取單一 Health Event 的 lifecycle 狀態（closed guards 使用）。 */
export function useEventStatus(eventId: string) {
  return useQuery({
    queryKey: ["event-status", eventId],
    retry: 1,
    staleTime: 30_000,
    queryFn: async (): Promise<{ status: string; closedAt: string | null } | null> => {
      const { data, error } = await supabase
        .from("health_events")
        .select("status, closed_at")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { status: data.status, closedAt: data.closed_at };
    },
  });
}

/**
 * 結束狀況追蹤：僅更新既有欄位 status / closed_at，不觸碰任何歷史紀錄。
 */
export function useCloseEvent(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("health_events")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("id", eventId)
        .eq("status", "active");
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all(
        [
          ["active-events"],
          ["closed-events"],
          ["event-status", eventId],
          ["reassess", eventId],
          ["safety-context", eventId],
          ["guide-safety-gate", eventId],
          ["track-event", eventId],
          ["summary-source", eventId],
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
    },
  });
}
