import { cn } from "@/lib/utils";
import type { SafetyQuestion } from "@/lib/safety";

/** 單題 Safety 問題卡：是 / 否 二擇一，未作答不預設為否。 */
export function SafetyQuestionCard({
  index,
  total,
  question,
  value,
  onChange,
  disabled,
}: {
  index: number;
  total: number;
  question: SafetyQuestion;
  value: boolean | undefined;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const name = `safety-${question.key}`;
  const describedBy = question.helper || question.helperItems ? `${name}-help` : undefined;

  return (
    <fieldset
      className="rounded-xl border border-border bg-surface-elevated p-3.5 sm:p-4"
      aria-describedby={describedBy}
    >
      <legend className="sr-only">{`第 ${index + 1} 題，共 ${total} 題：${question.question}`}</legend>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
        <div className="flex min-w-0 gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold tabular-nums text-primary"
          >
            {index + 1}
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-bold leading-relaxed text-foreground sm:text-base">
              {question.question}
            </p>
            {question.helper ? (
              <p id={describedBy} className="text-sm leading-relaxed text-foreground/70">
                {question.helper}
              </p>
            ) : null}
            {question.helperItems ? (
              <ul
                id={describedBy}
                className="list-disc space-y-0.5 pl-5 text-sm leading-relaxed text-foreground/70"
              >
                {question.helperItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 sm:w-40">
          {[
            { label: "是", val: true },
            { label: "否", val: false },
          ].map((opt) => {
            const selected = value === opt.val;
            return (
              <label
                key={opt.label}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors",
                  "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-foreground hover:bg-muted",
                  disabled && "pointer-events-none opacity-60",
                )}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name={name}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => onChange(opt.val)}
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}
