import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  PageContainer,
  PageHeader,
  SectionCard,
  StatusBanner,
} from "@/components/shell";
import { Button } from "@/components/ui/button";
import {
  ProfileStep1Fields,
  ProfileStep2Fields,
} from "@/components/profile/ProfileFields";
import { UnsavedChangesGuard } from "@/components/profile/UnsavedChangesGuard";
import {
  EMPTY_FORM,
  SAVE_ERROR_MESSAGE,
  SAVE_MISSING_PROFILE_MESSAGE,
  SAVING_LABEL,
  STEP1_FIELDS,
  buildHealthBackground,
  formsEqual,
  validateStep1,
  validateStep1Field,
  type ProfileFormValues,
  type Step1Errors,
  type Step1Field,
} from "@/lib/profile-form";

export const Route = createFileRoute("/_app/onboarding")({
  head: () => ({
    meta: [
      { title: "初次設定 — NexNav" },
      {
        name: "description",
        content: "建立您的 NexNav 基本健康檔案，只需兩個步驟即可開始使用。",
      },
      { property: "og:title", content: "初次設定 — NexNav" },
      {
        property: "og:description",
        content: "建立您的 NexNav 基本健康檔案，只需兩個步驟即可開始使用。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState<ProfileFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Step1Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const displayNameRef = useRef<HTMLInputElement | null>(null);
  const birthYearRef = useRef<HTMLSelectElement | null>(null);
  const genderRef = useRef<HTMLSelectElement | null>(null);
  const refs = {
    displayName: displayNameRef,
    birthYear: birthYearRef,
    gender: genderRef,
  };

  const dirty = !formsEqual(values, EMPTY_FORM);

  function handleChange(field: keyof ProfileFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (field in errors) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as Step1Field];
        return next;
      });
    }
    setSaveError(null);
  }

  function handleBlurField(field: Step1Field) {
    const message = validateStep1Field(field, values);
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  }

  function focusFirstInvalid(nextErrors: Step1Errors) {
    const first = STEP1_FIELDS.find((f) => nextErrors[f]);
    if (!first) return;
    refs[first].current?.focus();
  }

  /** 回傳 Step 1 是否合法，並更新錯誤與 focus。 */
  function ensureStep1Valid() {
    const nextErrors = validateStep1(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStep(1);
      window.requestAnimationFrame(() => focusFirstInvalid(nextErrors));
      return false;
    }
    return true;
  }

  async function handleComplete() {
    if (saving) return;
    if (!ensureStep1Valid()) return;

    const userId = user?.id;
    if (!userId) {
      setSaveError(SAVE_MISSING_PROFILE_MESSAGE);
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      // 只更新目前登入者「既有」的 profiles row（由 Auth Trigger 建立），不 insert／upsert。
      const { data, error } = await supabase
        .from("profiles")
        .update({
          display_name: values.displayName.trim(),
          birth_year: Number(values.birthYear),
          gender: values.gender,
          health_background: buildHealthBackground(values),
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select("id")
        .maybeSingle();

      if (error) {
        setSaveError(SAVE_ERROR_MESSAGE);
        return;
      }
      if (!data) {
        // Row 不存在或 RLS 不允許：不自動建立，顯示安全錯誤。
        setSaveError(SAVE_MISSING_PROFILE_MESSAGE);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.refetchQueries({ queryKey: ["profile", userId] });
      setValues(EMPTY_FORM); // 清除 dirty 狀態，避免離頁提醒
      navigate({ to: "/dashboard", replace: true });
    } catch {
      setSaveError(SAVE_ERROR_MESSAGE);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer width="narrow" className="space-y-6">
      <UnsavedChangesGuard enabled={dirty && !saving} />

      <PageHeader
        title="初次設定"
        description="完成兩個步驟，建立您的基本健康檔案。"
      />

      <ol
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
        aria-label="設定步驟"
      >
        {[
          { index: 1 as const, label: "基本健康檔案" },
          { index: 2 as const, label: "健康背景（選填）" },
        ].map((item) => {
          const state =
            item.index === step
              ? "進行中"
              : item.index < step
                ? "已完成"
                : "尚未開始";
          return (
            <li
              key={item.index}
              aria-current={item.index === step ? "step" : undefined}
              className={
                item.index === step
                  ? "rounded-lg border border-primary/40 bg-accent px-3 py-2 text-sm font-medium text-foreground"
                  : "rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground"
              }
            >
              步驟 {item.index}／2：{item.label}
              <span className="ml-2 text-xs">（{state}）</span>
            </li>
          );
        })}
      </ol>

      {saveError ? (
        <StatusBanner
          tone="attention"
          label="無法完成設定"
          title={saveError}
          description="您填寫的內容已保留，可直接再試一次。"
          actions={
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => void handleComplete()}
              disabled={saving}
            >
              重試
            </Button>
          }
        />
      ) : null}

      {step === 1 ? (
        <SectionCard
          title="步驟 1／2：基本健康檔案"
          description="這些資訊用於整理您的個人紀錄。"
        >
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (ensureStep1Valid()) setStep(2);
            }}
            className="space-y-6"
          >
            <ProfileStep1Fields
              idPrefix="onboarding"
              values={values}
              errors={errors}
              onChange={handleChange}
              onBlurField={handleBlurField}
              refs={refs}
            />
            <Button type="submit" size="lg" className="min-h-11 w-full sm:w-auto">
              下一步
            </Button>
          </form>
        </SectionCard>
      ) : (
        <SectionCard
          title="步驟 2／2：健康背景（選填）"
          description="這一步全部為選填，您也可以直接略過。"
        >
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void handleComplete();
            }}
            className="space-y-6"
          >
            <ProfileStep2Fields
              idPrefix="onboarding"
              values={values}
              disabled={saving}
              onChange={handleChange}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 w-full sm:w-auto"
                disabled={saving}
                onClick={() => setStep(1)}
              >
                上一步
              </Button>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 w-full sm:w-auto"
                  disabled={saving}
                  onClick={() => {
                    setValues((prev) => ({
                      ...prev,
                      chronicConditions: "",
                      allergies: "",
                      medications: "",
                      otherNotes: "",
                    }));
                    void handleComplete();
                  }}
                >
                  略過
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="min-h-11 w-full sm:w-auto"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner />
                      {"<儲存中>"}
                    </span>
                  ) : (
                    "完成設定"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </SectionCard>
      )}
    </PageContainer>
  );
}

export function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  );
}

void SAVING_LABEL;
