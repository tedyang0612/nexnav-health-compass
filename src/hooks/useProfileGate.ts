import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * 讀取目前登入者的 profile（只讀取，不建立、不寫入）。
 * RLS 由 Supabase 端負責，前端不繞過。
 */
export function useProfileGate(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, onboarding_completed")
        .eq("id", userId!)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}
