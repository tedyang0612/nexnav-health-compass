import { Slider } from "@/components/ui/slider";

/** 1–10 困擾程度，僅以數值呈現，不加入解釋性標籤或顏色語意。 */
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
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">目前選擇</span>
        <span className="text-lg font-semibold text-foreground" aria-hidden="true">
          {value === null ? "尚未選擇" : `${value} / 10`}
        </span>
      </div>

      {value === null ? (
        <button
          id={id}
          type="button"
          onClick={() => onChange(5)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="flex min-h-11 w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          開始選擇困擾程度（1–10）
        </button>
      ) : (
        <Slider
          id={id}
          min={1}
          max={10}
          step={1}
          value={[value]}
          onValueChange={(next) => {
            const selected = next[0];
            if (selected !== undefined) onChange(selected);
          }}
          aria-label="目前困擾程度（1–10）"
          aria-valuetext={`${value} / 10`}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="py-2"
        />
      )}
    </div>
  );
}
