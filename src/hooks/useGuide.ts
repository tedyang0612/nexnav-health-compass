import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseGuideRpcResult, type GuideViewModel } from "@/lib/guide";

/**
 * P08 Guide 讀取／建立。
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
