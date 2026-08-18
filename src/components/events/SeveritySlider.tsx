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
  value: number;
  onChange: (next: number) => void;
  describedBy?: string | undefined;
  invalid?: boolean | undefined;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">目前選擇</span>
        <span className="text-lg font-semibold text-foreground" aria-hidden="true">
          {value} / 10
        </span>
      </div>
      <Slider
        id={id}
        min={1}
        max={10}
        step={1}
        value={[value]}
        onValueChange={(next) => onChange(next[0] ?? value)}
        aria-label="目前困擾程度（1–10）"
        aria-valuetext={`${value} / 10`}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="py-2"
      />
    </div>
  );
}
