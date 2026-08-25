import { useEffect, useMemo, useRef, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
  PrimaryCta,
  SectionCard,
} from "@/components/shell";
import { Button } from "@/components/ui/button";

import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/events/FieldError";
import { SeveritySlider } from "@/components/events/SeveritySlider";
import { SubjectiveChangeField } from "@/components/events/SubjectiveChangeField";
import { UnsavedChangesGuard } from "@/components/profile/UnsavedChangesGuard";
import { useGuideSafetyGate } from "@/hooks/useGuideSafetyGate";
import {
  useSaveDailyTrack,
  useTodayTrack,
  useTrackEvent,
  useTrackGuide,
  usePreviousTrack,
} from "@/hooks/useDailyTrack";
import {
  DAILY_FREQUENCY_OPTIONS,
  DAILY_TRACK_FIELD_ORDER,
  FREQ_DESC_MAX,
  LIFE_CONTEXT_FIELDS,
  NOTES_MAX,
  SUGGESTION_MAX,
  createEmptyDailyTrackForm,
  isDailyTrackDirty,
  validateDailyTrack,
  type DailyTrackErrors,
  type DailyTrackFormValues,
} from "@/lib/daily-track";

export const Route = createFileRoute("/_app/events/$eventId/track/today")({
  head: () => ({
    meta: [
      { title: "今日追蹤 — NexNav" },
      {
        name: "description",
        content: "NexNav 狀況歷程：記錄目前的不適與生活狀況，方便持續觀察變化。",
      },
      { property: "og:title", content: "今日追蹤 — NexNav" },
      {
        property: "og:description",
        content: "NexNav 狀況歷程：記錄目前的不適與生活狀況，方便持續觀察變化。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function TrackHeader({ completed = false }: { completed?: boolean }) {
  return (
    <PageHeader
      title="今日追蹤"
      description="記錄目前的不適與生活狀況，方便持續觀察變化。"
      actions={
        completed ? (
          <span className="inline-flex items-center whitespace-nowrap rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            今日已完成
          </span>
        ) : (
          <span className="inline-flex items-center whitespace-nowrap rounded-full border border-border bg-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground">
            尚未完成
          </span>
        )
      }
    />
  );
}

/** 補充輸入框：預設兩行，內容增加時自動增高。 */
function AutoGrowTextarea({
  textareaRef,
  value,
  ...props
}: React.ComponentProps<typeof Textarea> & {
  textareaRef?: React.RefObject<HTMLTextAreaElement | null> | undefined;
}) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  const resize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    resize(innerRef.current);
  }, [value]);

  return (
    <Textarea
      {...props}
      rows={2}
      value={value}
      ref={(node) => {
        innerRef.current = node;
        if (textareaRef) textareaRef.current = node;
      }}
      className="resize-none overflow-hidden"
      onInput={(e) => resize(e.currentTarget)}
    />
  );
}


function Page() {
  const { eventId } = Route.useParams();

  const eventQuery = useTrackEvent(eventId);
  const event = eventQuery.data ?? null;
  const isActive = event?.status === "active";
  const workflowGateQuery = useGuideSafetyGate(eventId);

  const todayQuery = useTodayTrack(eventId, !!event && isActive);
  const previousQuery = usePreviousTrack(eventId, !!event && isActive);
  const todayReady = todayQuery.isSuccess;
  const todayTrack = todayQuery.data ?? null;

  const guideQuery = useTrackGuide({
    eventId,
    todayTrack,
    enabled: !!event && isActive && todayReady,
  });

  const [values, setValues] = useState<DailyTrackFormValues | null>(null);
  const [baseline, setBaseline] = useState<DailyTrackFormValues | null>(null);
  const [errors, setErrors] = useState<DailyTrackErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const initialized = useRef(false);

  const refs = {
    severity: useRef<HTMLDivElement | null>(null),
    frequencyLevel: useRef<HTMLInputElement | null>(null),
    frequencyDescription: useRef<HTMLTextAreaElement | null>(null),
    subjectiveChange: useRef<HTMLInputElement | null>(null),
    sleep: useRef<HTMLInputElement | null>(null),
    diet: useRef<HTMLInputElement | null>(null),
    activity: useRef<HTMLInputElement | null>(null),
    stress: useRef<HTMLInputElement | null>(null),
    suggestionExecution: useRef<HTMLInputElement | null>(null),
    notes: useRef<HTMLTextAreaElement | null>(null),
  };

  // Form initialization 只執行一次；較晚完成的 query 不覆蓋使用者輸入。
  useEffect(() => {
    if (initialized.current) return;
    if (!todayReady) return;
    const initial = todayTrack ? { ...todayTrack.values } : createEmptyDailyTrackForm();
    initialized.current = true;
    setValues(initial);
    setBaseline(initial);
  }, [todayReady, todayTrack]);

  const suggestions = guideQuery.data?.suggestions ?? [];
  const allowedCodes = useMemo(
    () => suggestions.slice(0, SUGGESTION_MAX).map((s) => s.code),
    [suggestions],
  );
  const showSuggestions = allowedCodes.length > 0;

  const saveMutation = useSaveDailyTrack(eventId);

  const dirty = values !== null && baseline !== null && isDailyTrackDirty(values, baseline);

  function set<K extends keyof DailyTrackFormValues>(key: K, value: DailyTrackFormValues[K]) {
    setSuccessMessage(null);
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function focusFirstError(next: DailyTrackErrors) {
    const field = DAILY_TRACK_FIELD_ORDER.find((f) => next[f]);
    if (!field) return;
    const node = refs[field].current as HTMLElement | null;
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    if (typeof (node as HTMLInputElement).focus === "function") {
      (node as HTMLInputElement).focus({ preventScroll: true });
    }
  }

  function handleSave() {
    if (!values) return;
    setSaveError(null);
    setSuccessMessage(null);
    const next = validateDailyTrack(values, allowedCodes);
    setErrors(next);
    if (Object.keys(next).length > 0) {
      focusFirstError(next);
      return;
    }

    saveMutation.mutate(
      {
        values,
        existing: todayTrack,
        guideId: todayTrack ? todayTrack.guideId : (guideQuery.data?.guideId ?? null),
      },
      {
        onSuccess: (result) => {
          setBaseline({ ...values });
          setSuccessMessage(result.mode === "insert" ? "今日追蹤已儲存" : "今日追蹤已更新");
        },
        onError: () => {
          setSaveError("目前無法儲存今日追蹤，請稍後再試一次。");
        },
      },
    );
  }

  // ── 狀態畫面 ────────────────────────────────────────────────
  if (eventQuery.isLoading) {
    return (
      <PageContainer width="default" className="space-y-6">
        <TrackHeader />
        <LoadingState label="載入今日追蹤中…" />
      </PageContainer>
    );
  }

  if (eventQuery.isError) {
    return (
      <PageContainer width="default" className="space-y-6">
        <TrackHeader />
        <ErrorState
          title="目前無法取得今日追蹤"
          description="請稍後再試一次。"
          retryLabel="再試一次"
          onRetry={() => void eventQuery.refetch()}
        />
      </PageContainer>
    );
  }

  if (!event) {
    return (
      <PageContainer width="default" className="space-y-6">
        <TrackHeader />
        <ErrorState
          title="找不到這項狀況追蹤"
          description="這項紀錄可能不存在，或不屬於目前的帳號。"
        />
      </PageContainer>
    );
  }

  if (!isActive) {
    return (
      <PageContainer width="default" className="space-y-6">
        <TrackHeader />
        <SectionCard
          title="這項狀況追蹤已結束"
          description="已結束的狀況無法新增或修改今日追蹤。"
          footer={
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/events/$eventId" params={{ eventId }}>
                返回狀況總覽
              </Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (workflowGateQuery.isLoading) {
    return (
      <PageContainer width="default" className="space-y-6">
        <TrackHeader />
        <LoadingState label="確認追蹤流程中…" />
      </PageContainer>
    );
  }

  if (workflowGateQuery.isError) {
    return (
      <PageContainer width="default" className="space-y-6">
        <TrackHeader />
        <ErrorState
          title="目前無法確認追蹤流程"
          description="請稍後再試一次。"
          retryLabel="再試一次"
          onRetry={() => void workflowGateQuery.refetch()}
        />
      </PageContainer>
    );
  }

  const safetyResult = workflowGateQuery.data?.currentResult ?? null;

  if (safetyResult === null) {
    return (
      <PageContainer width="default" className="space-y-6">
        <TrackHeader />
        <SectionCard
          title="請先完成目前的狀況確認"
          description="需要先確認目前是否有應優先處理的安全警訊，才能開始每日追蹤。"
          footer={
            <Button asChild className="min-h-11">
              <Link to="/events/$eventId/safety" params={{ eventId }}>
                先完成狀況確認
              </Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (safetyResult !== "normal") {
    return (
      <PageContainer width="default" className="space-y-6">
        <TrackHeader />
        <SectionCard
          title="目前請優先查看專業協助方向"
          description="依目前的狀況確認結果，請先參考就醫與專業協助，再決定後續行動。"
          footer={
            <Button asChild className="min-h-11">
              <Link to="/events/$eventId/navigate" params={{ eventId }}>
                查看就醫與專業協助
              </Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const guideBlocking = todayTrack?.guideId ? guideQuery.isError : false;

  if (todayQuery.isError || guideBlocking) {
    return (
      <PageContainer width="default" className="space-y-6">
        <TrackHeader />
        <ErrorState
          title="目前無法取得今日追蹤"
          description="請稍後再試一次。"
          retryLabel="再試一次"
          onRetry={() => {
            void todayQuery.refetch();
            void guideQuery.refetch();
          }}
        />
      </PageContainer>
    );
  }

  if (!values || todayQuery.isLoading || guideQuery.isLoading) {
    return (
      <PageContainer width="default" className="space-y-6">
        <TrackHeader />
        <LoadingState label="載入今日追蹤中…" />
      </PageContainer>
    );
  }

  if (!guideQuery.data?.guideId) {
    return (
      <PageContainer width="default" className="space-y-6">
        <TrackHeader />
        <SectionCard
          title="請先查看目前的改善方向"
          description="每日追蹤會依目前版本的改善方向記錄已嘗試的調整。"
          footer={
            <Button asChild className="min-h-11">
              <Link to="/events/$eventId/guide" params={{ eventId }}>
                先查看改善方向
              </Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const comparisonLabel = previousQuery.data
    ? "與上一次追蹤相比"
    : "與建立狀況追蹤時的初始感受相比";

  const isUpdate = todayTrack !== null;
  const ctaLabel = saveMutation.isPending ? "<儲存中>" : isUpdate ? "更新今日追蹤" : "儲存今日追蹤";

  function toggleSuggestion(code: string) {
    if (!values) return;
    const has = values.suggestionExecution.includes(code);
    if (!has && values.suggestionExecution.length >= SUGGESTION_MAX) return;
    set(
      "suggestionExecution",
      has
        ? values.suggestionExecution.filter((c) => c !== code)
        : [...values.suggestionExecution, code],
    );
  }

  return (
    <PageContainer width="default" className="space-y-6">
      <UnsavedChangesGuard enabled={dirty && !saveMutation.isPending} />
      <TrackHeader completed={isUpdate || successMessage !== null} />

      {/* Section 1：不適與比較 */}
      <SectionCard title="今天不適症狀的困擾程度">
        <div className="grid gap-6 lg:grid-cols-2">
          <div ref={refs.severity} className="space-y-2">
            <SeveritySlider
              id="daily-severity"
              value={values.severity}
              onChange={(next) => set("severity", next)}
              invalid={!!errors.severity}
              describedBy={errors.severity ? "daily-severity-error" : undefined}
            />
            <FieldError id="daily-severity-error" message={errors.severity} />
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold text-foreground">發生頻率</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {DAILY_FREQUENCY_OPTIONS.map((option, index) => (
                <label
                  key={option.value}
                  className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent"
                >
                  <input
                    type="radio"
                    name="daily-frequency"
                    ref={index === 0 ? refs.frequencyLevel : undefined}
                    className="h-4 w-4 shrink-0 accent-primary"
                    checked={values.frequencyLevel === option.value}
                    onChange={() => set("frequencyLevel", option.value)}
                    aria-describedby={errors.frequencyLevel ? "daily-frequency-error" : undefined}
                  />
                  <span className="min-w-0">{option.label}</span>
                </label>
              ))}
            </div>
            <FieldError id="daily-frequency-error" message={errors.frequencyLevel} />
          </fieldset>
        </div>

        <div className="space-y-1.5 pt-2">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="daily-frequency-desc" className="text-sm font-medium text-foreground">
              頻率補充（選填）
            </label>
            <span
              id="daily-frequency-desc-hint"
              className="shrink-0 text-xs tabular-nums text-muted-foreground"
            >
              {values.frequencyDescription.length} / {FREQ_DESC_MAX}
            </span>
          </div>
          <AutoGrowTextarea
            id="daily-frequency-desc"
            textareaRef={refs.frequencyDescription}
            value={values.frequencyDescription}
            maxLength={FREQ_DESC_MAX}
            onChange={(e) => set("frequencyDescription", e.target.value)}
            aria-invalid={!!errors.frequencyDescription || undefined}
            aria-describedby="daily-frequency-desc-hint"
          />
          <FieldError id="daily-frequency-desc-error" message={errors.frequencyDescription} />
        </div>


        <div className="pt-2">
          <SubjectiveChangeField
            value={values.subjectiveChange}
            onChange={(next) => set("subjectiveChange", next)}
            comparisonLabel={comparisonLabel}
            error={errors.subjectiveChange}
            firstOptionRef={refs.subjectiveChange}
          />
        </div>
      </SectionCard>

      {/* Section 2：生活狀況 */}
      <SectionCard
        title="生活狀況"
        description="以下四項皆為必填，僅用於整理紀錄，不代表任何健康判斷。"
      >
        {LIFE_CONTEXT_FIELDS.map((field) => (
          <fieldset
            key={field.key}
            className="space-y-2 border-t border-border pt-4 first:border-0 first:pt-0"
          >
            <legend className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <span aria-hidden="true" className="inline-block h-4 w-1 shrink-0 rounded-full bg-primary" />
              <span className="min-w-0">{field.label}</span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {field.options.map((option, index) => (
                <label
                  key={option.value}
                  className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent"
                >
                  <input
                    type="radio"
                    name={`daily-life-${field.key}`}
                    ref={index === 0 ? refs[field.key] : undefined}
                    className="h-4 w-4 shrink-0 accent-primary"
                    checked={values[field.key] === option.value}
                    onChange={() => set(field.key, option.value)}
                    aria-describedby={
                      errors[field.key] ? `daily-life-${field.key}-error` : undefined
                    }
                  />
                  <span className="min-w-0">{option.label}</span>
                </label>
              ))}
            </div>
            <FieldError id={`daily-life-${field.key}-error`} message={errors[field.key]} />
          </fieldset>
        ))}

      </SectionCard>

      {/* Section 3：改善建議 */}
      {showSuggestions ? (
        <SectionCard
          title="已嘗試的調整（選填）"
          description="可勾選本次有實際嘗試的項目。"
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {suggestions.slice(0, SUGGESTION_MAX).map((suggestion, index) => (
              <label
                key={suggestion.code}
                className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent"
              >
                <input
                  type="checkbox"
                  ref={index === 0 ? refs.suggestionExecution : undefined}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  checked={values.suggestionExecution.includes(suggestion.code)}
                  onChange={() => toggleSuggestion(suggestion.code)}
                />
                <span className="min-w-0 leading-relaxed">{suggestion.title}</span>
              </label>
            ))}
          </div>
          <FieldError id="daily-suggestion-error" message={errors.suggestionExecution} />
        </SectionCard>
      ) : null}

      {/* Section 4：補充紀錄 */}
      <SectionCard description="記下其他想補充的狀況。">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="daily-notes" className="text-sm font-medium text-foreground">
              補充紀錄（選填）
            </label>
            <span
              id="daily-notes-hint"
              className="shrink-0 text-xs tabular-nums text-muted-foreground"
            >
              {values.notes.length} / {NOTES_MAX}
            </span>
          </div>
          <AutoGrowTextarea
            id="daily-notes"
            textareaRef={refs.notes}
            maxLength={NOTES_MAX}
            value={values.notes}
            placeholder="例如：今天不適較明顯的時間、活動或其他想記錄的變化"
            onChange={(e) => set("notes", e.target.value)}
            aria-invalid={!!errors.notes || undefined}
            aria-describedby="daily-notes-hint"
          />
          <FieldError id="daily-notes-error" message={errors.notes} />
        </div>

        <div className="space-y-3 pt-2">
          <PrimaryCta
            className="min-h-13 rounded-xl sm:min-w-64"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {ctaLabel}
          </PrimaryCta>

          {successMessage ? (
            <section
              role="status"
              className="rounded-xl border border-heal/40 bg-heal-muted/60 p-4"
            >
              <p className="text-sm font-semibold text-foreground">{successMessage}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {previousQuery.data
                  ? "你可以前往追蹤變化，查看目前的紀錄趨勢。"
                  : "紀錄已保留；持續追蹤後即可查看變化趨勢。"}
              </p>
              <Button asChild variant="outline" className="mt-3 min-h-11 w-full sm:w-auto">
                <Link to="/events/$eventId/reassess" params={{ eventId }}>
                  查看追蹤變化
                </Link>
              </Button>
            </section>
          ) : null}
          {saveError ? (
            <p role="alert" className="text-sm text-destructive">
              {saveError}
            </p>
          ) : null}
        </div>
      </SectionCard>
    </PageContainer>
  );
}
