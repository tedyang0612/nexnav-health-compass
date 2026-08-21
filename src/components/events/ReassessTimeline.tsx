import { useState } from "react";
import { CalendarDays, ShieldAlert, ShieldCheck, Info, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SAFETY_TIMELINE_TEXT,
  TIMELINE_PAGE_SIZE,
  formatDisplayDate,
  frequencyLabel,
  subjectiveLabel,
  type TimelineEntry,
} from "@/lib/reassess";

/** 追蹤時間軸：由新到舊，預設 5 筆，可逐次展開 5 筆。 */
export function ReassessTimeline({
  entries,
  symptomName,
  symptomStartedOn,
}: {
  entries: TimelineEntry[];
  symptomName: string;
  symptomStartedOn: string;
}) {
  const [visible, setVisible] = useState(TIMELINE_PAGE_SIZE);
  const shown = entries.slice(0, visible);
  const hasMore = visible < entries.length;

  return (
    <div className="space-y-4">
      <ol className="space-y-2.5 sm:space-y-3">
        {shown.map((entry) => (
          <li
            key={`${entry.kind}-${entry.id}`}
            className="rounded-xl border border-border bg-surface p-3.5 sm:p-4"
          >
            <p className="text-xs text-muted-foreground">{formatDisplayDate(entry.date)}</p>

            {entry.kind === "track" ? (
              <div className="mt-1.5 space-y-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarDays aria-hidden="true" className="size-4 text-primary" />
                  每日追蹤紀錄
                </p>
                <p className="text-sm leading-6 text-foreground">
                  困擾程度 {entry.track.severity}／10
                </p>
                <p className="text-sm leading-6 text-foreground">
                  發生頻率：{frequencyLabel(entry.track.frequencyLevel)}（
                  {entry.track.frequencyLevel}／5）
                </p>
                <p className="text-sm leading-6 text-foreground">
                  和前一次相比：{subjectiveLabel(entry.track.subjectiveChange)}
                </p>
                {entry.track.notes && entry.track.notes.trim() !== "" ? (
                  <div className="mt-2 rounded-lg border-l-2 border-border bg-muted/60 px-3 py-2">
                    <p className="text-xs text-muted-foreground">補充紀錄</p>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                      {entry.track.notes}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {entry.kind === "safety" ? (
              <div className="mt-1.5 space-y-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <SafetyIcon result={entry.result} />
                  狀況確認結果
                </p>
                <p
                  className={
                    entry.result === "priority_care"
                      ? "text-sm font-medium leading-6 text-foreground"
                      : "text-sm leading-6 text-foreground"
                  }
                >
                  {SAFETY_TIMELINE_TEXT[entry.result]}
                </p>
              </div>
            ) : null}

            {entry.kind === "initial" ? (
              <div className="mt-1.5 space-y-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Flag aria-hidden="true" className="size-4 text-primary" />
                  狀況追蹤開始
                </p>
                <p className="text-sm leading-6 text-foreground">主要症狀：{symptomName}</p>
                <p className="text-sm leading-6 text-foreground">
                  初始困擾程度 {entry.record.severity}／10
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  症狀開始日期：{formatDisplayDate(symptomStartedOn)}
                </p>
                <p className="text-sm leading-6 text-foreground">
                  初始發生頻率：{frequencyLabel(entry.record.frequencyLevel)}（
                  {entry.record.frequencyLevel}／5）
                </p>
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      {hasMore ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full sm:w-auto"
          onClick={() => setVisible((v) => v + TIMELINE_PAGE_SIZE)}
        >
          顯示更多紀錄
        </Button>
      ) : null}
    </div>
  );
}

function SafetyIcon({ result }: { result: "normal" | "attention" | "priority_care" }) {
  if (result === "priority_care") {
    return <ShieldAlert aria-hidden="true" className="size-4 text-destructive" />;
  }
  if (result === "attention") {
    return <Info aria-hidden="true" className="size-4 text-caution-strong" />;
  }
  return <ShieldCheck aria-hidden="true" className="size-4 text-primary" />;
}
