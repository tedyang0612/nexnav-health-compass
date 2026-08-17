import { FormField } from "@/components/shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DISPLAY_NAME_MAX,
  GENDER_OPTIONS,
  birthYearOptions,
  type ProfileFormValues,
  type Step1Errors,
  type Step1Field,
} from "@/lib/profile-form";

type Step1Props = {
  idPrefix: string;
  values: ProfileFormValues;
  errors: Step1Errors;
  disabled?: boolean;
  onChange: (field: keyof ProfileFormValues, value: string) => void;
  onBlurField: (field: Step1Field) => void;
  refs: {
    displayName: React.RefObject<HTMLInputElement | null>;
    birthYear: React.RefObject<HTMLSelectElement | null>;
    gender: React.RefObject<HTMLSelectElement | null>;
  };
};

const selectClass =
  "flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 md:text-sm";

function describedBy(id: string, hint: boolean, error: boolean) {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(
    Boolean,
  );
  return ids.length ? ids.join(" ") : undefined;
}

export function ProfileStep1Fields({
  idPrefix,
  values,
  errors,
  disabled,
  onChange,
  onBlurField,
  refs,
}: Step1Props) {
  const nameId = `${idPrefix}-display-name`;
  const yearId = `${idPrefix}-birth-year`;
  const genderId = `${idPrefix}-gender`;
  const years = birthYearOptions();

  return (
    <div className="space-y-5">
      <FormField
        id={nameId}
        label="顯示名稱"
        required
        hint={`1～${DISPLAY_NAME_MAX} 個字元，會顯示在 NexNav 介面中。`}
        error={errors.displayName}
      >
        <Input
          id={nameId}
          ref={refs.displayName}
          value={values.displayName}
          disabled={disabled}
          autoComplete="nickname"
          className="min-h-11"
          aria-invalid={!!errors.displayName}
          aria-describedby={describedBy(nameId, true, !!errors.displayName)}
          onChange={(e) => onChange("displayName", e.target.value)}
          onBlur={() => onBlurField("displayName")}
        />
      </FormField>

      <FormField
        id={yearId}
        label="出生年份"
        required
        hint="用於了解一般年齡區間，不需要完整生日。"
        error={errors.birthYear}
      >
        <select
          id={yearId}
          ref={refs.birthYear}
          value={values.birthYear}
          disabled={disabled}
          className={cn(selectClass)}
          aria-invalid={!!errors.birthYear}
          aria-describedby={describedBy(yearId, true, !!errors.birthYear)}
          onChange={(e) => onChange("birthYear", e.target.value)}
          onBlur={() => onBlurField("birthYear")}
        >
          <option value="">請選擇</option>
          {years.map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id={genderId} label="性別" required error={errors.gender}>
        <select
          id={genderId}
          ref={refs.gender}
          value={values.gender}
          disabled={disabled}
          className={cn(selectClass)}
          aria-invalid={!!errors.gender}
          aria-describedby={describedBy(genderId, false, !!errors.gender)}
          onChange={(e) => onChange("gender", e.target.value)}
          onBlur={() => onBlurField("gender")}
        >
          <option value="">請選擇</option>
          {GENDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}

type Step2Props = {
  idPrefix: string;
  values: ProfileFormValues;
  disabled?: boolean;
  onChange: (field: keyof ProfileFormValues, value: string) => void;
};

export function ProfileStep2Fields({
  idPrefix,
  values,
  disabled,
  onChange,
}: Step2Props) {
  const items = [
    {
      key: "chronicConditions" as const,
      label: "慢性健康狀況（選填）",
      hint: "每行填寫一項，例如長期追蹤中的狀況名稱。",
    },
    {
      key: "allergies" as const,
      label: "過敏資訊（選填）",
      hint: "每行填寫一項。",
    },
    {
      key: "medications" as const,
      label: "目前用藥（選填）",
      hint: "每行填寫一項，僅作為個人紀錄。",
    },
  ];

  return (
    <div className="space-y-5">
      {items.map((item) => {
        const id = `${idPrefix}-${item.key}`;
        return (
          <FormField key={item.key} id={id} label={item.label} hint={item.hint}>
            <Textarea
              id={id}
              rows={3}
              value={values[item.key]}
              disabled={disabled}
              aria-describedby={`${id}-hint`}
              onChange={(e) => onChange(item.key, e.target.value)}
            />
          </FormField>
        );
      })}

      <FormField
        id={`${idPrefix}-otherNotes`}
        label="其他健康背景（選填）"
        hint="想補充的其他背景資訊。"
      >
        <Textarea
          id={`${idPrefix}-otherNotes`}
          rows={4}
          value={values.otherNotes}
          disabled={disabled}
          aria-describedby={`${idPrefix}-otherNotes-hint`}
          onChange={(e) => onChange("otherNotes", e.target.value)}
        />
      </FormField>
    </div>
  );
}
