import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { taipeiToday } from "@/lib/event-wizard";
import { parseGuideSuggestions, type GuideSuggestion } from "@/lib/guide";
import {
  buildDailyTrackWritablePayload,
  parseDailyTrackRow,
  type DailyTrackFormValues,
  type ParsedDailyTrack,
} from "@/lib/daily-track";

const TRACK_COLUMNS =
  "id, guide_id, track_date, severity, frequency_level, frequency_description, subjective_change, life_context, suggestion_execution, notes";

export type TrackEvent = {
  id: string;
  userId: string;
  status: string;
};

/** A. Event ownership / active 判斷，不依 URL 或 Active Event List 推斷。 */
export function useTrackEvent(eventId: string) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery<TrackEvent | null>({
    queryKey: ["track-event", eventId, userId],
    enabled: !!userId,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_events")
        .select("id, user_id, status")
        .eq("id", eventId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { id: data.id, userId: data.user_id, status: data.status };
    },
  });
}

/** B. 今日紀錄（Asia/Taipei）。 */
export function useTodayTrack(eventId: string, enabled: boolean) {
  return useQuery<ParsedDailyTrack | null>({
    queryKey: ["daily-track-today", eventId, taipeiToday()],
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_tracks")
        .select(TRACK_COLUMNS)
        .eq("health_event_id", eventId)
        .eq("track_date", taipeiToday())
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return parseDailyTrackRow(data);
    },
  });
}

/** C. 前一次追蹤（僅作為比較基準文案判斷，不顯示數值）。 */
export function usePreviousTrack(eventId: string, enabled: boolean) {
  return useQuery<{ trackDate: string } | null>({
    queryKey: ["daily-track-previous", eventId, taipeiToday()],
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_tracks")
        .select("track_date")
        .eq("health_event_id", eventId)
        .lt("track_date", taipeiToday())
        .order("track_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { trackDate: data.track_date };
    },
  });
}

export type TrackGuideBinding = {
  guideId: string | null;
  suggestions: GuideSuggestion[];
};

/**
 * D. Guide 綁定。
 * 既有今日紀錄 → 跟隨原本 guide_id（不切換、不補綁）。
 * 新建今日紀錄 → 只使用符合 current initial record revision 的既有 Guide。
 * 本頁不呼叫 create_guide_for_event。
 */
export function useTrackGuide({
  eventId,
  todayTrack,
  enabled,
}: {
  eventId: string;
  todayTrack: ParsedDailyTrack | null;
  enabled: boolean;
}) {
  const boundGuideId = todayTrack?.guideId ?? null;
  const hasToday = todayTrack !== null;

  return useQuery<TrackGuideBinding>({
    queryKey: ["daily-track-guide", eventId, hasToday ? boundGuideId ?? "none" : "new"],
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (hasToday) {
        if (!boundGuideId) return { guideId: null, suggestions: [] };
        const { data, error } = await supabase
          .from("guides")
          .select("id, suggestions_snapshot")
          .eq("id", boundGuideId)
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("guide_not_available");
        return {
          guideId: data.id,
          suggestions: parseGuideSuggestions(data.suggestions_snapshot),
        };
      }

      const [revisionRes, guidesRes] = await Promise.all([
        supabase
          .from("initial_records")
          .select("revision")
          .eq("health_event_id", eventId)
          .order("revision", { ascending: false })
          .limit(1),
        supabase
          .from("guides")
          .select("id, record_revision, version_number, suggestions_snapshot")
          .eq("health_event_id", eventId)
          .order("version_number", { ascending: false })
          .limit(20),
      ]);
      if (revisionRes.error) throw revisionRes.error;
      if (guidesRes.error) throw guidesRes.error;

      const currentRevision = revisionRes.data?.[0]?.revision ?? null;
      if (currentRevision === null) return { guideId: null, suggestions: [] };

      const match = (guidesRes.data ?? []).find(
        (row) => row.record_revision === currentRevision,
      );
      if (!match) return { guideId: null, suggestions: [] };

      try {
        return {
          guideId: match.id,
          suggestions: parseGuideSuggestions(match.suggestions_snapshot),
        };
      } catch {
        // 新建情境下 snapshot 無法解析時，退化為不綁定 Guide。
        return { guideId: null, suggestions: [] };
      }
    },
  });
}

export type SaveResult = { mode: "insert" | "update" };

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "23505"
  );
}

/** Save mutation：INSERT 不送 track_date；23505 最多受控轉一次 UPDATE。 */
export function useSaveDailyTrack(eventId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    SaveResult,
    Error,
    {
      values: DailyTrackFormValues;
      existing: ParsedDailyTrack | null;
      guideId: string | null;
    }
  >({
    mutationFn: async ({ values, existing, guideId }) => {
      const userId = user?.id;
      if (!userId) throw new Error("not_authenticated");
      const writable = buildDailyTrackWritablePayload(values);

      const doUpdate = async (trackId: string) => {
        const { error } = await supabase
          .from("daily_tracks")
          .update(writable)
          .eq("id", trackId)
          .eq("user_id", userId);
        if (error) throw new Error("save_failed");
      };

      if (existing) {
        await doUpdate(existing.id);
        return { mode: "update" };
      }

      const { error } = await supabase.from("daily_tracks").insert({
        user_id: userId,
        health_event_id: eventId,
        guide_id: guideId,
        ...writable,
      });

      if (!error) return { mode: "insert" };

      if (!isUniqueViolation(error)) throw new Error("save_failed");

      // 受控 race recovery：僅重讀一次今日紀錄並改為 UPDATE。
      const { data, error: reloadError } = await supabase
        .from("daily_tracks")
        .select("id")
        .eq("health_event_id", eventId)
        .eq("track_date", taipeiToday())
        .maybeSingle();
      if (reloadError || !data) throw new Error("save_failed");
      await doUpdate(data.id);
      return { mode: "update" };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["daily-track-today", eventId, taipeiToday()],
      });
    },
  });
}
