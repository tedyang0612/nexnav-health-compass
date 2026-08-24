export type EventNextStepState =
  | "safety_incomplete"
  | "priority_care"
  | "attention"
  | "guide_pending"
  | "track_pending"
  | "track_complete";

export type EventNextStep = {
  state: EventNextStepState;
  statusLabel: string;
  ctaLabel: string;
  to:
    | "/events/$eventId/safety"
    | "/events/$eventId/guide"
    | "/events/$eventId/track/today"
    | "/events/$eventId/reassess"
    | "/events/$eventId/navigate";
};

export function resolveEventNextStep({
  safetyResult,
  hasCurrentGuide,
  hasTodayTrack,
}: {
  safetyResult: "normal" | "attention" | "priority_care" | null;
  hasCurrentGuide: boolean;
  hasTodayTrack: boolean;
}): EventNextStep {
  if (safetyResult === null) {
    return {
      state: "safety_incomplete",
      statusLabel: "尚未完成狀況確認",
      ctaLabel: "完成目前狀況確認",
      to: "/events/$eventId/safety",
    };
  }

  if (safetyResult === "priority_care") {
    return {
      state: "priority_care",
      statusLabel: "建議優先尋求專業協助",
      ctaLabel: "查看就醫與專業協助",
      to: "/events/$eventId/navigate",
    };
  }

  if (safetyResult === "attention") {
    return {
      state: "attention",
      statusLabel: "建議持續留意目前狀況",
      ctaLabel: "查看就醫與專業協助",
      to: "/events/$eventId/navigate",
    };
  }

  if (!hasCurrentGuide) {
    return {
      state: "guide_pending",
      statusLabel: "等待查看改善方向",
      ctaLabel: "查看改善方向",
      to: "/events/$eventId/guide",
    };
  }

  if (!hasTodayTrack) {
    return {
      state: "track_pending",
      statusLabel: "今日尚未追蹤",
      ctaLabel: "開始今日追蹤",
      to: "/events/$eventId/track/today",
    };
  }

  return {
    state: "track_complete",
    statusLabel: "今日追蹤完成",
    ctaLabel: "查看追蹤變化",
    to: "/events/$eventId/reassess",
  };
}
