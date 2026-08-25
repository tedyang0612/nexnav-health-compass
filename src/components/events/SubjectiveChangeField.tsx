import { FieldError } from "./FieldError";
import {
  SUBJECTIVE_CHANGE_OPTIONS,
  type SubjectiveChange,
} from "@/lib/daily-track";

/**
 * 和前一次相比的主觀變化。初始不預選，選取狀態以 radio、邊框與底色一致呈現。
 */
export function SubjectiveChangeField({
  value,
  onChange,
  comparisonLabel,
  error,
  firstOptionRef,
}: {
  value: SubjectiveChange | null;
  onChange: (next: SubjectiveChange) => void;
  comparisonLabel: string;
  error?: string | undefined;
  firstOptionRef?: React.RefObject<HTMLInputElement | null> | undefined;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span
          aria-hidden="true"
          className="inline-block h-4 w-1 shrink-0 rounded-full bg-primary"
        />
        <span className="min-w-0">和前一次相比</span>
      </legend>
      <p className="text-sm text-muted-foreground">{comparisonLabel}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {SUBJECTIVE_CHANGE_OPTIONS.map((option, index) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <input
                type="radio"
                name="subjective-change"
                ref={index === 0 ? firstOptionRef : undefined}
                className="h-4 w-4 shrink-0 accent-primary"
                checked={selected}
                onChange={() => onChange(option.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "subjective-change-error" : undefined}
              />
              <span className="min-w-0">{option.label}</span>
            </label>
          );
        })}
      </div>
      <FieldError id="subjective-change-error" message={error} />
    </fieldset>

  );
}
