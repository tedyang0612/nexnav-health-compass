import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  PageContainer,
  PageHeader,
  SectionCard,
  StatusBanner,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/profile/Spinner";
import { UnsavedChangesGuard } from "@/components/profile/UnsavedChangesGuard";
import { StepSymptom } from "@/components/events/StepSymptom";
import { StepContext } from "@/components/events/StepContext";
import { StepReview } from "@/components/events/StepReview";
import { useSymptomCatalog } from "@/hooks/useSymptomCatalog";
import {
  CREATING_LABEL,
  STEP1_FIELD_ORDER,
  STEP2_FIELD_ORDER,
  buildRpcPayload,
  createEmptyForm,
  isFormDirty,
  mapCreateEventError,
  validateStep1,
  validateStep2,
  type EventFormValues,
  type SafeError,
  type Step1Errors,
  type Step2Errors,
} from "@/lib/event-wizard";

export const Route = createFileRoute("/_app/events/new")({
  head: () => ({
    meta: [
      { title: "新增狀況追蹤 — NexNav" },
      {
        name: "description",
        content: "以三個步驟建立狀況追蹤，記錄主要不適、相關症狀與生活狀況。",
      },
      { property: "og:title", content: "新增狀況追蹤 — NexNav" },
      {
        property: "og:description",
        content: "以三個步驟建立狀況追蹤，記錄主要不適、相關症狀與生活狀況。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewEventPage,
});

const STEP_TITLES = ["主要不適症狀", "相關症狀與生活狀況", "確認初始紀錄"] as const;

function NewEventPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const catalog = useSymptomCatalog();
  const options = catalog.data ?? [];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [values, setValues] = useState<EventFormValues>(createEmptyForm);
  const [step1Errors, setStep1Errors] = useState<Step1Errors>({});
  const [step2Errors, setStep2Errors] = useState<Step2Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SafeError | null>(null);
  const [leaving, setLeaving] = useState(false);

  const submittingRef = useRef(false);

  const step1Refs = {
    primarySymptomId: useRef<HTMLInputElement | null>(null),
    customPrimarySymptom: useRef<HTMLInputElement | null>(null),
    startedOn: useRef<HTMLInputElement | null>(null),
    severity: useRef<HTMLDivElement | null>(null),
    frequencyLevel: useRef<HTMLInputElement | null>(null),
    frequencyDescription: useRef<HTMLTextAreaElement | null>(null),
    durationValue: useRef<HTMLInputElement | null>(null),
    durationUnit: useRef<HTMLSelectElement | null>(null),
  };

  const step2Refs = {
    customAssociatedSymptoms: useRef<HTMLInputElement | null>(null),
    sleep: useRef<HTMLInputElement | null>(null),
    diet: useRef<HTMLInputElement | null>(null),
    activity: useRef<HTMLInputElement | null>(null),
    stress: useRef<HTMLInputElement | null>(null),
    supplementalDescription: useRef<HTMLTextAreaElement | null>(null),
  };

  const dirty = isFormDirty(values);

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setStep1Errors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key as keyof Step1Errors];
      return next;
    });
    setStep2Errors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key as keyof Step2Errors];
      return next;
    });
    setSubmitError(null);
  }

  function goStep1(errors: Step1Errors) {
    setStep(1);
    window.requestAnimationFrame(() => {
      const first = STEP1_FIELD_ORDER.find((f) => errors[f]);
      if (first) step1Refs[first].current?.focus();
    });
  }

  function goStep2(errors: Step2Errors) {
    setStep(2);
    window.requestAnimationFrame(() => {
      const first = STEP2_FIELD_ORDER.find((f) => errors[f]);
      if (first) step2Refs[first].current?.focus();
    });
  }

  function handleNext() {
    if (step === 1) {
      const errors = validateStep1(values, options);
      setStep1Errors(errors);
      if (Object.keys(errors).length > 0) {
        goStep1(errors);
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      const errors = validateStep2(values);
      setStep2Errors(errors);
      if (Object.keys(errors).length > 0) {
        goStep2(errors);
        return;
      }
      setStep(3);
    }
  }

  async function handleCreate() {
    if (submittingRef.current) return;

    const errors1 = validateStep1(values, options);
    if (Object.keys(errors1).length > 0) {
      setStep1Errors(errors1);
      goStep1(errors1);
      return;
    }
    const errors2 = validateStep2(values);
    if (Object.keys(errors2).length > 0) {
      setStep2Errors(errors2);
      goStep2(errors2);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const { data, error } = await supabase.rpc(
        "create_health_event",
        buildRpcPayload(values, options),
      );

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : null;
      if (!row?.health_event_id || !row?.initial_record_id) {
        setSubmitError({
          kind: "generic",
          message: "目前無法建立狀況追蹤，請稍後再試。",
        });
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["health-events"] });

      setLeaving(true);
      navigate({
        to: "/events/$eventId/safety",
        params: { eventId: row.health_event_id },
        replace: true,
      });
    } catch (err) {
      const mapped = mapCreateEventError(err);
      setSubmitError(mapped);
      if (mapped.step === 1) goStep1(validateStep1(values, options));
      if (mapped.step === 2) goStep2(validateStep2(values));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const catalogReady = !catalog.isPending && !catalog.isError && options.length > 0;

  return (
    <PageContainer width="narrow" className="space-y-6">
      <UnsavedChangesGuard enabled={dirty && !leaving && !submitting} />

      <PageHeader
        title="新增狀況追蹤"
        description={`步驟 ${step}／3：${STEP_TITLES[step - 1]}`}
      />

      <ol className="flex flex-col gap-2 sm:flex-row sm:gap-3" aria-label="流程步驟">
        {STEP_TITLES.map((title, index) => {
          const value = (index + 1) as 1 | 2 | 3;
          const state =
            value === step ? "目前步驟" : value < step ? "已完成" : "尚未開始";
          return (
            <li
              key={title}
              aria-current={value === step ? "step" : undefined}
              className={
                "flex-1 rounded-md border px-3 py-2 text-sm " +
                (value === step
                  ? "border-primary bg-accent font-medium text-foreground"
                  : "border-border text-muted-foreground")
              }
            >
              <span>
                {value}. {title}
              </span>
              <span className="block text-xs">{state}</span>
            </li>
          );
        })}
      </ol>

      {catalog.isPending ? (
        <SectionCard>
          <LoadingState label="載入症狀選項中…" />
        </SectionCard>
      ) : catalog.isError ? (
        <ErrorState
          title="目前無法載入症狀選項，請稍後再試。"
          description="請確認網路連線後重新嘗試。"
          onRetry={() => catalog.refetch()}
        />
      ) : options.length === 0 ? (
        <EmptyState
          title="目前無法載入症狀選項，請稍後再試。"
          action={
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => catalog.refetch()}
            >
              重新載入
            </Button>
          }
        />
      ) : (
        <>
          {submitError ? (
            <StatusBanner
              tone="attention"
              label="無法建立"
              title={submitError.message}
              actions={
                submitError.kind === "auth" ? (
                  <Button
                    variant="outline"
                    className="min-h-11"
                    onClick={() => {
                      setLeaving(true);
                      navigate({ to: "/login" });
                    }}
                  >
                    返回登入
                  </Button>
                ) : submitError.kind === "onboarding" ? (
                  <Button
                    variant="outline"
                    className="min-h-11"
                    onClick={() => {
                      setLeaving(true);
                      navigate({ to: "/onboarding" });
                    }}
                  >
                    前往完成基本健康檔案
                  </Button>
                ) : null
              }
            />
          ) : null}

          {step === 1 ? (
            <StepSymptom
              values={values}
              errors={step1Errors}
              options={options}
              set={set}
              refs={step1Refs}
            />
          ) : step === 2 ? (
            <StepContext
              values={values}
              errors={step2Errors}
              options={options}
              set={set}
              refs={step2Refs}
            />
          ) : (
            <StepReview
              values={values}
              options={options}
              disabled={submitting}
              onEditStep={(target) => setStep(target)}
            />
          )}

          <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
            {step < 3 ? (
              <Button
                size="lg"
                className="min-h-11 w-full sm:w-auto"
                disabled={!catalogReady}
                onClick={handleNext}
              >
                下一步
              </Button>
            ) : (
              <Button
                size="lg"
                className="min-h-11 w-full sm:w-auto"
                disabled={submitting}
                onClick={handleCreate}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner />
                    <span>{CREATING_LABEL}</span>
                  </span>
                ) : (
                  "建立狀況追蹤"
                )}
              </Button>
            )}

            {step > 1 ? (
              <Button
                variant="outline"
                size="lg"
                className="min-h-11 w-full sm:w-auto"
                disabled={submitting}
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              >
                上一步
              </Button>
            ) : null}
          </div>
        </>
      )}
    </PageContainer>
  );
}
