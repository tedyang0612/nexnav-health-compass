import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SymptomIcon } from "@/lib/symptom-icons";
import { formatDisplayDate } from "@/lib/event-wizard";
import type { ActiveEventItem } from "@/hooks/useActiveEvents";
import type { EventNextStepState } from "@/lib/event-next-step";

const STATUS_CLASSES: Record<EventNextStepState, string> = {
  safety_incomplete: "border-caution/60 bg-caution-muted text-caution-strong",
  priority_care: "border-urgent bg-urgent-muted text-urgent-strong",
  attention: "border-caution bg-caution-muted text-caution-strong",
  guide_pending: "border-heal/40 bg-heal-muted text-heal",
  track_pending: "border-primary/40 bg-primary/10 text-primary",
  track_complete: "border-heal/40 bg-heal-muted text-heal",
};

const CTA_CLASSES: Record<EventNextStepState, string> = {
  safety_incomplete: "",
  priority_care:
    "bg-urgent bg-none text-white shadow-none hover:bg-urgent/90 focus-visible:ring-urgent",
  attention:
    "bg-caution bg-none text-foreground shadow-none hover:bg-caution/90 focus-visible:ring-caution",
  guide_pending: "",
  track_pending: "",
  track_complete:
    "border-2 border-heal bg-transparent text-heal hover:bg-heal-muted",
};

const STAGES = ["狀況確認", "改善方向", "每日追蹤", "追蹤變化"] as const;

/** next-step 狀態 → 建議下一步官方 SVG（含淡色圓底，外層不再加底色）。 */
const NEXT_STEP_ICON_SRC: Record<EventNextStepState, string> = {
  safety_incomplete: "/icons/next-step/complete_status_check.svg",
  priority_care: "/icons/next-step/view_professional_support.svg",
  attention: "/icons/next-step/view_professional_support.svg",
  guide_pending: "/icons/next-step/view_improvement_guide.svg",
  track_pending: "/icons/next-step/start_daily_tracking.svg",
  track_complete: "/icons/next-step/view_tracking_changes.svg",
};

/** 依下一步狀態推導健康導航進度（不改動既有狀態判斷邏輯）。 */
function stageIndex(state: EventNextStepState): number {
  switch (state) {
    case "safety_incomplete":
      return 0;
    case "priority_care":
    case "attention":
    case "guide_pending":
      return 1;
    case "track_pending":
      return 2;
    case "track_complete":
      return 3;
  }
}

/** Dashboard active event card：症狀資訊、健康導航進度與建議下一步。 */
export function ActiveEventCard({ event }: { event: ActiveEventItem }) {
  const { nextStep } = event;
  const displayStartedOn = formatDisplayDate(event.startedOn);
  const current = stageIndex(nextStep.state);
  const isUrgent = nextStep.state === "priority_care";

  return (
    <Card className="w-full gap-0 overflow-hidden border-border bg-surface-elevated p-5 sm:p-6">
      {/* 頂部資訊列 */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
        <SymptomIcon code={event.symptomCode} />
        <div className="min-w-0">
          <h3 className="text-base font-semibold break-words text-foreground sm:text-lg">
            {event.primarySymptomLabel}
          </h3>
          <p className="mt-0.5 text-sm break-words text-muted-foreground">
            開始日期 {displayStartedOn}．累計追蹤 {event.trackCount} 筆
            {event.latestSeverity === null
              ? ""
              : `．最新困擾程度 ${event.latestSeverity}/10`}
          </p>
        </div>
        <p
          className={`col-span-2 inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-medium sm:col-span-1 ${STATUS_CLASSES[nextStep.state]}`}
        >
          {nextStep.statusLabel}
        </p>
      </div>

      {/* 健康導航進度 */}
      <div className="mt-5 rounded-xl border border-border/70 bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">健康導航進度</p>
          <p className="text-xs text-muted-foreground">
            目前：{STAGES[current]}
          </p>
        </div>
        <ol className="mt-3 grid grid-cols-4 gap-2">
          {STAGES.map((stage, index) => {
            const done = index < current;
            const active = index === current;
            const isLast = index === STAGES.length - 1;
            return (
              <li key={stage} className="flex min-w-0 flex-col items-center gap-1.5">
                <span className="relative flex w-full items-center justify-center">
                  {!isLast ? (
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute top-1/2 left-[calc(50%+1.125rem)] z-0 h-0.5 w-[calc(100%-1.5rem)] -translate-y-1/2 rounded-full ${
                        done ? "bg-heal" : "bg-border"
                      }`}
                    />
                  ) : null}
                  <span
                    className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                      done
                        ? "border-heal bg-heal-muted text-heal"
                        : active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface-elevated text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="size-4" aria-hidden="true" /> : index + 1}
                  </span>
                </span>
                <span
                  className={`w-full text-center text-[11px] leading-tight break-keep sm:text-xs ${
                    active
                      ? "font-semibold text-primary"
                      : done
                        ? "text-heal"
                        : "text-muted-foreground"
                  }`}
                >
                  {stage}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* 建議下一步 */}
      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={NEXT_STEP_ICON_SRC[nextStep.state]}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="size-8 shrink-0 object-contain sm:size-9"
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">建議下一步</p>
            <p className="text-sm font-medium break-words text-foreground">
              {nextStep.ctaLabel}
            </p>
          </div>
        </div>

        <Button
          asChild
          size="lg"
          variant={nextStep.state === "track_complete" ? "outline" : "default"}
          className={`min-h-11 w-full sm:w-auto ${CTA_CLASSES[nextStep.state]}`}
        >
          <Link to={nextStep.to} params={{ eventId: event.id }}>
            <span className="truncate">{nextStep.ctaLabel}</span>
            <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
