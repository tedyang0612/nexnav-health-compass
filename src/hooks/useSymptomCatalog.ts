import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SymptomOption } from "@/lib/event-wizard";

const COLUMNS =
  "id, code, category_code, category_name, display_name, is_primary_enabled, is_hero_group, is_other, is_active, display_order";

/** 唯讀取得 active 且可作為主要症狀的 Seed 選項。 */
export function useSymptomCatalog() {
  return useQuery({
    queryKey: ["symptom-catalog", "primary-enabled"],
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: async (): Promise<SymptomOption[]> => {
      const { data, error } = await supabase
        .from("symptom_catalog")
        .select(COLUMNS)
        .eq("is_active", true)
        .eq("is_primary_enabled", true)
        .order("display_order", { ascending: true })
        .order("code", { ascending: true });

      if (error) throw error;
      return (data ?? []) as SymptomOption[];
    },
  });
}

/** 由 Seed 衍生分類清單（排除 Other，Other 不視為一般健康分類）。 */
export function deriveCategories(options: SymptomOption[]) {
  const map = new Map<string, string>();
  for (const o of options) {
    if (o.is_other) continue;
    if (!map.has(o.category_code)) map.set(o.category_code, o.category_name);
  }
  return Array.from(map, ([code, name]) => ({ code, name }));
}
