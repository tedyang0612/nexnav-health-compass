import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isKnownResult, type SafetyResult } from "@/lib/safety";

export type GuideSafetyGate = {
  currentRevision: number | null;
  currentResult: SafetyResult | null;
};

/**
 * P08-C2：Guide 進入條件查詢。
 * Current revision 與 completed safety 以單一 query（平行請求）取得，
 * 避免同一次頁面載入產生串行的兩次往返；判斷邏輯與先前一致。
 */
export function useGuideSafetyGate(eventId: string) {
  return useQuery<GuideSafetyGate>({
    queryKey: ["guide-safety-gate", eventId],
    retry: 1,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const [recordRes, assessmentRes] = await Promise.all([
        supabase
          .from("initial_records")
          .select("revision")
          .eq("health_event_id", eventId)
          .order("revision", { ascending: false })
          .limit(1),
        supabase
          .from("safety_assessments")
          .select("result, assessment_status, record_revision, created_at")
          .eq("health_event_id", eventId)
          .eq("assessment_status", "completed")
          .not("result", "is", null)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (recordRes.error) throw recordRes.error;
      if (assessmentRes.error) throw assessmentRes.error;

      const currentRevision = recordRes.data?.[0]?.revision ?? null;
      if (currentRevision === null) {
        return { currentRevision: null, currentResult: null };
      }

      const match = (assessmentRes.data ?? []).find(
        (row) => row.record_revision === currentRevision,
      );
      const result = match?.result;

      return {
        currentRevision,
        currentResult: isKnownResult(result) ? result : null,
      };
    },
  });
}
