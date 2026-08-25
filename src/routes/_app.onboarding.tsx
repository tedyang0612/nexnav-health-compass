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
import { Spinner } from "@/components/profile/Spinner";
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

  async function handleComplete(overrides?: Partial<ProfileFormValues>) {
    if (saving) return;
    if (!ensureStep1Valid()) return;
    const payload: ProfileFormValues = { ...values, ...overrides };

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
          display_name: payload.displayName.trim(),
          birth_year: Number(payload.birthYear),
          gender: payload.gender,
          health_background: buildHealthBackground(payload),
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
        title="個人資料"
        description="只要兩個步驟，建立您的基本健康檔案。"
      />

      <div
        className="grid w-full max-w-[250px] grid-cols-2 gap-2"
        role="group"
        aria-label="設定步驟進度"
      >
        <span
          className={
            step === 1
              ? "h-1.5 rounded-full bg-gradient-to-r from-heal to-primary"
              : "h-1.5 rounded-full bg-heal"
          }
        />
        <span
          className={
            step === 2
              ? "h-1.5 rounded-full bg-gradient-to-r from-heal to-primary"
              : "h-1.5 rounded-full bg-muted"
          }
        />
        <span className="sr-only">目前為步驟 {step}／2</span>
      </div>


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
          title="步驟 1：基本健康檔案"
          description="這些資訊將用於建立您的個人檔案。"
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
          title="步驟 2：健康背景（選填）"
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
                    const skipped = {
                      chronicConditions: "",
                      allergies: "",
                      medications: "",
                      otherNotes: "",
                    };
                    setValues((prev) => ({ ...prev, ...skipped }));
                    void handleComplete(skipped);
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
                      {SAVING_LABEL}
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
