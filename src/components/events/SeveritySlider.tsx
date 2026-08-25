import { cn } from "@/lib/utils";

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * 1–10 困擾程度：數字點選，不使用 slider。
 * 僅以數值呈現，不加入解釋性標籤或顏色語意。
 */
export function SeveritySlider({
  id,
  value,
  onChange,
  describedBy,
  invalid,
}: {
  id: string;
  value: number | null;
  onChange: (next: number) => void;
  describedBy?: string | undefined;
  invalid?: boolean | undefined;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-muted-foreground">目前選擇</span>
        <span className="text-sm font-semibold text-foreground">
          {value === null ? "尚未選擇" : `${value} / 10`}
        </span>
      </div>

      <div
        id={id}
        role="radiogroup"
        aria-label="目前困擾程度（1–10）"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(
          "grid grid-cols-5 gap-1.5 sm:grid-cols-10",
          invalid && "rounded-lg ring-2 ring-destructive/50",
        )}
      >
        {LEVELS.map((level) => {
          const selected = value === level;
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${level} / 10`}
              onClick={() => onChange(level)}
              className={cn(
                "flex min-h-11 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background text-foreground hover:border-primary/40 hover:bg-accent",
              )}
            >
              {level}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1（輕微）</span>
        <span>10（嚴重）</span>
      </div>
    </div>
  );
}
