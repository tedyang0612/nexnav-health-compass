import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  ErrorState,
  LoadingState,
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
  profileRowToForm,
  validateStep1,
  validateStep1Field,
  type ProfileFormValues,
  type Step1Errors,
  type Step1Field,
} from "@/lib/profile-form";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "健康檔案 — NexNav" },
      {
        name: "description",
        content: "檢視並更新您的 NexNav 健康檔案，包含基本資料與健康背景。",
      },
      { property: "og:title", content: "健康檔案 — NexNav" },
      {
        property: "og:description",
        content: "檢視並更新您的 NexNav 健康檔案，包含基本資料與健康背景。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile-detail", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, birth_year, gender, health_background")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("profile-missing");
      return data;
    },
  });

  const [initialValues, setInitialValues] =
    useState<ProfileFormValues>(EMPTY_FORM);
  const [values, setValues] = useState<ProfileFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Step1Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const displayNameRef = useRef<HTMLInputElement | null>(null);
  const birthYearRef = useRef<HTMLSelectElement | null>(null);
  const genderRef = useRef<HTMLSelectElement | null>(null);
  const refs = {
    displayName: displayNameRef,
    birthYear: birthYearRef,
    gender: genderRef,
  };

  const row = profileQuery.data;

  useEffect(() => {
    if (!row) return;
    const next = profileRowToForm(row);
    setInitialValues(next);
    setValues(next);
    setErrors({});
  }, [row]);

  const dirty = !formsEqual(values, initialValues);

  function handleChange(field: keyof ProfileFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field as Step1Field];
      return next;
    });
    setSaveError(null);
    setSaved(false);
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

  async function handleSave() {
    if (saving || !dirty) return;

    const nextErrors = validateStep1(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const first = STEP1_FIELDS.find((f) => nextErrors[f]);
      if (first) refs[first].current?.focus();
      return;
    }

    if (!userId) {
      setSaveError(SAVE_MISSING_PROFILE_MESSAGE);
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      // 只更新可編輯欄位；不觸碰 onboarding_completed／onboarding_completed_at。
      const { data, error } = await supabase
        .from("profiles")
        .update({
          display_name: values.displayName.trim(),
          birth_year: Number(values.birthYear),
          gender: values.gender,
          health_background: buildHealthBackground(values),
        })
        .eq("id", userId)
        .select("id")
        .maybeSingle();

      if (error) {
        setSaveError(SAVE_ERROR_MESSAGE);
        return;
      }
      if (!data) {
        setSaveError(SAVE_MISSING_PROFILE_MESSAGE);
        return;
      }

      setInitialValues(values);
      setSaved(true);
      await queryClient.invalidateQueries({ queryKey: ["profile-detail"] });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
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
        title="健康檔案"
        description="檢視並更新您的基本資料與健康背景。"
      />

      {profileQuery.isPending ? (
        <LoadingState label="載入健康檔案中…" />
      ) : profileQuery.isError ? (
        <ErrorState
          title="目前無法載入健康檔案"
          description="請稍後再試一次。"
          onRetry={() => void profileQuery.refetch()}
        />
      ) : (
        <>
          {saved ? (
            <StatusBanner
              tone="info"
              label="已更新"
              title="健康檔案已儲存"
              description="您的變更已更新完成。"
            />
          ) : null}

          {saveError ? (
            <StatusBanner
              tone="attention"
              label="無法儲存"
              title={saveError}
              description="您填寫的內容已保留，可直接再試一次。"
              actions={
                <Button
                  variant="outline"
                  className="min-h-11"
                  disabled={saving}
                  onClick={() => void handleSave()}
                >
                  重試
                </Button>
              }
            />
          ) : null}

          <form
            noValidate
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
          >
            <SectionCard title="基本資料">
              <ProfileStep1Fields
                idPrefix="profile"
                values={values}
                errors={errors}
                disabled={saving}
                onChange={handleChange}
                onBlurField={handleBlurField}
                refs={refs}
              />
            </SectionCard>

            <SectionCard
              title="健康背景"
              description="以下全部為選填，可留空。"
            >
              <ProfileStep2Fields
                idPrefix="profile"
                values={values}
                disabled={saving}
                onChange={handleChange}
              />
            </SectionCard>

            <Button
              type="submit"
              size="lg"
              className="min-h-11 w-full sm:w-auto"
              disabled={!dirty || saving}
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner />
                  {SAVING_LABEL}
                </span>
              ) : (
                "儲存變更"
              )}
            </Button>
          </form>
        </>
      )}
    </PageContainer>
  );
}
