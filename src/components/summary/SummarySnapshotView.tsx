import { SectionCard } from "@/components/shell";
import {
  backgroundContentToText,
  formatTaipeiDate,
  safetySentence,
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
  const tracks = snapshot.daily_tracks ?? [];
  const notes = snapshot.selected_track_notes ?? [];
  const questions = snapshot.questions ?? [];
  const background = snapshot.health_background ?? [];

  return (
    <div className="space-y-4">
      <SectionCard title="狀況基本資訊">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Item label="主要不適">{snapshot.event.primary_symptom_label ?? "—"}</Item>
          <Item label="開始日期">{formatTaipeiDate(snapshot.event.started_on)}</Item>
          <Item label="目前嚴重度（0–10）">{snapshot.initial_record.severity}</Item>
          <Item label="出現頻率">{snapshot.initial_record.frequency_label ?? "—"}</Item>
          <Item label="持續時間">
            {snapshot.initial_record.duration_value}
            {snapshot.initial_record.duration_unit_label ?? snapshot.initial_record.duration_unit}
          </Item>
          {snapshot.target_professional ? (
            <Item label="想諮詢的對象">{snapshot.target_professional.label}</Item>
          ) : null}
        </dl>
        {snapshot.initial_record.frequency_description ? (
          <p className="text-sm text-muted-foreground">
            頻率補充：{snapshot.initial_record.frequency_description}
          </p>
        ) : null}
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
        <LifeContext values={snapshot.initial_record.life_context} labels={lifeLabels} />
      </SectionCard>

      <SectionCard title="平台安全確認">
        <p className="text-sm text-foreground">{safetySentence(snapshot.safety)}</p>
        {(snapshot.safety.warnings?.length ?? 0) > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
            {snapshot.safety.warnings?.map((w) => <li key={w.code}>{w.label}</li>)}
          </ul>
        ) : null}
      </SectionCard>

      <SectionCard
        title="每日追蹤變化"
        description={
          tracks.length > 0
            ? `共 ${tracks.length} 筆紀錄，最後一次為 ${formatTaipeiDate(snapshot.latest_track_date)}。`
            : "尚未有每日追蹤紀錄。"
        }
      >
        {tracks.length > 0 ? (
          <ul className="space-y-3">
            {tracks.map((track) => (
              <li key={track.track_id} className="rounded-lg border border-border bg-surface p-3">
                <p className="text-sm font-medium text-foreground">
                  {formatTaipeiDate(track.track_date)}｜嚴重度 {track.severity}／10
                </p>
                <p className="text-sm text-muted-foreground">
                  {track.frequency_label ?? "—"}．自覺變化：{track.subjective_change_label ?? "—"}
                </p>
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

      {questions.length > 0 ? (
        <SectionCard title="我想問的問題">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground">
            {questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </SectionCard>
      ) : null}

      <p className="text-sm text-muted-foreground">{snapshot.disclaimer}</p>
    </div>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

function LifeContext({
  values,
  labels,
  compact,
}: {
  values?: Record<string, number> | null;
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
