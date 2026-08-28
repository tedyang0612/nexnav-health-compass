import { useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shell";
import {
  backgroundContentToText,
  deriveSummaryStats,
  formatTaipeiDate,
  frequencyLabel,
  MISMATCH_NOTICE,
  safetyLines,
  subjectiveLabel,
  
  type SnapshotTrack,
  type SummarySnapshot,
} from "@/lib/summary";

const LIFE_FACTOR_ORDER = ["diet", "sleep", "stress", "activity"] as const;

/** 已確認 Snapshot 的唯讀呈現；不做任何即時運算或重新對照。 */
export function SummarySnapshotView({ snapshot }: { snapshot: SummarySnapshot }) {
  const lifeLabels = snapshot.life_context_labels ?? {
    sleep: "睡眠",
    diet: "飲食",
    activity: "活動",
    stress: "壓力",
  };
  const stats = deriveSummaryStats(snapshot);
  const isProfessional = snapshot.summary_type === "professional_support";
  const [showAllTrackDetails, setShowAllTrackDetails] = useState(false);
  const [showAllLifeContext, setShowAllLifeContext] = useState(false);
  const tracks = [...(snapshot.daily_tracks ?? [])].sort((a, b) =>
    b.track_date.localeCompare(a.track_date),
  );
  const notes = [...(snapshot.selected_track_notes ?? [])].sort((a, b) =>
    b.track_date.localeCompare(a.track_date),
  );
  const lifeContextTracks = tracks.filter((track) => hasNumericLifeContext(track.life_context));
  const questions = snapshot.questions ?? [];
  const background = snapshot.health_background ?? [];
  const associatedSymptoms = (snapshot.initial_record.associated_symptoms ?? [])
    .map((item) => item.label?.trim())
    .filter((label): label is string => Boolean(label));

  const overview = (
    <SectionCard title="狀況重點" className="gap-5">
      <dl className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCell label="主要不適" emphasis>
          {snapshot.event.primary_symptom_label ?? "未記錄"}
        </MetricCell>

        <MetricCell label="追蹤期間">
          {stats.hasTracks
            ? `${formatTaipeiDate(stats.firstTrackDate)}－${formatTaipeiDate(stats.latestTrackDate)}`
            : "尚無每日追蹤紀錄"}
          {stats.hasTracks ? (
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              共 {stats.trackCount} 筆紀錄
            </span>
          ) : null}
        </MetricCell>
        <MetricCell label="困擾程度">
          <span className="flex flex-col gap-0.5 sm:block">
            <span className="whitespace-nowrap">初始 {stats.initialSeverity}/10</span>
            {stats.hasTracks ? (
              <>
                <span className="hidden sm:inline"> → </span>
                <span className="whitespace-nowrap">最新 {stats.latestSeverity}/10</span>
              </>
            ) : null}
          </span>
        </MetricCell>
        <MetricCell label="出現頻率">
          {snapshot.initial_record.frequency_level || stats.latestFrequency ? (
            <span className="flex flex-col gap-0.5 sm:block">
              <span className="whitespace-nowrap">
                初始 {formatFiveLevelText(snapshot.initial_record.frequency_level)}
              </span>
              {stats.hasTracks ? (
                <>
                  <span className="hidden sm:inline"> → </span>
                  <span className="whitespace-nowrap">
                    最新 {formatFiveLevelText(stats.latestFrequency)}
                  </span>
                </>
              ) : null}
            </span>
          ) : (
            "未記錄"
          )}
        </MetricCell>
      </dl>

      <div className="mt-3 rounded-lg bg-muted px-3 py-2">
        <p className="text-xs text-muted-foreground">最新自覺變化</p>
        <p className="text-sm font-medium text-foreground">
          {stats.latestSubjectiveLabel ?? (stats.hasTracks ? "未填寫" : "尚無每日追蹤紀錄")}
        </p>
      </div>

      {stats.mismatch ? <MismatchCallout /> : null}

      {associatedSymptoms.length > 0 ? (
        <p className="mt-3 text-sm text-foreground">
          <span className="font-medium">一併出現的狀況：</span>
          {associatedSymptoms.join("、")}
        </p>
      ) : null}

      {snapshot.initial_record.supplemental_description?.trim() ? (
        <p className="text-sm text-foreground">
          <span className="font-medium">補充說明：</span>
          {snapshot.initial_record.supplemental_description.trim()}
        </p>
      ) : null}
    </SectionCard>
  );

  const targetCard = snapshot.target_professional ? (
    <SectionCard title="想諮詢的對象">
      <p className="mt-3 text-base font-semibold text-foreground">{snapshot.target_professional.label}</p>
    </SectionCard>
  ) : null;

  const lifeContextCard = hasAnyLifeContext(snapshot.initial_record.life_context, tracks) ? (
    <LifeContextComparison
      initialValues={snapshot.initial_record.life_context}
      tracks={visibleLifeContextTracks}
      labels={lifeLabels}
      hiddenCount={Math.max(0, lifeContextTracks.length - 5)}
      expanded={showAllLifeContext}
      onToggle={() => setShowAllLifeContext((current) => !current)}
    />
  ) : null;

  const actions = tracks.filter((track) => (track.actions_tried?.length ?? 0) > 0);
  const actionsCard =
    actions.length > 0 ? (
      <SectionCard title="已嘗試的調整">
        <ul className="mt-3 space-y-2">
          {actions.map((track) => (
            <li key={`act-${track.track_id}`} className="text-sm text-foreground">
              <span className="font-medium">{formatTaipeiDate(track.track_date)}：</span>
              {track.actions_tried?.map((action) => action.title).join("、")}
            </li>
          ))}
        </ul>
      </SectionCard>
    ) : null;

  const safetyCard = <SafetyCard safety={snapshot.safety} />;

  const tracksCard = (
    <SectionCard
      title="每日追蹤變化"
      className="gap-5"
      description={
        stats.hasTracks
          ? `共 ${stats.trackCount} 筆紀錄，最後一次為 ${formatTaipeiDate(stats.latestTrackDate)}。`
          : "尚無每日追蹤紀錄。"
      }
    >
      {stats.hasTracks ? (
        <ul className="mt-3 space-y-3">
          {visibleTrackDetails.map((track) => (
            <li
              key={track.track_id}
              className="space-y-2 overflow-hidden rounded-lg border border-border bg-surface p-3"
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,1.3fr)_minmax(0,1fr)] sm:items-start sm:gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">日期</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatTaipeiDate(track.track_date)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">困擾程度</p>
                  <p className="text-sm font-medium text-foreground">{track.severity}/10</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">出現頻率</p>
                  <FrequencyValue
                    level={track.frequency_level}
                    wording={
                      track.frequency_label ?? frequencyLabel(track.frequency_level) ?? "未填寫"
                    }
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">自覺變化</p>
                  <p className="break-words text-sm text-foreground">
                    {track.subjective_change_label ??
                      subjectiveLabel(track.subjective_change) ??
                      "未填寫"}
                  </p>
                </div>
              </div>
              {track.frequency_description?.trim() ? (
                <p className="break-words text-sm text-foreground">
                  <span className="text-muted-foreground">頻率補充：</span>
                  {track.frequency_description.trim()}
                </p>
              ) : null}
              {(track.actions_tried?.length ?? 0) > 0 ? (
                <p className="break-words text-sm text-foreground">
                  <span className="font-medium">已嘗試的調整：</span>
                  {track.actions_tried?.map((action) => action.title).join("、")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {tracks.length > 5 ? (
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => setShowAllTrackDetails((current) => !current)}
        >
          {showAllTrackDetails ? "收合至最新 5 筆" : `展開其餘 ${tracks.length - 5} 筆`}
        </Button>
      ) : null}
    </SectionCard>
  );


  const backgroundCard =
    background.length > 0 ? (
      <SectionCard title="健康背景">
        <dl className="space-y-2">
          {background.map((item) => (
            <div key={item.code}>
              <dt className="text-sm font-medium text-foreground">{item.label}</dt>
              <dd className="text-sm text-muted-foreground">
                {backgroundContentToText(item.content) || "未記錄"}
              </dd>
            </div>
          ))}
        </dl>
      </SectionCard>
    ) : null;

  const notesCard =
    notes.length > 0 ? (
      <SectionCard title="我選擇一併提供的紀錄備註">
        <ul className="mt-3 space-y-3">
          {notes.map((note) => (
            <li key={note.track_id} className="space-y-1 text-sm text-foreground">
              <p className="font-medium">{formatTaipeiDate(note.track_date)}：</p>
              <p>{note.notes}</p>
            </li>
          ))}
        </ul>
      </SectionCard>
    ) : null;

  const questionsCard =
    questions.length > 0 ? (
      <SectionCard title="我想問的問題">
        <ol className="mt-3 space-y-1 text-sm text-foreground">
          {questions.map((question, index) => (
            <li key={index} className="flex items-start gap-2 leading-6">
              <span aria-hidden="true" className="w-5 shrink-0 text-right">
                {index + 1}.
              </span>
              <span className="min-w-0 flex-1">{question}</span>
            </li>
          ))}
        </ol>
      </SectionCard>
    ) : null;

  return (
    <div className="space-y-4">
      {isProfessional ? (

        <>
          {targetCard}
          {overview}
          {backgroundCard}
          {notesCard}
          {lifeContextCard}
          {actionsCard}
          {safetyCard}
          {tracksCard}
          {questionsCard}
        </>
      ) : (
        <>
          {overview}
          {safetyCard}
          {tracksCard}
          {lifeContextCard}
          {backgroundCard}
          {notesCard}
          {questionsCard}
        </>
      )}
      <div
        role="note"
        className="flex items-start gap-3 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground"
      >
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p>
          {snapshot.summary_type === "medical" ? (
            <>
              <span className="block sm:inline">本摘要依使用者自行記錄的資訊整理，</span>
              <span className="block sm:inline">僅供就醫溝通參考，不構成醫療診斷，</span>
              <span className="block sm:inline">不能取代醫療人員實際評估。</span>
            </>
          ) : (
            snapshot.disclaimer
          )}
        </p>
      </div>
    </div>
  );
}

function MetricCell({
  label,
  children,
  emphasis = false,
}: {
  label: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={
          emphasis
            ? "mt-2 break-words text-base font-semibold text-foreground"
            : "mt-1 break-words text-sm font-semibold text-foreground"
        }
      >
        {children}
      </dd>
    </div>
  );
}

function FiveLevelValue({
  level,
  label,
  compact = false,
}: {
  level: number | null | undefined;
  label: string;
  compact?: boolean;
}) {
  if (typeof level !== "number" || level < 1 || level > 5) {
    return <span className="text-sm text-muted-foreground">未記錄</span>;
  }
  return (
    <span
      role="img"
      aria-label={`${label} ${level}/5`}
      className={`inline-flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}
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
      <span className="whitespace-nowrap font-medium text-foreground">{level}/5</span>
    </span>
  );
}

function FrequencyValue({
  level,
  wording,
}: {
  level?: number | null;
  wording?: string | null;
}) {
  if (typeof level !== "number" || level < 1 || level > 5) {
    return <p className="text-sm text-muted-foreground">{wording || "未填寫"}</p>;
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-sm font-medium text-foreground">
        {wording || frequencyLabel(level) || "未填寫"}
      </span>
      <FiveLevelValue level={level} label="出現頻率" compact />
    </div>
  );
}

function formatFiveLevelText(level?: number | null): string {
  return typeof level === "number" && level >= 1 && level <= 5 ? `${level}/5` : "未記錄";
}

function hasNumericLifeContext(values?: Record<string, number> | null): boolean {
  return Boolean(
    values &&
      LIFE_FACTOR_ORDER.some((key) => {
        const value = values[key];
        return typeof value === "number" && value >= 1 && value <= 5;
      }),
  );
}

function hasAnyLifeContext(
  initialValues: Record<string, number> | null | undefined,
  tracks: SnapshotTrack[],
): boolean {
  return hasNumericLifeContext(initialValues) || tracks.some((track) => hasNumericLifeContext(track.life_context));
}

function LifeContextComparison({
  initialValues,
  tracks,
  labels,
  hiddenCount,
  expanded,
  onToggle,
}: {
  initialValues: Record<string, number> | null | undefined;
  tracks: SnapshotTrack[];
  labels: Record<string, string>;
  hiddenCount: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const sources = [
    ...tracks
      .filter((track) => hasNumericLifeContext(track.life_context))
      .map((track) => ({
        key: track.track_id,
        label: formatTaipeiDate(track.track_date),
        values: track.life_context,
      })),
    ...(hasNumericLifeContext(initialValues)
      ? [{ key: "initial", label: "建立狀況追蹤當日", values: initialValues }]
      : []),
  ];

  if (sources.length === 0) return null;

  return (
    <SectionCard
      title="生活狀況"
      description="依你在紀錄中填寫的生活因素整理。"
      className="gap-5"
    >
      <div className="mt-3 hidden overflow-x-auto md:block">
        <table className="min-w-max border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-24 border-b border-border bg-surface-elevated px-3 py-2 text-xs font-medium text-muted-foreground">
                生活因素
              </th>
              {sources.map((source) => (
                <th
                  key={source.key}
                  className="min-w-28 border-b border-border px-2 py-2 text-xs font-medium text-muted-foreground"
                >
                  {source.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LIFE_FACTOR_ORDER.map((factor) => (
              <tr key={factor}>
                <th className="sticky left-0 z-10 border-b border-border bg-surface-elevated px-3 py-3 text-sm font-medium text-foreground">
                  {labels[factor] ?? factor}
                </th>
                {sources.map((source) => (
                  <td key={source.key} className="border-b border-border px-3 py-3">
                    <FiveLevelValue
                      level={source.values?.[factor]}
                      label={`${source.label} ${labels[factor] ?? factor}`}
                      compact
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 space-y-3 md:hidden">
        {sources.map((source) => (
          <section key={source.key} className="rounded-lg border border-border bg-surface p-3">
            <h3 className="text-sm font-semibold text-foreground">{source.label}</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {LIFE_FACTOR_ORDER.map((factor) => (
                <div key={factor} className="min-w-0">
                  <p className="text-xs text-muted-foreground">{labels[factor] ?? factor}</p>
                  <FiveLevelValue
                    level={source.values?.[factor]}
                    label={`${source.label} ${labels[factor] ?? factor}`}
                    compact
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {hiddenCount > 0 ? (
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onToggle}>
          {expanded ? "收合至最新 5 筆" : `展開其餘 ${hiddenCount} 筆`}
        </Button>
      ) : null}
    </SectionCard>
  );
}

function SafetyCard({ safety }: { safety: SummarySnapshot["safety"] }) {
  const lines = safetyLines(safety);
  const urgent = safety.result === "priority_care";
  const warnings = safety.warnings ?? [];

  if (urgent) {
    return (
      <section
        role="alert"
        aria-labelledby="summary-safety-title"
        className="rounded-xl border-2 border-urgent bg-urgent-muted p-5 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-urgent-strong" />
          <div className="min-w-0 space-y-2">
            <h2 id="summary-safety-title" className="text-base font-bold text-urgent-strong">
              安全確認
            </h2>
            {lines.map((line) => (
              <p key={line} className="text-sm font-medium text-foreground">
                {line}
              </p>
            ))}
            {warnings.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                {warnings.map((warning) => (
                  <li key={warning.code}>{warning.label}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <SectionCard title="安全確認">
      <div className="mt-2 space-y-2">
        {lines.map((line) => (
          <p key={line} className="text-sm text-foreground">
            {line}
          </p>
        ))}
        {warnings.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
            {warnings.map((warning) => (
              <li key={warning.code}>{warning.label}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </SectionCard>
  );
}

function MismatchCallout() {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-caution bg-caution-muted p-3 text-sm text-foreground">
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-caution-strong" />
      <span>{MISMATCH_NOTICE}</span>
    </p>
  );
}
