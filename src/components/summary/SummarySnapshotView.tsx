import { AlertTriangle, Info } from "lucide-react";
import { SectionCard } from "@/components/shell";
import {
  backgroundContentToText,
  deriveSummaryStats,
  formatTaipeiDate,
  frequencyLabel,
  MISMATCH_NOTICE,
  safetyLines,
  subjectiveLabel,
  SUMMARY_TYPE_LABEL,
  type SummarySnapshot,
} from "@/lib/summary";

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
  const tracks = [...(snapshot.daily_tracks ?? [])].sort((a, b) =>
    a.track_date.localeCompare(b.track_date),
  );
  const notes = [...(snapshot.selected_track_notes ?? [])].sort((a, b) =>
    b.track_date.localeCompare(a.track_date),
  );
  const questions = snapshot.questions ?? [];
  const background = snapshot.health_background ?? [];

  const overview = (
    <SectionCard title="狀況重點">
      <dl className="grid gap-3 sm:grid-cols-2">
        <Item label="主要不適">{snapshot.event.primary_symptom_label ?? "—"}</Item>
        <Item label="開始日期">{formatTaipeiDate(snapshot.event.started_on)}</Item>
        <Item label="追蹤期間">
          {stats.hasTracks
            ? `${formatTaipeiDate(stats.firstTrackDate)}－${formatTaipeiDate(stats.latestTrackDate)}（共 ${stats.trackCount} 筆紀錄）`
            : "尚無每日追蹤紀錄"}
        </Item>
        <Item label="困擾程度">
          {stats.hasTracks
            ? `初始 ${stats.initialSeverity} / 10 → 最新 ${stats.latestSeverity} / 10`
            : `初始 ${stats.initialSeverity} / 10（尚無每日追蹤紀錄）`}
        </Item>
        <Item label="每日追蹤出現頻率">
          {stats.hasTracks && (stats.earliestFrequency || stats.latestFrequency)
            ? `最早 ${stats.earliestFrequency ?? "—"} / 5 → 最新 ${stats.latestFrequency ?? "—"} / 5`
            : "尚無每日追蹤紀錄"}
        </Item>
        <Item label="最新自覺變化">
          {stats.latestSubjectiveLabel ?? (stats.hasTracks ? "未填寫" : "尚無每日追蹤紀錄")}
        </Item>
        {snapshot.initial_record.frequency_level ? (
          <Item label="初始紀錄頻率">
            {frequencyLabel(snapshot.initial_record.frequency_level) ??
              `${snapshot.initial_record.frequency_level} / 5`}
          </Item>
        ) : null}
        {snapshot.target_professional ? (
          <Item label="想諮詢的對象">{snapshot.target_professional.label}</Item>
        ) : null}
      </dl>
      {stats.mismatch ? <MismatchCallout /> : null}
      {(snapshot.initial_record.associated_symptoms?.length ?? 0) > 0 ? (
        <p className="text-sm text-foreground">
          一併出現的狀況：
          {snapshot.initial_record.associated_symptoms
            ?.map((s) => s.label)
            .filter(Boolean)
            .join("、")}
        </p>
      ) : null}
      {snapshot.initial_record.supplemental_description ? (
        <p className="text-sm text-foreground">
          補充說明：{snapshot.initial_record.supplemental_description}
        </p>
      ) : null}
    </SectionCard>
  );

  const lifeContextCard =
    snapshot.initial_record.life_context || tracks.some((t) => t.life_context) ? (
      <SectionCard title="生活狀況" description="依你在紀錄中填寫的生活因素整理。">
        <LifeContext values={snapshot.initial_record.life_context} labels={lifeLabels} />
        {tracks
          .filter((t) => t.life_context)
          .slice(-3)
          .map((t) => (
            <div key={`lc-${t.track_id}`}>
              <p className="text-sm font-medium text-foreground">{formatTaipeiDate(t.track_date)}</p>
              <LifeContext values={t.life_context} labels={lifeLabels} compact />
            </div>
          ))}
      </SectionCard>
    ) : null;

  const actions = tracks.filter((t) => (t.actions_tried?.length ?? 0) > 0);
  const actionsCard =
    actions.length > 0 ? (
      <SectionCard title="已嘗試的調整">
        <ul className="space-y-2">
          {actions.map((t) => (
            <li key={`act-${t.track_id}`} className="text-sm text-foreground">
              <span className="font-medium">{formatTaipeiDate(t.track_date)}：</span>
              {t.actions_tried?.map((a) => a.title).join("、")}
            </li>
          ))}
        </ul>
      </SectionCard>
    ) : null;

  const safetyCard = <SafetyCard safety={snapshot.safety} />;

  const tracksCard = (
    <SectionCard
      title="每日追蹤變化"
      description={
        stats.hasTracks
          ? `共 ${stats.trackCount} 筆紀錄，最後一次為 ${formatTaipeiDate(stats.latestTrackDate)}。`
          : "尚無每日追蹤紀錄。"
      }
    >
      {stats.hasTracks ? (
        <ul className="space-y-3">
          {tracks.map((track) => (
            <li key={track.track_id} className="rounded-lg border border-border bg-surface p-3">
              <p className="text-sm font-medium text-foreground">
                {formatTaipeiDate(track.track_date)}｜困擾程度 {track.severity} / 10
              </p>
              <p className="text-sm text-muted-foreground">
                {track.frequency_level
                  ? `出現頻率 ${track.frequency_level} / 5（${
                      track.frequency_label ?? frequencyLabel(track.frequency_level) ?? "—"
                    }）`
                  : "出現頻率未填寫"}
                ．自覺變化：
                {track.subjective_change_label ?? subjectiveLabel(track.subjective_change) ?? "未填寫"}
              </p>
              {track.frequency_description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  頻率補充：{track.frequency_description}
                </p>
              ) : null}
              {(track.actions_tried?.length ?? 0) > 0 ? (
                <p className="mt-1 text-sm text-foreground">
                  已嘗試的調整：
                  {track.actions_tried?.map((a) => a.title).join("、")}
                </p>
              ) : null}
              <LifeContext values={track.life_context} labels={lifeLabels} compact />
            </li>
          ))}
        </ul>
      ) : null}
    </SectionCard>
  );

  const optionalCards = (
    <>
      {background.length > 0 ? (
        <SectionCard title="健康背景">
          <dl className="space-y-2">
            {background.map((item) => (
              <div key={item.code}>
                <dt className="text-sm font-medium text-foreground">{item.label}</dt>
                <dd className="text-sm text-muted-foreground">
                  {backgroundContentToText(item.content) || "—"}
                </dd>
              </div>
            ))}
          </dl>
        </SectionCard>
      ) : null}

      {notes.length > 0 ? (
        <SectionCard title="我選擇一併提供的紀錄備註">
          <ul className="space-y-2">
            {notes.map((note) => (
              <li key={note.track_id} className="text-sm text-foreground">
                <span className="font-medium">{formatTaipeiDate(note.track_date)}：</span>
                {note.notes}
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      {questions.length > 0 ? (
        <SectionCard title="我想問的問題">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground">
            {questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </SectionCard>
      ) : null}
    </>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground">
        {SUMMARY_TYPE_LABEL[snapshot.summary_type]}
      </p>
      {isProfessional ? (
        <>
          {overview}
          {lifeContextCard}
          {actionsCard}
          {safetyCard}
          {tracksCard}
          {optionalCards}
        </>
      ) : (
        <>
          {overview}
          {safetyCard}
          {tracksCard}
          {lifeContextCard}
          {optionalCards}
        </>
      )}
      <p className="text-sm text-muted-foreground">{snapshot.disclaimer}</p>
    </div>
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
              平台安全確認
            </h2>
            {lines.map((line) => (
              <p key={line} className="text-sm font-medium text-foreground">
                {line}
              </p>
            ))}
            {warnings.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                {warnings.map((w) => (
                  <li key={w.code}>{w.label}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <SectionCard title="平台安全確認">
      {lines.map((line) => (
        <p key={line} className="text-sm text-foreground">
          {line}
        </p>
      ))}
      {warnings.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
          {warnings.map((w) => (
            <li key={w.code}>{w.label}</li>
          ))}
        </ul>
      ) : null}
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

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

function LifeContext({
  values,
  labels,
  compact,
}: {
  values?: Record<string, number> | null | undefined;
  labels: Record<string, string>;
  compact?: boolean;
}) {
  if (!values) return null;
  const entries = Object.entries(values).filter(([, v]) => typeof v === "number");
  if (entries.length === 0) return null;
  return (
    <p className={compact ? "mt-1 text-sm text-muted-foreground" : "text-sm text-muted-foreground"}>
      生活因素：
      {entries.map(([key, value]) => `${labels[key] ?? key} ${value}/5`).join("．")}
    </p>
  );
}
