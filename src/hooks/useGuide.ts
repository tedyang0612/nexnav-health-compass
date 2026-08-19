import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  parseGuideRpcResult,
  parseGuideTableRow,
  type ExistingGuide,
  type GuideViewModel,
} from "@/lib/guide";

/**
 * P08-C3 既有 Guide 讀取（唯讀 SELECT，沿用 guides_select_own RLS）。
 * 與 Safety Context 平行執行；符合條件時可省去 RPC 往返。
 */
export function useExistingGuide(eventId: string) {
  return useQuery<ExistingGuide | null>({
    queryKey: ["existing-guide", eventId],
    retry: 1,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guides")
        .select(
          "id, health_event_id, version_number, record_revision, safety_assessment_id, content_snapshot, suggestions_snapshot, created_at",
        )
        .eq("health_event_id", eventId)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        guideId: data.id,
        versionNumber: data.version_number,
        recordRevision: data.record_revision,
        safetyAssessmentId: data.safety_assessment_id,
        raw: data,
      };
    },
  });
}

export { parseGuideTableRow };

/**
 * P08 Guide 建立。
 * RPC 具冪等性：同一 current revision 已存在 Guide 時回傳既有最高版本。
 * 前端不得直接寫入 public.guides。
 */
export function useGuide({
  eventId,
  enabled,
}: {
  eventId: string;
  enabled: boolean;
}) {
  return useQuery<GuideViewModel>({
    queryKey: ["guide", eventId],
    enabled,
    retry: 1,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("create_guide_for_event", {
        p_health_event_id: eventId,
      });
      if (error) throw error;
      return parseGuideRpcResult(data);
    },
  });
}
