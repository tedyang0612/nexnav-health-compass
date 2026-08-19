import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isKnownResult, type SafetyResult } from "@/lib/safety";

export type GuideSafetyGate = {
  currentRevision: number | null;
  currentResult: SafetyResult | null;
  currentAssessmentId: string | null;
};

/**
 * P08-C2/C3：Guide 進入條件查詢。
 * Current revision 與 completed safety 以單一 query（平行請求）取得，
 * 並回傳目前 revision 對應的最新 completed safety assessment id，
 * 供既有 Guide 是否可重用之比對使用。
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
          .select("id, result, assessment_status, record_revision, created_at")
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
        return {
          currentRevision: null,
          currentResult: null,
          currentAssessmentId: null,
        };
      }

      const match = (assessmentRes.data ?? []).find(
        (row) => row.record_revision === currentRevision,
      );
      const result = match?.result;

      return {
        currentRevision,
        currentResult: isKnownResult(result) ? result : null,
        currentAssessmentId: match?.id ?? null,
      };
    },
  });
}
