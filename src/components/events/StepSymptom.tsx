import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shell";
import { FieldError } from "./FieldError";
import { SeveritySlider } from "./SeveritySlider";
import { deriveCategories } from "@/hooks/useSymptomCatalog";
import {
  DURATION_UNITS,
  FREQUENCY_OPTIONS,
  taipeiToday,
  type DurationUnit,
  type EventFormValues,
  type Step1Errors,
  type SymptomOption,
} from "@/lib/event-wizard";

type Setter = <K extends keyof EventFormValues>(
  key: K,
  value: EventFormValues[K],
) => void;

export function StepSymptom({
  values,
  errors,
  options,
  set,
  refs,
}: {
  values: EventFormValues;
  errors: Step1Errors;
  options: SymptomOption[];
  set: Setter;
  refs: {
    primarySymptomId: React.RefObject<HTMLInputElement | null>;
    customPrimarySymptom: React.RefObject<HTMLInputElement | null>;
    startedOn: React.RefObject<HTMLInputElement | null>;
    severity: React.RefObject<HTMLDivElement | null>;
    frequencyLevel: React.RefObject<HTMLInputElement | null>;
    frequencyDescription: React.RefObject<HTMLTextAreaElement | null>;
    durationValue: React.RefObject<HTMLInputElement | null>;
    durationUnit: React.RefObject<HTMLSelectElement | null>;
  };
}) {
  const [showAll, setShowAll] = useState(false);

  const categories = deriveCategories(options);
  const heroOptions = options.filter((o) => o.is_hero_group && !o.is_other);
  const otherOptions = options.filter((o) => o.is_other);
  const normalOptions = options.filter((o) => !o.is_other);
  const listed = showAll
    ? normalOptions.filter(
        (o) => !values.categoryCode || o.category_code === values.categoryCode,
      )
    : heroOptions;

  function selectPrimary(option: SymptomOption) {
    set("primarySymptomId", option.id);
    set("categoryCode", option.is_other ? "" : option.category_code);
    if (!option.is_other) set("customPrimarySymptom", "");
    set(
      "associatedSymptomIds",
      values.associatedSymptomIds.filter((id) => id !== option.id),
    );
  }

  const selected = options.find((o) => o.id === values.primarySymptomId);
  const isOther = !!selected?.is_other;

  return (
    <div className="space-y-6">
      <SectionCard
        title="主要不適症狀"
        description="請選擇這次最想追蹤的主要不適。"
      >
        <fieldset className="space-y-3">
          <legend className="sr-only">主要不適症狀（必填）</legend>

          {showAll ? (
            <div className="space-y-1.5">
              <label
                htmlFor="category-filter"
                className="text-sm font-medium text-foreground"
              >
                分類
              </label>
              <select
                id="category-filter"
                value={values.categoryCode}
                onChange={(e) => set("categoryCode", e.target.value)}
                className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">全部分類</option>
                {categories.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div
            className="grid gap-2 sm:grid-cols-2"
            aria-describedby={
              errors.primarySymptomId ? "primary-symptom-error" : undefined
            }
          >
            {listed.map((option, index) => (
              <SymptomRadio
                key={option.id}
                name="primary-symptom"
                option={option}
                checked={values.primarySymptomId === option.id}
                onSelect={() => selectPrimary(option)}
                inputRef={index === 0 ? refs.primarySymptomId : undefined}
              />
            ))}
          </div>

          {!showAll ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
              onClick={() => setShowAll(true)}
            >
              查看全部主要不適症狀
            </Button>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            {otherOptions.map((option) => (
              <SymptomRadio
                key={option.id}
                name="primary-symptom"
                option={option}
                checked={values.primarySymptomId === option.id}
                onSelect={() => selectPrimary(option)}
              />
            ))}
          </div>

          <FieldError id="primary-symptom-error" message={errors.primarySymptomId} />
        </fieldset>

        {isOther ? (
          <div className="space-y-1.5">
            <label
              htmlFor="custom-primary"
              className="text-sm font-medium text-foreground"
            >
              請描述您的主要不適
            </label>
            <Input
              id="custom-primary"
              ref={refs.customPrimarySymptom}
              value={values.customPrimarySymptom}
              maxLength={100}
              onChange={(e) => set("customPrimarySymptom", e.target.value)}
              aria-invalid={!!errors.customPrimarySymptom || undefined}
              aria-describedby={
                errors.customPrimarySymptom ? "custom-primary-error" : "custom-primary-hint"
              }
              className="min-h-11"
            />
            <p id="custom-primary-hint" className="text-xs text-muted-foreground">
              1–100 個字元。
            </p>
            <FieldError id="custom-primary-error" message={errors.customPrimarySymptom} />
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="不適的狀況" description="以下資訊會做為初始紀錄的基準。">
        <div className="space-y-1.5">
          <label htmlFor="started-on" className="text-sm font-medium text-foreground">
            不適開始日期
          </label>
          <Input
            id="started-on"
            ref={refs.startedOn}
            type="date"
            value={values.startedOn}
            max={taipeiToday()}
            onChange={(e) => set("startedOn", e.target.value)}
            aria-invalid={!!errors.startedOn || undefined}
            aria-describedby={errors.startedOn ? "started-on-error" : "started-on-hint"}
            className="min-h-11"
          />
          <p id="started-on-hint" className="text-xs text-muted-foreground">
            可選擇今天或過去日期（以台北時間為準）。
          </p>
          <FieldError id="started-on-error" message={errors.startedOn} />
        </div>

        <div className="space-y-1.5" ref={refs.severity} tabIndex={-1}>
          <span className="text-sm font-medium text-foreground">
            目前困擾程度（1–10）
          </span>
          <SeveritySlider
            id="severity"
            value={values.severity}
            onChange={(v) => set("severity", v)}
            invalid={!!errors.severity}
            describedBy={errors.severity ? "severity-error" : undefined}
          />
          <FieldError id="severity-error" message={errors.severity} />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">
            最近的發生頻率
          </legend>
          <div className="space-y-2">
            {FREQUENCY_OPTIONS.map((option, index) => (
              <label
                key={option.value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent"
              >
                <input
                  type="radio"
                  name="frequency-level"
                  ref={index === 0 ? refs.frequencyLevel : undefined}
                  className="h-4 w-4 accent-primary"
                  checked={values.frequencyLevel === option.value}
                  onChange={() => set("frequencyLevel", option.value)}
                  aria-describedby={
                    errors.frequencyLevel ? "frequency-error" : undefined
                  }
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <FieldError id="frequency-error" message={errors.frequencyLevel} />
        </fieldset>

        <div className="space-y-1.5">
          <label
            htmlFor="frequency-description"
            className="text-sm font-medium text-foreground"
          >
            頻率補充描述（選填）
          </label>
          <Textarea
            id="frequency-description"
            ref={refs.frequencyDescription}
            value={values.frequencyDescription}
            maxLength={200}
            rows={3}
            onChange={(e) => set("frequencyDescription", e.target.value)}
            aria-invalid={!!errors.frequencyDescription || undefined}
            aria-describedby={
              errors.frequencyDescription ? "frequency-description-error" : "frequency-description-hint"
            }
          />
          <p id="frequency-description-hint" className="text-xs text-muted-foreground">
            最多 200 個字元。
          </p>
          <FieldError
            id="frequency-description-error"
            message={errors.frequencyDescription}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="duration-value"
              className="text-sm font-medium text-foreground"
            >
              每次持續時間
            </label>
            <Input
              id="duration-value"
              ref={refs.durationValue}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={values.durationValue}
              onChange={(e) => set("durationValue", e.target.value)}
              aria-invalid={!!errors.durationValue || undefined}
              aria-describedby={errors.durationValue ? "duration-value-error" : undefined}
              className="min-h-11"
            />
            <FieldError id="duration-value-error" message={errors.durationValue} />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="duration-unit"
              className="text-sm font-medium text-foreground"
            >
              時間單位
            </label>
            <select
              id="duration-unit"
              ref={refs.durationUnit}
              value={values.durationUnit}
              onChange={(e) => set("durationUnit", e.target.value as DurationUnit)}
              aria-invalid={!!errors.durationUnit || undefined}
              aria-describedby={errors.durationUnit ? "duration-unit-error" : undefined}
              className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">請選擇</option>
              {DURATION_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
            <FieldError id="duration-unit-error" message={errors.durationUnit} />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function SymptomRadio({
  name,
  option,
  checked,
  onSelect,
  inputRef,
}: {
  name: string;
  option: SymptomOption;
  checked: boolean;
  onSelect: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null> | undefined;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent">
      <input
        type="radio"
        name={name}
        ref={inputRef}
        className="h-4 w-4 accent-primary"
        checked={checked}
        onChange={onSelect}
      />
      <span className="min-w-0">
        <span className="block truncate">{option.display_name}</span>
        {!option.is_other ? (
          <span className="block text-xs text-muted-foreground">
            {option.category_name}
          </span>
        ) : null}
      </span>
    </label>
  );
}
