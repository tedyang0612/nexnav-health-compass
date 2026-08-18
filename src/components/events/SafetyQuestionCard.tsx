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
      className="rounded-xl border border-border bg-surface-elevated p-4 sm:p-5"
      aria-describedby={describedBy}
    >
      <legend className="sr-only">{`第 ${index + 1} 題，共 ${total} 題：${question.question}`}</legend>
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {index + 1} / {total}　{question.label}
          </p>
          <p className="text-base font-medium text-foreground">{question.question}</p>
          {question.helper ? (
            <p id={describedBy} className="text-sm text-muted-foreground">
              {question.helper}
            </p>
          ) : null}
          {question.helperItems ? (
            <ul id={describedBy} className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {question.helperItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "是", val: true },
            { label: "否", val: false },
          ].map((opt) => {
            const selected = value === opt.val;
            return (
              <label
                key={opt.label}
                className={cn(
                  "flex min-h-12 cursor-pointer items-center justify-center rounded-lg border px-4 text-base font-medium transition-colors",
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
