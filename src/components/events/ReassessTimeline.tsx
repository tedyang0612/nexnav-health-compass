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

/** 5 圓點頻率語言，與生活狀況一致。 */
export function FrequencyDots({ level, label }: { level: number; label?: string }) {
  return (
    <span
      role="img"
      aria-label={`${label ?? "發生頻率"} ${level}/5`}
      className="inline-flex items-center gap-1.5 align-middle"
    >
      <span aria-hidden="true" className="inline-flex gap-1">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            className={
              index < level
                ? "size-2 rounded-full bg-primary"
                : "size-2 rounded-full border border-border bg-surface"
            }
          />
        ))}
      </span>
      <span aria-hidden="true" className="whitespace-nowrap text-xs text-muted-foreground">
        {level}/5
      </span>
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words text-sm leading-6 text-foreground">{children}</p>
    </div>
  );
}

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
            className="overflow-hidden rounded-xl border border-border bg-surface p-3.5 sm:p-4"
          >
            <p className="text-xs text-muted-foreground">{formatDisplayDate(entry.date)}</p>

            {entry.kind === "track" ? (
              <div className="mt-1.5 space-y-2">
                {/* Desktop：單行四欄；Mobile：兩行 */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)] sm:items-start sm:gap-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-primary" />
                    每日追蹤
                    <span className="text-sm font-normal text-muted-foreground sm:hidden">
                      ・相較前次：{subjectiveLabel(entry.track.subjectiveChange)}
                    </span>
                  </p>
                  <Field label="困擾程度">{entry.track.severity}／10</Field>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">發生頻率</p>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 break-words text-sm leading-6 text-foreground">
                      {frequencyLabel(entry.track.frequencyLevel)}
                      <FrequencyDots level={entry.track.frequencyLevel} label="發生頻率" />
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <Field label="相較前次">
                      {subjectiveLabel(entry.track.subjectiveChange)}
                    </Field>
                  </div>
                </div>

                {entry.track.notes && entry.track.notes.trim() !== "" ? (
                  <div className="rounded-lg border-l-2 border-border bg-muted/60 px-3 py-2">
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
                <p className="break-words text-sm leading-6 text-foreground">
                  主要症狀：{symptomName}
                </p>
                <p className="text-sm leading-6 text-foreground">
                  初始困擾程度 {entry.record.severity}／10
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  症狀開始日期：{formatDisplayDate(symptomStartedOn)}
                </p>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-6 text-foreground">
                  初始發生頻率：{frequencyLabel(entry.record.frequencyLevel)}
                  <FrequencyDots level={entry.record.frequencyLevel} label="初始發生頻率" />
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
