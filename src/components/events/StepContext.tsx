import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shell";
import { FieldError } from "./FieldError";
import {
  LIFE_CONTEXT_FIELDS,
  SUPPLEMENTAL_PROMPT,
  type EventFormValues,
  type LifeContextKey,
  type Step2Errors,
  type SymptomOption,
} from "@/lib/event-wizard";

type Setter = <K extends keyof EventFormValues>(
  key: K,
  value: EventFormValues[K],
) => void;

export function StepContext({
  values,
  errors,
  options,
  set,
  refs,
}: {
  values: EventFormValues;
  errors: Step2Errors;
  options: SymptomOption[];
  set: Setter;
  refs: {
    customAssociatedSymptoms: React.RefObject<HTMLInputElement | null>;
    sleep: React.RefObject<HTMLInputElement | null>;
    diet: React.RefObject<HTMLInputElement | null>;
    activity: React.RefObject<HTMLInputElement | null>;
    stress: React.RefObject<HTMLInputElement | null>;
    supplementalDescription: React.RefObject<HTMLTextAreaElement | null>;
  };
}) {
  const [customDraft, setCustomDraft] = useState("");

  const candidates = options.filter(
    (o) => !o.is_other && o.id !== values.primarySymptomId,
  );

  function toggle(id: string) {
    const has = values.associatedSymptomIds.includes(id);
    set(
      "associatedSymptomIds",
      has
        ? values.associatedSymptomIds.filter((x) => x !== id)
        : [...values.associatedSymptomIds, id],
    );
  }

  function addCustom() {
    const text = customDraft.trim();
    if (!text) return;
    if (values.customAssociatedSymptoms.some((t) => t.trim() === text)) {
      setCustomDraft("");
      return;
    }
    set("customAssociatedSymptoms", [...values.customAssociatedSymptoms, text]);
    setCustomDraft("");
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="相關症狀（選填）"
        description="若同時有其他不適，可以一併記錄。"
      >
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">相關症狀（可複選）</legend>
          {candidates.map((option) => (
            <label
              key={option.id}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={values.associatedSymptomIds.includes(option.id)}
                onChange={() => toggle(option.id)}
              />
              <span className="min-w-0">
                <span className="block truncate">{option.display_name}</span>
                <span className="block text-xs text-muted-foreground">
                  {option.category_name}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="space-y-1.5">
          <label
            htmlFor="custom-associated"
            className="text-sm font-medium text-foreground"
          >
            其他症狀（選填）
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="custom-associated"
              ref={refs.customAssociatedSymptoms}
              value={customDraft}
              maxLength={100}
              onChange={(e) => setCustomDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
              aria-invalid={!!errors.customAssociatedSymptoms || undefined}
              aria-describedby={
                errors.customAssociatedSymptoms
                  ? "custom-associated-error"
                  : "custom-associated-hint"
              }
              className="min-h-11"
            />
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:w-auto"
              onClick={addCustom}
            >
              加入
            </Button>
          </div>
          <p id="custom-associated-hint" className="text-xs text-muted-foreground">
            若上方沒有符合的選項，可自行加入其他症狀。每個項目最多 100 個字元。
          </p>
          <FieldError
            id="custom-associated-error"
            message={errors.customAssociatedSymptoms}
          />
          {values.customAssociatedSymptoms.length > 0 ? (
            <ul className="flex flex-wrap gap-2 pt-1">
              {values.customAssociatedSymptoms.map((text) => (
                <li key={text}>
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "customAssociatedSymptoms",
                        values.customAssociatedSymptoms.filter((t) => t !== text),
                      )
                    }
                    className="flex min-h-11 items-center gap-2 rounded-full border border-input px-4 text-sm"
                  >
                    <span>{text}</span>
                    <span className="text-muted-foreground">移除</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="生活狀況"
        description="以下四項皆為必填，僅用於整理紀錄，不代表任何健康判斷。"
      >
        {LIFE_CONTEXT_FIELDS.map((field) => (
          <fieldset key={field.key} className="space-y-4 border-t border-border first:border-0 mt-3 first:mt-0">
            <legend className="m-0 flex items-center gap-2 text-sm font-semibold text-foreground">
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
                    name={`life-${field.key}`}
                    ref={index === 0 ? refs[field.key as LifeContextKey] : undefined}
                    className="h-4 w-4 shrink-0 accent-primary"
                    checked={values[field.key] === option.value}
                    onChange={() => set(field.key, option.value)}
                    aria-describedby={
                      errors[field.key] ? `life-${field.key}-error` : undefined
                    }
                  />
                  <span className="min-w-0">{option.label}</span>
                </label>
              ))}
            </div>
            <FieldError id={`life-${field.key}-error`} message={errors[field.key]} />
          </fieldset>
        ))}

      </SectionCard>

      <SectionCard title="補充描述（選填）">
        <div className="space-y-1.5">
          <label
            htmlFor="supplemental"
            className="text-sm font-medium text-foreground"
          >
            {SUPPLEMENTAL_PROMPT}
          </label>
          <Textarea
            id="supplemental"
            ref={refs.supplementalDescription}
            value={values.supplementalDescription}
            maxLength={1000}
            rows={5}
            onChange={(e) => set("supplementalDescription", e.target.value)}
            aria-invalid={!!errors.supplementalDescription || undefined}
            aria-describedby={
              errors.supplementalDescription
                ? "supplemental-error"
                : "supplemental-hint"
            }
          />
          <p id="supplemental-hint" className="text-xs text-muted-foreground">
            最多 1000 個字元。
          </p>
          <FieldError id="supplemental-error" message={errors.supplementalDescription} />
        </div>
      </SectionCard>
    </div>
  );
}
