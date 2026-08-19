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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/events/FieldError";
import { SeveritySlider } from "@/components/events/SeveritySlider";
import { SubjectiveChangeField } from "@/components/events/SubjectiveChangeField";
import { UnsavedChangesGuard } from "@/components/profile/UnsavedChangesGuard";
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
        content: "NexNav 狀況歷程：記錄今天的不適與生活狀況，觀察後續變化。",
      },
      { property: "og:title", content: "今日追蹤 — NexNav" },
      {
        property: "og:description",
        content: "NexNav 狀況歷程：記錄今天的不適與生活狀況，觀察後續變化。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function TrackHeader() {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        狀況追蹤
      </p>
      <PageHeader
        title="今日追蹤"
        description="記錄今天的不適與生活狀況，觀察後續變化。"
      />
    </div>
  );
}

function Page() {
  const { eventId } = Route.useParams();

  const eventQuery = useTrackEvent(eventId);
  const event = eventQuery.data ?? null;
  const isActive = event?.status === "active";

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
    severity: useRef<HTMLSpanElement | null>(null),
    frequencyLevel: useRef<HTMLInputElement | null>(null),
    frequencyDescription: useRef<HTMLInputElement | null>(null),
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
    const initial = todayTrack
      ? { ...todayTrack.values }
      : createEmptyDailyTrackForm();
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

  const dirty =
    values !== null && baseline !== null && isDailyTrackDirty(values, baseline);

  function set<K extends keyof DailyTrackFormValues>(
    key: K,
    value: DailyTrackFormValues[K],
  ) {
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
        guideId: todayTrack ? todayTrack.guideId : guideQuery.data?.guideId ?? null,
      },
      {
        onSuccess: (result) => {
          setBaseline({ ...values });
          setSuccessMessage(
            result.mode === "insert" ? "今日追蹤已儲存" : "今日追蹤已更新",
          );
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

  const comparisonLabel = previousQuery.data
    ? "與上一次追蹤相比"
    : "與建立狀況追蹤時的初始感受相比";

  const isUpdate = todayTrack !== null;
  const ctaLabel = saveMutation.isPending
    ? "<儲存中>"
    : isUpdate
      ? "更新今日追蹤"
      : "儲存今日追蹤";

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
      <TrackHeader />

      {/* Section 1 */}
      <SectionCard title="今天的不適狀況">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <span
              ref={refs.severity}
              className="text-base font-semibold text-foreground"
            >
              今天的困擾程度
            </span>
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
            <legend className="mb-1 text-base font-semibold text-foreground">
              今天的發生頻率
            </legend>
            <div className="space-y-2">
              {DAILY_FREQUENCY_OPTIONS.map((option, index) => (
                <label
                  key={option.value}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent"
                >
                  <input
                    type="radio"
                    name="daily-frequency"
                    ref={index === 0 ? refs.frequencyLevel : undefined}
                    className="h-4 w-4 accent-primary"
                    checked={values.frequencyLevel === option.value}
                    onChange={() => set("frequencyLevel", option.value)}
                    aria-describedby={
                      errors.frequencyLevel ? "daily-frequency-error" : undefined
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <FieldError id="daily-frequency-error" message={errors.frequencyLevel} />
          </fieldset>
        </div>

        <div className="space-y-1.5 pt-2">
          <label
            htmlFor="daily-frequency-desc"
            className="text-sm font-medium text-foreground"
          >
            頻率補充（選填）
          </label>
          <Input
            id="daily-frequency-desc"
            ref={refs.frequencyDescription}
            value={values.frequencyDescription}
            maxLength={FREQ_DESC_MAX}
            onChange={(e) => set("frequencyDescription", e.target.value)}
            className="min-h-11"
            aria-invalid={!!errors.frequencyDescription || undefined}
            aria-describedby="daily-frequency-desc-hint"
          />
          <p id="daily-frequency-desc-hint" className="text-xs text-muted-foreground">
            {values.frequencyDescription.length} / {FREQ_DESC_MAX} 個字元
          </p>
          <FieldError
            id="daily-frequency-desc-error"
            message={errors.frequencyDescription}
          />
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

      {/* Section 2 */}
      <SectionCard
        title="今天的生活狀況"
        description="以下四項皆為必填，僅用於整理紀錄，不代表任何健康判斷。"
      >
        {LIFE_CONTEXT_FIELDS.map((field) => (
          <fieldset key={field.key} className="space-y-3 pt-4 first:pt-0">
            <legend className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
              <span
                aria-hidden="true"
                className="inline-block h-4 w-1 rounded-full bg-primary"
              />
              {field.label}
            </legend>
            <div className="space-y-2">
              {field.options.map((option, index) => (
                <label
                  key={option.value}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent"
                >
                  <input
                    type="radio"
                    name={`daily-life-${field.key}`}
                    ref={index === 0 ? refs[field.key] : undefined}
                    className="h-4 w-4 accent-primary"
                    checked={values[field.key] === option.value}
                    onChange={() => set(field.key, option.value)}
                    aria-describedby={
                      errors[field.key] ? `daily-life-${field.key}-error` : undefined
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <FieldError
              id={`daily-life-${field.key}-error`}
              message={errors[field.key]}
            />
          </fieldset>
        ))}
      </SectionCard>

      {/* Section 3 */}
      {showSuggestions ? (
        <SectionCard
          title="今天嘗試的調整"
          description="可勾選今天有實際嘗試的項目。"
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
                  className="mt-0.5 h-4 w-4 accent-primary"
                  checked={values.suggestionExecution.includes(suggestion.code)}
                  onChange={() => toggleSuggestion(suggestion.code)}
                />
                <span className="min-w-0">{suggestion.title}</span>
              </label>
            ))}
          </div>
          <FieldError
            id="daily-suggestion-error"
            message={errors.suggestionExecution}
          />
        </SectionCard>
      ) : null}

      {/* Section 4 */}
      <SectionCard title="補充紀錄（選填）">
        <div className="space-y-1.5">
          <label htmlFor="daily-notes" className="text-sm font-medium text-foreground">
            其他想記錄的內容
          </label>
          <Textarea
            id="daily-notes"
            ref={refs.notes}
            rows={5}
            maxLength={NOTES_MAX}
            value={values.notes}
            placeholder="例如：今天不適較明顯的時間、活動或其他想記錄的變化"
            onChange={(e) => set("notes", e.target.value)}
            aria-invalid={!!errors.notes || undefined}
            aria-describedby="daily-notes-hint"
          />
          <p id="daily-notes-hint" className="text-xs text-muted-foreground">
            {values.notes.length} / {NOTES_MAX} 個字元
          </p>
          <FieldError id="daily-notes-error" message={errors.notes} />
        </div>

        <div className="space-y-3 pt-2">
          <PrimaryCta onClick={handleSave} disabled={saveMutation.isPending}>
            {ctaLabel}
          </PrimaryCta>
          {successMessage ? (
            <p role="status" className="text-sm font-medium text-foreground">
              {successMessage}
            </p>
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
